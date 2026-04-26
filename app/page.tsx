"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { auth, db, firebaseConfigured } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import {
  Loader2,
  Settings,
  TrendingDown,
  Users,
  Search,
  X,
} from "lucide-react";

import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";
import { NovoClienteForm } from "@/components/NovoClienteForm";
import { ClienteCard } from "@/components/ClienteCard";
import { EditClienteDialog } from "@/components/EditClienteDialog";
import { DespesaList } from "@/components/DespesaList";
import { ConfigDialog } from "@/components/ConfigDialog";
import { Toast } from "@/components/Toast";
import { Sidebar } from "@/components/Sidebar";

import { Acesso, Despesa, Filter, ImportFeedback, Tab, UsuarioAgrupado } from "@/lib/types";
import { APP_OPTIONS, DEFAULT_COBRANCA_MSG, FALLBACK_COLUMNS, FIELD_ALIASES } from "@/lib/constants";
import {
  escapeCsvValue,
  isValidPhone,
  normalizeHeader,
  normalizePhone,
  parseCsv,
  parseFlexibleDate,
} from "@/lib/utils";

function parseCurrency(value: string) {
  const cleaned = value.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateForCsv(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function getFieldValue(row: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const match = row[normalizeHeader(alias)];
    if (match) return match;
  }
  return "";
}

export default function HomePage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [dadosLoading, setDadosLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("clientes");
  const [activeFilter, setActiveFilter] = useState<Filter>("todos");
  const [editando, setEditando] = useState<Acesso | null>(null);
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null);
  const [importando, setImportando] = useState(false);
  const [toast, setToast] = useState<ImportFeedback | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [mensagemCobranca, setMensagemCobranca] = useState(DEFAULT_COBRANCA_MSG);
  const [busca, setBusca] = useState("");

  // Dark mode toggle
  useEffect(() => {
    const saved = localStorage.getItem("esa_dark");
    if (saved === "1") { setDarkMode(true); document.documentElement.classList.add("dark"); }
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("esa_dark", next ? "1" : "0");
  }

  // Load saved cobrança message
  useEffect(() => {
    const saved = localStorage.getItem("esa_cobranca_msg");
    if (saved) setMensagemCobranca(saved);
  }, []);

  function handleSalvarMensagem(msg: string) {
    setMensagemCobranca(msg);
    localStorage.setItem("esa_cobranca_msg", msg);
    setToast({ type: "success", message: "Mensagem de cobrança salva!" });
  }

  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) { setAcessos([]); setDespesas([]); setDadosLoading(false); return; }
    setDadosLoading(true);
    const acessosQ = query(collection(db, "acessos"), where("userId", "==", user.uid));
    const despesasQ = query(collection(db, "despesas"), where("userId", "==", user.uid));
    const unsubA = onSnapshot(acessosQ, (snap) => {
      setAcessos(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Acesso[]);
      setDadosLoading(false);
    });
    const unsubD = onSnapshot(despesasQ, (snap) => {
      setDespesas(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Despesa[]);
    });
    return () => { unsubA(); unsubD(); };
  }, [user]);

  async function addCliente({ nomeUser, cliente, telefone, valor, app }: {
    nomeUser: string; cliente: string; telefone: string; valor: string; app: string;
  }) {
    if (!user || !db) return;
    const clientesMesmoUsuario = acessos.filter(
      (item) => item.usuario.trim().toLowerCase() === nomeUser.trim().toLowerCase()
    );
    if (clientesMesmoUsuario.length >= 3) {
      setToast({ type: "error", message: "Máximo de 3 clientes por usuário" }); return;
    }
    if (app === "P2P" && clientesMesmoUsuario.some((item) => item.app === "P2P")) {
      setToast({ type: "error", message: "Esse usuário já possui P2P" }); return;
    }
    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 30);
    await addDoc(collection(db, "acessos"), {
      usuario: nomeUser.trim(),
      cliente: cliente.trim(),
      telefone: normalizePhone(telefone),
      valor: Number(valor) || 0,
      app,
      vencimento: vencimento.toISOString(),
      data: new Date().toISOString(),
      createdAt: Timestamp.now(),
      userId: user.uid,
    });
    setToast({ type: "success", message: `Cliente "${cliente}" adicionado!` });
  }

  async function handleRenovar(id: string) {
    if (!db) return;
    const item = acessos.find((a) => a.id === id);
    if (!item) return;

    const hoje = new Date();
    const dataVencimentoAtual = new Date(item.vencimento);
    
    // Se já venceu, renova a partir de hoje. Se não venceu, adiciona 30 dias à data atual de vencimento.
    const novaData = dataVencimentoAtual > hoje ? dataVencimentoAtual : hoje;
    novaData.setDate(novaData.getDate() + 30);

    await updateDoc(doc(db, "acessos", id), {
      vencimento: novaData.toISOString(),
      data: hoje.toISOString(), // Atualiza a data da última renovação
    });
    
    setToast({ type: "success", message: `Acesso de "${item.cliente}" renovado!` });
  }

  function exportarClientesCsv() {
    const linhas = [
      ["usuario", "cliente", "whatsapp", "valor", "app", "vencimento", "data"].join(";"),
      ...acessos
        .slice()
        .sort((a, b) => a.usuario.localeCompare(b.usuario))
        .map((item) =>
          [
            escapeCsvValue(item.usuario),
            escapeCsvValue(item.cliente),
            escapeCsvValue(item.telefone),
            escapeCsvValue(Number(item.valor || 0).toFixed(2)),
            escapeCsvValue(item.app),
            escapeCsvValue(formatDateForCsv(item.vencimento)),
            escapeCsvValue(formatDateForCsv(item.data)),
          ].join(";")
        ),
    ];
    const blob = new Blob([`\uFEFF${linhas.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clientes-esa-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ type: "info", message: "CSV exportado com sucesso!" });
  }

  async function processarImportacao(rows: string[][], sourceLabel?: string) {
    if (!user || !db) return;
    if (rows.length < 2) throw new Error("A planilha está vazia ou sem linhas de dados.");

    const headers = rows[0].map((h) => normalizeHeader(h));
    const headersReconhecidos = Object.values(FIELD_ALIASES).flat().some((a) => headers.includes(normalizeHeader(a)));
    const dataRows = rows.slice(1);
    const counts = new Map<string, number>();
    const p2pUsers = new Set<string>();

    acessos.forEach((item) => {
      const key = item.usuario.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (normalizeHeader(item.app) === "p2p") p2pUsers.add(key);
    });

    let importados = 0;
    let semWhatsapp = 0;
    const erros: string[] = [];
    const BATCH_SIZE = 400;
    let batch = writeBatch(db);
    let batchCount = 0;

    for (let index = 0; index < dataRows.length; index++) {
      const values = dataRows[index];
      const row: Record<string, string> = {};
      if (headersReconhecidos) {
        headers.forEach((h, i) => { row[h] = values[i]?.trim() ?? ""; });
      } else {
        FALLBACK_COLUMNS.forEach((col, i) => { row[col] = values[i]?.trim() ?? ""; });
      }

      const usuario = getFieldValue(row, FIELD_ALIASES.usuario).trim();
      const cliente = getFieldValue(row, FIELD_ALIASES.cliente).trim();
      const telefoneInformado = getFieldValue(row, FIELD_ALIASES.telefone).trim();
      const telefone = normalizePhone(telefoneInformado);
      const app = getFieldValue(row, FIELD_ALIASES.app).trim() || "P2P";
      const valorImportado = getFieldValue(row, FIELD_ALIASES.valor).trim();
      const vencimentoImportado = getFieldValue(row, FIELD_ALIASES.vencimento).trim();
      const dataImportada = getFieldValue(row, FIELD_ALIASES.data).trim();

      if (!usuario || !cliente) { erros.push(`Linha ${index + 2}: faltou usuário ou cliente.`); continue; }
      if (telefone && !isValidPhone(telefone)) { erros.push(`Linha ${index + 2}: WhatsApp inválido para ${cliente}.`); continue; }

      const usuarioKey = usuario.toLowerCase();
      const totalAtual = counts.get(usuarioKey) ?? 0;
      const isP2P = normalizeHeader(app) === "p2p";

      if (totalAtual >= 3) { erros.push(`Linha ${index + 2}: ${usuario} já atingiu o limite de 3 clientes.`); continue; }
      if (isP2P && p2pUsers.has(usuarioKey)) { erros.push(`Linha ${index + 2}: ${usuario} já possui P2P.`); continue; }

      const dataBase = new Date(); dataBase.setDate(dataBase.getDate() + 30);
      const docRef = doc(collection(db, "acessos"));
      batch.set(docRef, {
        usuario, cliente, telefone,
        valor: parseCurrency(valorImportado),
        app,
        vencimento: parseFlexibleDate(vencimentoImportado) || dataBase.toISOString(),
        data: parseFlexibleDate(dataImportada) || new Date().toISOString(),
        createdAt: Timestamp.now(),
        userId: user.uid,
      });

      counts.set(usuarioKey, totalAtual + 1);
      if (isP2P) p2pUsers.add(usuarioKey);
      if (!telefone) semWhatsapp++;
      importados++;
      batchCount++;

      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) await batch.commit();

    const resumo: string[] = [`${importados} cliente(s) importado(s).`];
    if (sourceLabel) resumo.push(`Origem: ${sourceLabel}.`);
    if (semWhatsapp > 0) resumo.push(`${semWhatsapp} sem WhatsApp para completar depois.`);
    if (erros.length > 0) resumo.push(`${erros.length} linha(s) ignorada(s): ${erros.slice(0, 3).join(" ")}`);

    setImportFeedback({ type: importados > 0 ? "success" : "error", message: resumo.join(" ") });
  }

  async function importarClientesCsv(event: ChangeEvent<HTMLInputElement>) {
    if (!user || !db) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setImportando(true); setImportFeedback(null);
    try {
      const text = await file.text();
      await processarImportacao(parseCsv(text));
    } catch (e: unknown) {
      setImportFeedback({ type: "error", message: e instanceof Error ? e.message : "Erro ao importar." });
    } finally {
      event.target.value = "";
      setImportando(false);
    }
  }

  async function importarGoogleSheet(url: string) {
    if (!user || !db) return;
    if (!url.trim()) { setImportFeedback({ type: "error", message: "Cole o link da planilha." }); return; }
    setImportando(true); setImportFeedback(null);
    try {
      const res = await fetch("/api/google-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const payload = await res.json() as { csv?: string; error?: string; sourceLabel?: string };
      if (!res.ok || !payload.csv) throw new Error(payload.error || "Não foi possível ler a planilha.");
      await processarImportacao(parseCsv(payload.csv), payload.sourceLabel);
    } catch (e: unknown) {
      setImportFeedback({ type: "error", message: e instanceof Error ? e.message : "Erro ao importar." });
    } finally {
      setImportando(false);
    }
  }

  async function addDespesa(descricao: string, valor: string) {
    if (!user || !db) return;
    await addDoc(collection(db, "despesas"), {
      descricao: descricao.trim(),
      valor: Number(valor),
      data: new Date().toISOString(),
      createdAt: Timestamp.now(),
      userId: user.uid,
    });
    setToast({ type: "success", message: "Despesa adicionada!" });
  }

  async function remover(id: string, tipo: "acessos" | "despesas") {
    if (!db) return;
    await deleteDoc(doc(db, tipo, id));
    setToast({ type: "info", message: tipo === "acessos" ? "Cliente removido." : "Despesa removida." });
  }

  async function salvarEdicao(id: string, data: Partial<Acesso>) {
    if (!db) return;
    await updateDoc(doc(db, "acessos", id), data);
    setToast({ type: "success", message: "Cliente atualizado!" });
  }

  const usuariosAgrupados: UsuarioAgrupado[] = useMemo(() => {
    const groups: Record<string, Acesso[]> = {};
    acessos.forEach((item) => {
      if (!groups[item.usuario]) groups[item.usuario] = [];
      groups[item.usuario].push(item);
    });
    return Object.keys(groups)
      .map((nome) => ({
        nome,
        clientes: groups[nome].sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()),
        temP2P: groups[nome].some((item) => item.app === "P2P"),
      }))
      .sort((a, b) => {
        if (a.temP2P !== b.temP2P) return a.temP2P ? 1 : -1;
        return a.clientes.length - b.clientes.length;
      });
  }, [acessos]);

  const usuariosFiltrados = useMemo(() => {
    let list = usuariosAgrupados;

    // Apply status filter
    if (activeFilter !== "todos") {
      const hoje = Date.now();
      list = list.map(grupo => ({
        ...grupo,
        clientes: grupo.clientes.filter(c => {
          const dias = Math.ceil((new Date(c.vencimento).getTime() - hoje) / (1000 * 60 * 60 * 24));
          if (activeFilter === "vencidos") return dias <= 0;
          if (activeFilter === "vencendo") return dias > 0 && dias <= 3;
          if (activeFilter === "ativos") return dias > 3;
          return true;
        })
      })).filter(g => g.clientes.length > 0);
    }

    // Apply search filter
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.map((grupo) => ({
        ...grupo,
        clientes: grupo.clientes.filter(
          (c) =>
            c.cliente.toLowerCase().includes(q) ||
            c.usuario.toLowerCase().includes(q) ||
            c.app.toLowerCase().includes(q) ||
            c.telefone.includes(q)
        ),
      })).filter((g) => g.clientes.length > 0 || g.nome.toLowerCase().includes(q));
    }

    return list;
  }, [usuariosAgrupados, activeFilter, busca]);

  const appOptions = useMemo(
    () => Array.from(new Set([...APP_OPTIONS, ...acessos.map((a) => a.app).filter(Boolean)])).sort(),
    [acessos]
  );

  useEffect(() => {
    if (activeTab === "configuracoes") {
      setConfigOpen(true);
      setActiveTab("clientes");
    }
  }, [activeTab]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!firebaseConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 dark:bg-slate-900">
        <Card className="w-full max-w-lg shadow-xl">
          <CardContent className="space-y-4 p-6">
            <h1 className="text-2xl font-bold text-center">ESA GESTOR</h1>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Configure as variáveis de ambiente do Firebase na Vercel para começar.
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!user) return <LoginForm />;

  return (
    <div className="flex min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        darkMode={darkMode}
        toggleDark={toggleDark}
        onLogout={() => auth && signOut(auth)}
        userEmail={user.email}
      />

      <main className="flex-1 transition-all duration-300 md:pl-64">
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          {/* Header (Desktop: Hidden or simplified, Mobile: Visible) */}
          <header className="mb-8 flex items-center justify-between md:hidden">
            <h1 className="text-xl font-bold text-blue-600">ESA GESTOR</h1>
            <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </header>

          {/* Page Content */}
          <div className="space-y-8">
            {/* Dashboard */}
            <Dashboard acessos={acessos} despesas={despesas} usuariosAgrupados={usuariosAgrupados} />

            {/* Content Area */}
            {activeTab === "clientes" && (
              <div className="space-y-6">
                <NovoClienteForm
                  acessos={acessos}
                  appOptions={appOptions}
                  importFeedback={importFeedback}
                  importando={importando}
                  onAddCliente={addCliente}
                  onExportarCsv={exportarClientesCsv}
                  onImportarCsv={importarClientesCsv}
                  onImportarGoogleSheet={importarGoogleSheet}
                />

                {/* Search & Results Info */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="h-11 pl-10 pr-10 dark:border-slate-800 dark:bg-slate-900"
                      placeholder="Buscar por usuário, cliente, app ou telefone..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                    {busca && (
                      <button
                        onClick={() => setBusca("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {activeFilter !== "todos" && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>Filtro ativo:</span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setActiveFilter("todos")} className="h-8 px-2 text-xs">
                        Limpar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Client List */}
                <div className="grid gap-6">
                  {dadosLoading ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    </div>
                  ) : usuariosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-20 dark:border-slate-800">
                      <Users className="mb-4 h-12 w-12 text-slate-300" />
                      <p className="text-slate-500">
                        {busca ? "Nenhum resultado encontrado para sua busca." : "Nenhum cliente encontrado com este filtro."}
                      </p>
                      {activeFilter !== "todos" && (
                        <Button variant="ghost" onClick={() => setActiveFilter("todos")}>
                          Ver todos os clientes
                        </Button>
                      )}
                    </div>
                  ) : (
                    usuariosFiltrados.map((grupo) => (
                      <div key={grupo.nome} className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                            {grupo.nome}
                            <span className="ml-2 text-sm font-normal text-slate-500">
                              ({grupo.clientes.length} cliente{grupo.clientes.length !== 1 ? "s" : ""})
                            </span>
                          </h3>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {grupo.clientes.map((item) => (
                            <ClienteCard
                              key={item.id}
                              item={item}
                              mensagemCobranca={mensagemCobranca}
                              onEditar={setEditando}
                              onRemover={(id) => remover(id, "acessos")}
                              onRenovar={handleRenovar}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "despesas" && (
              <DespesaList
                despesas={despesas}
                onAdd={addDespesa}
                onRemover={(id) => remover(id, "despesas")}
              />
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <EditClienteDialog
        acesso={editando}
        appOptions={appOptions}
        onSalvar={salvarEdicao}
        onFechar={() => setEditando(null)}
      />

      <ConfigDialog
        open={configOpen}
        onFechar={() => {
          setConfigOpen(false);
          setActiveTab("clientes");
        }}
        mensagem={mensagemCobranca}
        onSalvar={handleSalvarMensagem}
      />

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
