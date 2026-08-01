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
  setDoc,
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
  ShieldCheck,
  UserCheck,
  UserX,
  RotateCw,
  Copy,
  Check,
} from "lucide-react";

import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";
import { NovoClienteForm } from "@/components/NovoClienteForm";
import { ClienteCard } from "@/components/ClienteCard";
import { EditClienteDialog } from "@/components/EditClienteDialog";
import { RenovarAcessoDialog } from "@/components/RenovarAcessoDialog";
import { DespesaList } from "@/components/DespesaList";
import { ConfigDialog } from "@/components/ConfigDialog";
import { Toast } from "@/components/Toast";
import { Sidebar } from "@/components/Sidebar";
import { PagamentosList } from "@/components/PagamentosList";
import { BulkActionBar } from "@/components/BulkActionBar";
import { enviarResumoAlertasEmail } from "@/lib/email";
import { TelaLicencaBloqueada } from "@/components/TelaLicencaBloqueada";

import { Acesso, Despesa, Pagamento, Filter, ImportFeedback, Tab, UsuarioAgrupado } from "@/lib/types";
import { APP_OPTIONS, DEFAULT_COBRANCA_MSG, DEFAULT_RENOVACAO_MSG, FALLBACK_COLUMNS, FIELD_ALIASES } from "@/lib/constants";
import {
  escapeCsvValue,
  isValidPhone,
  normalizeHeader,
  normalizePhone,
  parseCsv,
  parseFlexibleDate,
  parseGoogleSheetUrl,
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
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [dadosLoading, setDadosLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [activeFilter, setActiveFilter] = useState<Filter>("todos");
  const [editando, setEditando] = useState<Acesso | null>(null);
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null);
  const [importando, setImportando] = useState(false);
  const [toast, setToast] = useState<ImportFeedback | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [mensagemCobranca, setMensagemCobranca] = useState(DEFAULT_COBRANCA_MSG);
  const [mensagemRenovacao, setMensagemRenovacao] = useState(DEFAULT_RENOVACAO_MSG);
  const [pixKey, setPixKey] = useState("");
  const [pixNome, setPixNome] = useState("");
  const [pixCidade, setPixCidade] = useState("");
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [whatsappGestor, setWhatsappGestor] = useState("");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina] = useState(12);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [renovandoAcesso, setRenovandoAcesso] = useState<Acesso | null>(null);
  
  // Estados de Licenciamento SaaS
  const [licenca, setLicenca] = useState<any | null>(null);
  const [licencasLoading, setLicencasLoading] = useState(true);
  const [usuariosSaaS, setUsuariosSaaS] = useState<any[]>([]);
  const [buscaSaaS, setBuscaSaaS] = useState("");

  // Reset pagination and selection on search or filter change
  useEffect(() => {
    setPagina(1);
    setSelecionados([]);
  }, [busca, activeFilter]);

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

  // Load saved configuracoes in real-time from Firestore
  useEffect(() => {
    if (!user || !db) return;
    const configDocRef = doc(db, "configuracoes", user.uid);
    const unsubConfig = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.mensagemCobranca) setMensagemCobranca(data.mensagemCobranca);
        if (data.mensagemRenovacao) setMensagemRenovacao(data.mensagemRenovacao);
        setPixKey(data.pixKey || "");
        setPixNome(data.pixNome || "");
        setPixCidade(data.pixCidade || "");
        setMpAccessToken(data.mpAccessToken || "");
        setWhatsappGestor(data.whatsappGestor || "");
      }
    });
    return () => unsubConfig();
  }, [user]);

  async function handleSalvarConfiguracoes(data: {
    mensagemCobranca: string;
    mensagemRenovacao: string;
    pixKey: string;
    pixNome: string;
    pixCidade: string;
    mpAccessToken: string;
    whatsappGestor: string;
  }) {
    if (!user || !db) return;
    try {
      const configDocRef = doc(db, "configuracoes", user.uid);
      await setDoc(configDocRef, {
        userId: user.uid,
        ...data,
      }, { merge: true });
      setToast({ type: "success", message: "Configurações salvas!" });
    } catch (e) {
      console.error("Erro ao salvar configurações:", e);
      setToast({ type: "error", message: "Erro ao salvar configurações." });
    }
  }

  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return () => unsubscribe();
  }, []);

  // Escutar licença do usuário logado
  useEffect(() => {
    if (!user || !db) { setLicenca(null); setLicencasLoading(false); return; }
    
    if (user.email === "elison28araujo@gmail.com") {
      setLicenca({ status: "active", email: user.email, codigo: "MASTER", role: "admin" });
      setLicencasLoading(false);
      return;
    }

    setLicencasLoading(true);
    const docRef = doc(db, "usuarios", user.uid);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setLicenca(docSnap.data());
      } else {
        const randomCode = "ESA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const novoUserDoc = {
          uid: user.uid,
          email: user.email || "",
          whatsapp: "",
          status: "pending",
          codigo: randomCode,
          vencimentoLicenca: "",
          createdAt: new Date().toISOString(),
        };
        setDoc(docRef, novoUserDoc).then(() => {
          setLicenca(novoUserDoc);
        });
      }
      setLicencasLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Escutar todos os usuários SaaS (apenas para Admin Master)
  useEffect(() => {
    if (!user || !db || user.email !== "elison28araujo@gmail.com") { setUsuariosSaaS([]); return; }
    
    const q = query(collection(db, "usuarios"));
    const unsub = onSnapshot(q, (snap) => {
      setUsuariosSaaS(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    return () => unsub();
  }, [user]);

  async function handleRenovarLicenca(uid: string, vencimentoAtual?: string) {
    if (!db) return;
    const hoje = new Date();
    let novaData = vencimentoAtual ? new Date(vencimentoAtual) : hoje;
    if (novaData < hoje) novaData = hoje;
    novaData.setDate(novaData.getDate() + 30);
    
    try {
      await updateDoc(doc(db, "usuarios", uid), {
        status: "active",
        vencimentoLicenca: novaData.toISOString(),
      });
      setToast({ type: "success", message: "Licença renovada por 30 dias!" });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Erro ao renovar licença." });
    }
  }

  async function handleBloquearUsuario(uid: string, status: "blocked" | "pending") {
    if (!db) return;
    try {
      await updateDoc(doc(db, "usuarios", uid), { status });
      setToast({ type: "info", message: status === "blocked" ? "Usuário bloqueado." : "Usuário suspenso (pendente)." });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Erro ao atualizar status." });
    }
  }

  async function handleExcluirUsuario(uid: string) {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "usuarios", uid));
      setToast({ type: "info", message: "Cadastro de usuário excluído." });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Erro ao excluir usuário." });
    }
  }

  useEffect(() => {
    if (!user || !db) { setAcessos([]); setDespesas([]); setPagamentos([]); setDadosLoading(false); return; }
    setDadosLoading(true);
    const acessosQ = query(collection(db, "acessos"), where("userId", "==", user.uid));
    const despesasQ = query(collection(db, "despesas"), where("userId", "==", user.uid));
    const pagamentosQ = query(collection(db, "pagamentos"), where("userId", "==", user.uid));
    const unsubA = onSnapshot(acessosQ, (snap) => {
      setAcessos(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Acesso[]);
      setDadosLoading(false);
    });
    const unsubD = onSnapshot(despesasQ, (snap) => {
      setDespesas(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Despesa[]);
    });
    const unsubP = onSnapshot(pagamentosQ, (snap) => {
      setPagamentos(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Pagamento[]);
    });
    return () => { unsubA(); unsubD(); unsubP(); };
  }, [user]);

  // Daily email alert check
  useEffect(() => {
    if (!user || acessos.length === 0) return;

    const emailAlertsEnabled = localStorage.getItem("esa_email_alerts") !== "0"; // Default enabled
    if (!emailAlertsEnabled) return;

    const lastAlertDate = localStorage.getItem("esa_last_email_alert_date");
    const today = new Date().toISOString().slice(0, 10);

    if (lastAlertDate === today) return;

    if (user.email) {
      enviarResumoAlertasEmail(user.email, acessos).then((sent) => {
        if (sent) {
          localStorage.setItem("esa_last_email_alert_date", today);
          setToast({ type: "info", message: "Resumo de vencimentos enviado para seu e-mail." });
        }
      }).catch((err) => {
        console.error("Erro no envio do e-mail diário:", err);
      });
    }
  }, [user, acessos]);

  async function addCliente({ nomeUser, cliente, telefone, valor, app, enderecoMac, chaveKey }: {
    nomeUser: string; cliente: string; telefone: string; valor: string; app: string; enderecoMac?: string; chaveKey?: string;
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
    const valNumerico = Number(valor) || 0;
    const docRef = await addDoc(collection(db, "acessos"), {
      usuario: nomeUser.trim(),
      cliente: cliente.trim(),
      telefone: normalizePhone(telefone),
      valor: valNumerico,
      app,
      vencimento: vencimento.toISOString(),
      data: new Date().toISOString(),
      createdAt: Timestamp.now(),
      userId: user.uid,
      enderecoMac: (enderecoMac || "").trim(),
      chaveKey: (chaveKey || "").trim(),
    });
    // Criar registro inicial de pagamento
    await addDoc(collection(db, "pagamentos"), {
      acessoId: docRef.id,
      usuario: nomeUser.trim(),
      cliente: cliente.trim(),
      app,
      valor: valNumerico,
      data: new Date().toISOString(),
      userId: user.uid,
    });
    setToast({ type: "success", message: `Cliente "${cliente}" adicionado!` });
  }

  function handleRenovar(id: string) {
    const item = acessos.find((a) => a.id === id);
    if (item) {
      setRenovandoAcesso(item);
    }
  }

  async function handleConfirmarRenovacao(id: string, meses: number, valorCobrado: number) {
    if (!db || !user) return;
    const item = acessos.find((a) => a.id === id);
    if (!item) return;

    const hoje = new Date();
    const dataVencimentoAtual = new Date(item.vencimento);
    
    // Se já venceu, renova a partir de hoje. Se não venceu, adiciona meses
    const novaData = dataVencimentoAtual > hoje ? new Date(dataVencimentoAtual) : new Date(hoje);
    novaData.setMonth(novaData.getMonth() + meses);

    try {
      await updateDoc(doc(db, "acessos", id), {
        vencimento: novaData.toISOString(),
        data: hoje.toISOString(), // Atualiza a data da última renovação
      });

      // Registrar pagamento no histórico com o valor final cobrado
      await addDoc(collection(db, "pagamentos"), {
        acessoId: id,
        usuario: item.usuario,
        cliente: item.cliente,
        app: item.app,
        valor: valorCobrado,
        data: hoje.toISOString(),
        userId: user.uid,
      });
      
      setToast({ type: "success", message: `Acesso de "${item.cliente}" renovado por ${meses} ${meses === 1 ? "mês" : "meses"}!` });
      setRenovandoAcesso(null);

      // Enviar WhatsApp de renovação se tiver telefone
      const phone = item.telefone.replace(/\D/g, "");
      if (phone) {
        const vencimentoFormatado = novaData.toLocaleDateString("pt-BR");
        const mensagem = mensagemRenovacao
          .replace("{cliente}", item.cliente)
          .replace("{app}", item.app)
          .replace("{usuario}", item.usuario)
          .replace("{vencimento}", vencimentoFormatado);
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`, "_blank");
      }
    } catch (e) {
      console.error(e);
      setToast({ type: "error", message: "Erro ao renovar acesso." });
    }
  }

  function exportarClientesCsv() {
    const linhas = [
      ["usuario", "cliente", "whatsapp", "valor", "app", "vencimento", "data", "mac", "key"].join(";"),
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
            escapeCsvValue(item.enderecoMac || ""),
            escapeCsvValue(item.chaveKey || ""),
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
    const BATCH_SIZE = 200; // Reduzido pois gravamos 2 docs por linha (acesso + pagamento)
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
      const enderecoMac = getFieldValue(row, FIELD_ALIASES.enderecoMac).trim();
      const chaveKey = getFieldValue(row, FIELD_ALIASES.chaveKey).trim();

      if (!usuario || !cliente) { erros.push(`Linha ${index + 2}: faltou usuário ou cliente.`); continue; }
      if (telefone && !isValidPhone(telefone)) { erros.push(`Linha ${index + 2}: WhatsApp inválido para ${cliente}.`); continue; }

      const usuarioKey = usuario.toLowerCase();
      const totalAtual = counts.get(usuarioKey) ?? 0;
      const isP2P = normalizeHeader(app) === "p2p";

      if (totalAtual >= 3) { erros.push(`Linha ${index + 2}: ${usuario} já atingiu o limite de 3 clientes.`); continue; }
      if (isP2P && p2pUsers.has(usuarioKey)) { erros.push(`Linha ${index + 2}: ${usuario} já possui P2P.`); continue; }

      const dataBase = new Date(); dataBase.setDate(dataBase.getDate() + 30);
      const dataVenc = parseFlexibleDate(vencimentoImportado) || dataBase.toISOString();
      let dataCad = parseFlexibleDate(dataImportada) || new Date().toISOString();
      const val = parseCurrency(valorImportado);

      // Se a data de cadastro importada for no futuro, ou igual à data de vencimento,
      // deduzimos que a planilha colocou o vencimento no campo data e corrigimos para
      // a data real de início do ciclo (dataVenc - 30 dias).
      const dtCad = new Date(dataCad);
      const dtVenc = new Date(dataVenc);
      if (dtCad > new Date() || dtCad.getTime() === dtVenc.getTime()) {
        const dtInicio = new Date(dtVenc);
        dtInicio.setDate(dtInicio.getDate() - 30);
        dataCad = dtInicio.toISOString();
      }

      const docRef = doc(collection(db, "acessos"));
      batch.set(docRef, {
        usuario, cliente, telefone,
        valor: val,
        app,
        vencimento: dataVenc,
        data: dataCad,
        createdAt: Timestamp.now(),
        userId: user.uid,
        enderecoMac,
        chaveKey,
      });

      // Gravar pagamento correspondente
      const pagDocRef = doc(collection(db, "pagamentos"));
      batch.set(pagDocRef, {
        acessoId: docRef.id,
        usuario,
        cliente,
        app,
        valor: val,
        data: dataCad,
        userId: user.uid,
      });

      counts.set(usuarioKey, totalAtual + 1);
      if (isP2P) p2pUsers.add(usuarioKey);
      if (!telefone) semWhatsapp++;
      importados++;
      batchCount += 2;

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
      const { spreadsheetId, gid } = parseGoogleSheetUrl(url);
      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(exportUrl)}`;
      
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Não foi possível ler a planilha. Verifique se ela está pública.");
      
      const csv = await res.text();
      if (!csv.trim()) throw new Error("A planilha retornou vazia.");

      await processarImportacao(parseCsv(csv), `Google Sheets (gid ${gid})`);
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

  async function remover(id: string, tipo: "acessos" | "despesas" | "pagamentos") {
    if (!db) return;
    await deleteDoc(doc(db, tipo, id));
    let msg = "";
    if (tipo === "acessos") msg = "Cliente removido.";
    else if (tipo === "despesas") msg = "Despesa removida.";
    else if (tipo === "pagamentos") msg = "Pagamento estornado.";
    setToast({ type: "info", message: msg });
  }

  async function salvarEdicao(id: string, data: Partial<Acesso>) {
    if (!db) return;
    await updateDoc(doc(db, "acessos", id), data);
    setToast({ type: "success", message: "Cliente atualizado!" });
  }

  function toggleSelecao(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleExcluirEmLote() {
    if (!db || selecionados.length === 0) return;
    const database = db;
    const batch = writeBatch(database);
    selecionados.forEach((id) => {
      batch.delete(doc(database, "acessos", id));
    });
    await batch.commit();
    setToast({ type: "info", message: `${selecionados.length} clientes removidos em lote.` });
  }

  async function handleRenovarEmLote() {
    if (!db || !user || selecionados.length === 0) return;
    const database = db;
    const batch = writeBatch(database);
    const hoje = new Date();
    
    selecionados.forEach((id) => {
      const item = acessos.find((a) => a.id === id);
      if (!item) return;

      const dataVencimentoAtual = new Date(item.vencimento);
      const novaData = dataVencimentoAtual > hoje ? dataVencimentoAtual : hoje;
      novaData.setDate(novaData.getDate() + 30);

      batch.update(doc(database, "acessos", id), {
        vencimento: novaData.toISOString(),
        data: hoje.toISOString(),
      });

      const pagDocRef = doc(collection(database, "pagamentos"));
      batch.set(pagDocRef, {
        acessoId: id,
        usuario: item.usuario,
        cliente: item.cliente,
        app: item.app,
        valor: item.valor || 0,
        data: hoje.toISOString(),
        userId: user.uid,
      });
    });

    await batch.commit();
    setToast({ type: "success", message: `${selecionados.length} acessos renovados em lote!` });
  }

  async function handleAlterarValorEmLote(novoValor: number) {
    if (!db || selecionados.length === 0) return;
    const database = db;
    const batch = writeBatch(database);
    selecionados.forEach((id) => {
      batch.update(doc(database, "acessos", id), { valor: novoValor });
    });
    await batch.commit();
    setToast({ type: "success", message: `Valor de ${selecionados.length} clientes alterado para R$ ${novoValor.toFixed(2)}.` });
  }

  async function handleAlterarAppEmLote(novoApp: string) {
    if (!db || selecionados.length === 0) return;
    const database = db;
    const batch = writeBatch(database);
    selecionados.forEach((id) => {
      batch.update(doc(database, "acessos", id), { app: novoApp });
    });
    await batch.commit();
    setToast({ type: "success", message: `App de ${selecionados.length} clientes alterado para ${novoApp}.` });
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

  const totalPaginas = Math.ceil(usuariosFiltrados.length / itensPorPagina);
  const usuariosPaginados = useMemo(() => {
    return usuariosFiltrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);
  }, [usuariosFiltrados, pagina, itensPorPagina]);

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

  if (licencasLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Se logado e não for o admin master, verifica a licença
  if (user && user.email !== "elison28araujo@gmail.com") {
    const isVencido = licenca?.status === "active" && licenca?.vencimentoLicenca && new Date(licenca.vencimentoLicenca) < new Date();
    if (!licenca || licenca.status === "pending" || licenca.status === "blocked" || isVencido) {
      return (
        <TelaLicencaBloqueada
          email={user.email || ""}
          codigo={licenca?.codigo || "GERANDO..."}
          status={licenca?.status || "pending"}
          vencimentoLicenca={licenca?.vencimentoLicenca}
          onLogout={() => auth && signOut(auth)}
        />
      );
    }
  }

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
            {activeTab === "dashboard" && (
              <Dashboard acessos={acessos} despesas={despesas} usuariosAgrupados={usuariosAgrupados} pagamentos={pagamentos} />
            )}

            {/* Cadastro Form */}
            {activeTab === "cadastro" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-heading font-bold tracking-tight text-slate-800 dark:text-slate-100">Cadastrar Novo Cliente</h2>
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
              </div>
            )}

            {/* Content Area */}
            {activeTab === "clientes" && (
              <div className="space-y-6">

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
                    usuariosPaginados.map((grupo) => (
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
                              mensagemRenovacao={mensagemRenovacao}
                              onEditar={setEditando}
                              onRemover={(id) => remover(id, "acessos")}
                              onRenovar={handleRenovar}
                              selecionado={selecionados.includes(item.id)}
                              onToggleSelecao={toggleSelecao}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Controles de Paginação */}
                  {totalPaginas > 1 && (
                    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200/50 pt-6 dark:border-slate-800/50 sm:flex-row">
                      <p className="text-sm text-slate-500">
                        Mostrando página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong> (total {usuariosFiltrados.length} grupos)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                          disabled={pagina === 1}
                          className="rounded-xl"
                        >
                          Anterior
                        </Button>
                        
                        {totalPaginas <= 6 ? (
                          Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                            <Button
                              key={p}
                              variant={pagina === p ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPagina(p)}
                              className={`h-9 w-9 rounded-xl p-0 ${
                                pagina === p
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : ""
                              }`}
                            >
                              {p}
                            </Button>
                          ))
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant={pagina === 1 ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPagina(1)}
                              className={`h-9 w-9 rounded-xl p-0 ${pagina === 1 ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                            >
                              1
                            </Button>
                            {pagina > 3 && <span className="px-1 text-slate-400">...</span>}
                            {pagina > 1 && pagina < totalPaginas && (
                              <Button
                                variant="default"
                                size="sm"
                                className="h-9 w-9 rounded-xl p-0 bg-blue-600 text-white"
                              >
                                {pagina}
                              </Button>
                            )}
                            {pagina < totalPaginas - 2 && <span className="px-1 text-slate-400">...</span>}
                            <Button
                              variant={pagina === totalPaginas ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPagina(totalPaginas)}
                              className={`h-9 w-9 rounded-xl p-0 ${pagina === totalPaginas ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                            >
                              {totalPaginas}
                            </Button>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
                          disabled={pagina === totalPaginas}
                          className="rounded-xl"
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
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

            {activeTab === "pagamentos" && (
              <PagamentosList
                pagamentos={pagamentos}
                onRemover={(id) => remover(id, "pagamentos")}
              />
            )}

            {activeTab === "licencas" && user?.email === "elison28araujo@gmail.com" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-heading font-bold tracking-tight text-slate-800 dark:text-slate-100">Gerenciamento de Licenças SaaS</h2>
                
                {/* Search Bar for Licenças */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 pl-10 pr-10 dark:border-slate-800 dark:bg-slate-900"
                    placeholder="Buscar por email, whatsapp ou código do usuário..."
                    value={buscaSaaS}
                    onChange={(e) => setBuscaSaaS(e.target.value)}
                  />
                  {buscaSaaS && (
                    <button
                      onClick={() => setBuscaSaaS("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Users List */}
                <div className="grid gap-4">
                  {usuariosSaaS.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-20 dark:border-slate-800">
                      <Users className="mb-4 h-12 w-12 text-slate-300" />
                      <p className="text-slate-500">Nenhum usuário cadastrado no sistema ainda.</p>
                    </div>
                  ) : (
                    (() => {
                      const filtrados = usuariosSaaS.filter((u) => {
                        const q = buscaSaaS.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          u.email?.toLowerCase().includes(q) ||
                          u.codigo?.toLowerCase().includes(q) ||
                          u.whatsapp?.includes(q)
                        );
                      });

                      if (filtrados.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-20 dark:border-slate-800">
                            <Search className="mb-4 h-12 w-12 text-slate-300" />
                            <p className="text-slate-500">Nenhum usuário encontrado para "{buscaSaaS}".</p>
                          </div>
                        );
                      }

                      return filtrados.map((u) => {
                        const isExpired = u.status === "active" && u.vencimentoLicenca && new Date(u.vencimentoLicenca) < new Date();
                        const vencimentoFormatado = u.vencimentoLicenca 
                          ? new Date(u.vencimentoLicenca).toLocaleDateString("pt-BR")
                          : "Sem Licença";
                        
                        let statusColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                        let statusText = "Pendente";
                        if (u.status === "blocked") {
                          statusColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                          statusText = "Bloqueado";
                        } else if (isExpired) {
                          statusColor = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
                          statusText = "Expirado";
                        } else if (u.status === "active") {
                          statusColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                          statusText = "Ativo";
                        }

                        return (
                          <Card key={u.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md overflow-hidden hover:shadow-md transition">
                            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-base">{u.email}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                                    {statusText}
                                  </span>
                                  {u.id === user?.uid && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Você</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                  <div>
                                    Código: <strong className="text-slate-700 dark:text-slate-300 font-mono text-sm">{u.codigo}</strong>
                                  </div>
                                  <div>
                                    WhatsApp: <strong className="text-slate-700 dark:text-slate-300">{u.whatsapp || "Não cadastrado"}</strong>
                                  </div>
                                  <div>
                                    Vencimento: <strong className="text-slate-700 dark:text-slate-300">{vencimentoFormatado}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Ações */}
                              {u.email !== "elison28araujo@gmail.com" && (
                                <div className="flex flex-wrap gap-2 pt-3 md:pt-0 border-t border-slate-100 dark:border-slate-800 md:border-none">
                                  <Button 
                                    size="sm" 
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1"
                                    onClick={() => handleRenovarLicenca(u.id, u.vencimentoLicenca)}
                                  >
                                    <RotateCw className="h-3 w-3" />
                                    Renovar 30 dias
                                  </Button>
                                  {u.status !== "blocked" ? (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-xl"
                                      onClick={() => handleBloquearUsuario(u.id, "blocked")}
                                    >
                                      Bloquear
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 rounded-xl"
                                      onClick={() => handleBloquearUsuario(u.id, "pending")}
                                    >
                                      Desbloquear
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-slate-400 hover:text-red-600 rounded-xl"
                                    onClick={() => handleExcluirUsuario(u.id)}
                                  >
                                    Excluir
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
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
        mensagemRenovacao={mensagemRenovacao}
        pixKey={pixKey}
        pixNome={pixNome}
        pixCidade={pixCidade}
        mpAccessToken={mpAccessToken}
        whatsappGestor={whatsappGestor}
        onSalvar={handleSalvarConfiguracoes}
      />

      <RenovarAcessoDialog
        acesso={renovandoAcesso}
        open={!!renovandoAcesso}
        onFechar={() => setRenovandoAcesso(null)}
        onConfirmar={handleConfirmarRenovacao}
      />

      <BulkActionBar
        selecionadosCount={selecionados.length}
        onLimparSelecao={() => setSelecionados([])}
        onRenovarEmLote={handleRenovarEmLote}
        onExcluirEmLote={handleExcluirEmLote}
        onAlterarValorEmLote={handleAlterarValorEmLote}
        onAlterarAppEmLote={handleAlterarAppEmLote}
        appOptions={appOptions}
      />

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
