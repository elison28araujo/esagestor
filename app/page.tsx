"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { auth, db, firebaseConfigured } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import {
  Calendar,
  CheckCircle,
  Download,
  DollarSign,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Trash2,
  TrendingDown,
  Upload,
  User,
  Users,
  XCircle,
} from "lucide-react";
import {
  escapeCsvValue,
  formatPhone,
  fromDateInput,
  isValidPhone,
  normalizeHeader,
  normalizePhone,
  parseCsv,
  parseFlexibleDate,
  toDateInput,
} from "@/lib/utils";

type Tab = "clientes" | "despesas";

interface Acesso {
  id: string;
  usuario: string;
  cliente: string;
  telefone: string;
  valor: number;
  app: string;
  vencimento: string;
  data: string;
  userId: string;
}

interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  userId: string;
}

interface UsuarioAgrupado {
  nome: string;
  clientes: Acesso[];
  temP2P: boolean;
}

const APP_OPTIONS = ["P2P", "OTT", "KPLAY", "XCLOUD", "OTT PLAYER", "XCLOUD PLAYER", "AB1ST"];

const FIELD_ALIASES = {
  usuario: ["usuario", "user", "login", "logins", "acesso", "conta"],
  cliente: ["cliente", "nome", "nome cliente", "assinante"],
  telefone: ["whatsapp", "what sapp", "telefone", "celular", "fone", "numero"],
  valor: ["valor", "vc", "v c", "mensalidade", "preco"],
  app: ["app", "aplicativo", "plataforma"],
  vencimento: ["vencimento", "data final", "final", "renovacao", "expira"],
  data: ["data", "data inicial", "inicio", "inicial", "cadastro"],
};

const FALLBACK_COLUMNS = ["usuario", "cliente", "telefone", "valor", "app", "vencimento", "data"] as const;

function getFieldValue(row: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const match = row[normalizeHeader(alias)];
    if (match) return match;
  }

  return "";
}

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

export default function HomePage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [dadosLoading, setDadosLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("clientes");

  const [nomeUser, setNomeUser] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [valor, setValor] = useState("");
  const [appSelecionado, setAppSelecionado] = useState("P2P");

  const [descricao, setDescricao] = useState("");
  const [valorDespesa, setValorDespesa] = useState("");
  const [importando, setImportando] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [importFeedback, setImportFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const [editando, setEditando] = useState<Acesso | null>(null);
  const [editForm, setEditForm] = useState({
    usuario: "",
    cliente: "",
    telefone: "",
    valor: "",
    app: "P2P",
    vencimento: "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setAcessos([]);
      setDespesas([]);
      setDadosLoading(false);
      return;
    }

    setDadosLoading(true);

    const acessosQuery = query(collection(db, "acessos"), where("userId", "==", user.uid));
    const despesasQuery = query(collection(db, "despesas"), where("userId", "==", user.uid));

    const unsubscribeAcessos = onSnapshot(acessosQuery, (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Acesso[];
      setAcessos(list);
      setDadosLoading(false);
    });

    const unsubscribeDespesas = onSnapshot(despesasQuery, (snapshot) => {
      const list = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Despesa[];
      setDespesas(list);
    });

    return () => {
      unsubscribeAcessos();
      unsubscribeDespesas();
    };
  }, [user]);

  async function login() {
    if (!auth) {
      setAuthError("Firebase nao configurado na Vercel.");
      return;
    }

    if (!email || !senha) {
      setAuthError("Preencha email e senha");
      return;
    }

    setLoginLoading(true);
    setAuthError("");
    setAuthInfo("");

    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao entrar";
      if (message.includes("invalid-credential")) setAuthError("Email ou senha incorretos");
      else if (message.includes("invalid-email")) setAuthError("Email inválido");
      else setAuthError(message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function registrar() {
    if (!auth) {
      setAuthError("Firebase nao configurado na Vercel.");
      return;
    }

    if (!email || !senha) {
      setAuthError("Preencha email e senha");
      return;
    }

    if (senha.length < 6) {
      setAuthError("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoginLoading(true);
    setAuthError("");
    setAuthInfo("");

    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      setAuthInfo("Conta criada com sucesso");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao criar conta";
      if (message.includes("email-already-in-use")) setAuthError("Este email já está em uso");
      else if (message.includes("invalid-email")) setAuthError("Email inválido");
      else setAuthError(message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function recuperarSenha() {
    if (!auth) {
      setAuthError("Firebase nao configurado na Vercel.");
      return;
    }

    if (!email) {
      setAuthError("Digite seu email para recuperar a senha");
      return;
    }

    setLoginLoading(true);
    setAuthError("");
    setAuthInfo("");

    try {
      await sendPasswordResetEmail(auth, email);
      setAuthInfo("Link de recuperação enviado para seu email");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao recuperar senha";
      setAuthError(message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function sair() {
    if (!auth) return;
    await signOut(auth);
  }

  async function addCliente() {
    if (!user || !db) return;
    if (!nomeUser.trim() || !cliente.trim()) {
      alert("Preencha usuário e cliente");
      return;
    }
    if (!isValidPhone(telefone)) {
      alert("Digite um telefone válido com DDD");
      return;
    }

    const clientesMesmoUsuario = acessos.filter(
      (item) => item.usuario.trim().toLowerCase() === nomeUser.trim().toLowerCase(),
    );

    if (clientesMesmoUsuario.length >= 3) {
      alert("Máximo de 3 clientes por usuário");
      return;
    }

    if (appSelecionado === "P2P" && clientesMesmoUsuario.some((item) => item.app === "P2P")) {
      alert("Esse usuário já possui P2P");
      return;
    }

    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 30);

    await addDoc(collection(db, "acessos"), {
      usuario: nomeUser.trim(),
      cliente: cliente.trim(),
      telefone: normalizePhone(telefone),
      valor: Number(valor) || 0,
      app: appSelecionado,
      vencimento: vencimento.toISOString(),
      data: new Date().toISOString(),
      createdAt: Timestamp.now(),
      userId: user.uid,
    });

    setNomeUser("");
    setCliente("");
    setTelefone("");
    setValor("");
    setAppSelecionado("P2P");
  }

  function exportarClientesCsv() {
    const linhas = [
      ["usuario", "cliente", "whatsapp", "valor", "app", "vencimento", "data"].join(";"),
      ...acessos
        .slice()
        .sort((a, b) => a.usuario.localeCompare(b.usuario) || a.cliente.localeCompare(b.cliente))
        .map((item) =>
          [
            escapeCsvValue(item.usuario),
            escapeCsvValue(item.cliente),
            escapeCsvValue(item.telefone),
            escapeCsvValue(Number(item.valor || 0).toFixed(2)),
            escapeCsvValue(item.app),
            escapeCsvValue(formatDateForCsv(item.vencimento)),
            escapeCsvValue(formatDateForCsv(item.data)),
          ].join(";"),
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

    setImportFeedback({
      type: "info",
      message: "Planilha CSV exportada. Voce pode editar e importar novamente quando quiser.",
    });
  }

  async function importarClientesCsv(event: ChangeEvent<HTMLInputElement>) {
    if (!user || !db) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setImportando(true);
    setImportFeedback(null);

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length < 2) {
        throw new Error("A planilha esta vazia ou sem linhas de dados.");
      }

      const headers = rows[0].map((header) => normalizeHeader(header));
      const headersReconhecidos = Object.values(FIELD_ALIASES).flat().some((alias) => headers.includes(normalizeHeader(alias)));
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

      for (let index = 0; index < dataRows.length; index += 1) {
        const values = dataRows[index];
        const row: Record<string, string> = {};

        if (headersReconhecidos) {
          headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex]?.trim() ?? "";
          });
        } else {
          FALLBACK_COLUMNS.forEach((column, columnIndex) => {
            row[column] = values[columnIndex]?.trim() ?? "";
          });
        }

        const usuario = getFieldValue(row, FIELD_ALIASES.usuario).trim();
        const cliente = getFieldValue(row, FIELD_ALIASES.cliente).trim();
        const telefoneInformado = getFieldValue(row, FIELD_ALIASES.telefone).trim();
        const telefone = normalizePhone(telefoneInformado);
        const app = getFieldValue(row, FIELD_ALIASES.app).trim() || "P2P";
        const valorImportado = getFieldValue(row, FIELD_ALIASES.valor).trim();
        const vencimentoImportado = getFieldValue(row, FIELD_ALIASES.vencimento).trim();
        const dataImportada = getFieldValue(row, FIELD_ALIASES.data).trim();

        if (!usuario || !cliente) {
          erros.push(`Linha ${index + 2}: faltou usuario/login ou nome do cliente.`);
          continue;
        }

        if (telefone && !isValidPhone(telefone)) {
          erros.push(`Linha ${index + 2}: WhatsApp inválido para ${cliente}.`);
          continue;
        }

        const usuarioKey = usuario.toLowerCase();
        const totalAtual = counts.get(usuarioKey) ?? 0;
        const isP2P = normalizeHeader(app) === "p2p";

        if (totalAtual >= 3) {
          erros.push(`Linha ${index + 2}: ${usuario} já atingiu o limite de 3 clientes.`);
          continue;
        }

        if (isP2P && p2pUsers.has(usuarioKey)) {
          erros.push(`Linha ${index + 2}: ${usuario} já possui P2P.`);
          continue;
        }

        const vencimento = parseFlexibleDate(vencimentoImportado);
        const dataCadastro = parseFlexibleDate(dataImportada);
        const dataBase = new Date();
        dataBase.setDate(dataBase.getDate() + 30);

        await addDoc(collection(db, "acessos"), {
          usuario,
          cliente,
          telefone,
          valor: parseCurrency(valorImportado),
          app,
          vencimento: vencimento || dataBase.toISOString(),
          data: dataCadastro || new Date().toISOString(),
          createdAt: Timestamp.now(),
          userId: user.uid,
        });

        counts.set(usuarioKey, totalAtual + 1);
        if (isP2P) p2pUsers.add(usuarioKey);
        if (!telefone) semWhatsapp += 1;
        importados += 1;
      }

      const resumo: string[] = [];
      resumo.push(`${importados} cliente(s) importado(s).`);
      if (semWhatsapp > 0) resumo.push(`${semWhatsapp} ficou(aram) sem WhatsApp para você completar depois.`);
      if (erros.length > 0) resumo.push(`${erros.length} linha(s) foram ignoradas.`);
      if (erros.length > 0) resumo.push(erros.slice(0, 5).join(" "));

      setImportFeedback({
        type: importados > 0 ? "success" : "error",
        message: resumo.join(" "),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao importar a planilha.";
      setImportFeedback({ type: "error", message });
    } finally {
      event.target.value = "";
      setImportando(false);
    }
  }

  async function importarGoogleSheet() {
    if (!user || !db) return;
    if (!sheetUrl.trim()) {
      setImportFeedback({ type: "error", message: "Cole o link da planilha do Google Sheets." });
      return;
    }

    setImportando(true);
    setImportFeedback(null);

    try {
      const response = await fetch("/api/google-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sheetUrl.trim() }),
      });

      const payload = (await response.json()) as { csv?: string; error?: string; sourceLabel?: string };

      if (!response.ok || !payload.csv) {
        throw new Error(payload.error || "Nao foi possivel ler a planilha do Google Sheets.");
      }

      const rows = parseCsv(payload.csv);

      if (rows.length < 2) {
        throw new Error("A planilha esta vazia ou sem linhas de dados.");
      }

      const headers = rows[0].map((header) => normalizeHeader(header));
      const headersReconhecidos = Object.values(FIELD_ALIASES).flat().some((alias) => headers.includes(normalizeHeader(alias)));
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

      for (let index = 0; index < dataRows.length; index += 1) {
        const values = dataRows[index];
        const row: Record<string, string> = {};

        if (headersReconhecidos) {
          headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex]?.trim() ?? "";
          });
        } else {
          FALLBACK_COLUMNS.forEach((column, columnIndex) => {
            row[column] = values[columnIndex]?.trim() ?? "";
          });
        }

        const usuario = getFieldValue(row, FIELD_ALIASES.usuario).trim();
        const cliente = getFieldValue(row, FIELD_ALIASES.cliente).trim();
        const telefoneInformado = getFieldValue(row, FIELD_ALIASES.telefone).trim();
        const telefone = normalizePhone(telefoneInformado);
        const app = getFieldValue(row, FIELD_ALIASES.app).trim() || "P2P";
        const valorImportado = getFieldValue(row, FIELD_ALIASES.valor).trim();
        const vencimentoImportado = getFieldValue(row, FIELD_ALIASES.vencimento).trim();
        const dataImportada = getFieldValue(row, FIELD_ALIASES.data).trim();

        if (!usuario || !cliente) {
          erros.push(`Linha ${index + 2}: faltou usuario/login ou nome do cliente.`);
          continue;
        }

        if (telefone && !isValidPhone(telefone)) {
          erros.push(`Linha ${index + 2}: WhatsApp invalido para ${cliente}.`);
          continue;
        }

        const usuarioKey = usuario.toLowerCase();
        const totalAtual = counts.get(usuarioKey) ?? 0;
        const isP2P = normalizeHeader(app) === "p2p";

        if (totalAtual >= 3) {
          erros.push(`Linha ${index + 2}: ${usuario} ja atingiu o limite de 3 clientes.`);
          continue;
        }

        if (isP2P && p2pUsers.has(usuarioKey)) {
          erros.push(`Linha ${index + 2}: ${usuario} ja possui P2P.`);
          continue;
        }

        const vencimento = parseFlexibleDate(vencimentoImportado);
        const dataCadastro = parseFlexibleDate(dataImportada);
        const dataBase = new Date();
        dataBase.setDate(dataBase.getDate() + 30);

        await addDoc(collection(db, "acessos"), {
          usuario,
          cliente,
          telefone,
          valor: parseCurrency(valorImportado),
          app,
          vencimento: vencimento || dataBase.toISOString(),
          data: dataCadastro || new Date().toISOString(),
          createdAt: Timestamp.now(),
          userId: user.uid,
        });

        counts.set(usuarioKey, totalAtual + 1);
        if (isP2P) p2pUsers.add(usuarioKey);
        if (!telefone) semWhatsapp += 1;
        importados += 1;
      }

      const resumo: string[] = [];
      resumo.push(`${importados} cliente(s) importado(s).`);
      resumo.push(`Origem: ${payload.sourceLabel || "Google Sheets"}.`);
      if (semWhatsapp > 0) resumo.push(`${semWhatsapp} ficou(aram) sem WhatsApp para voce completar depois.`);
      if (erros.length > 0) resumo.push(`${erros.length} linha(s) foram ignoradas.`);
      if (erros.length > 0) resumo.push(erros.slice(0, 5).join(" "));

      setImportFeedback({
        type: importados > 0 ? "success" : "error",
        message: resumo.join(" "),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao importar do Google Sheets.";
      setImportFeedback({ type: "error", message });
    } finally {
      setImportando(false);
    }
  }

  async function addDespesa() {
    if (!user || !db) return;
    if (!descricao.trim() || !valorDespesa) {
      alert("Preencha descrição e valor");
      return;
    }

    await addDoc(collection(db, "despesas"), {
      descricao: descricao.trim(),
      valor: Number(valorDespesa),
      data: new Date().toISOString(),
      createdAt: Timestamp.now(),
      userId: user.uid,
    });

    setDescricao("");
    setValorDespesa("");
  }

  async function remover(id: string, tipo: "acessos" | "despesas") {
    if (!db) return;
    await deleteDoc(doc(db, tipo, id));
  }

  function abrirEdicao(acesso: Acesso) {
    setEditando(acesso);
    setEditForm({
      usuario: acesso.usuario,
      cliente: acesso.cliente,
      telefone: formatPhone(acesso.telefone),
      valor: String(acesso.valor ?? ""),
      app: acesso.app,
      vencimento: toDateInput(acesso.vencimento),
    });
  }

  async function salvarEdicao() {
    if (!editando || !db) return;
    if (!editForm.usuario.trim() || !editForm.cliente.trim()) {
      alert("Preencha usuário e cliente");
      return;
    }
    if (!isValidPhone(editForm.telefone)) {
      alert("Digite um telefone válido");
      return;
    }

    await updateDoc(doc(db, "acessos", editando.id), {
      usuario: editForm.usuario.trim(),
      cliente: editForm.cliente.trim(),
      telefone: normalizePhone(editForm.telefone),
      valor: Number(editForm.valor) || 0,
      app: editForm.app,
      vencimento: fromDateInput(editForm.vencimento),
    });

    setEditando(null);
  }

  function cobrar(acesso: Acesso) {
    const phone = normalizePhone(acesso.telefone);
    if (!isValidPhone(phone)) {
      alert("Telefone inválido");
      return;
    }
    const mensagem = `Olá ${acesso.cliente}, seu acesso ${acesso.app} venceu ou está próximo do vencimento. Deseja renovar? Valor: R$ ${acesso.valor}.`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`, "_blank");
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
        clientes: groups[nome].sort(
          (a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime(),
        ),
        temP2P: groups[nome].some((item) => item.app === "P2P"),
      }))
      .sort((a, b) => {
        if (a.temP2P !== b.temP2P) return a.temP2P ? 1 : -1;
        return a.clientes.length - b.clientes.length;
      });
  }, [acessos]);

  const dadosMensais = useMemo(() => {
    const meses: Record<string, { entrada: number; saida: number }> = {};

    acessos.forEach((item) => {
      const mes = new Date(item.data).toLocaleString("pt-BR", { month: "short" });
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0 };
      meses[mes].entrada += Number(item.valor || 0);
    });

    despesas.forEach((item) => {
      const mes = new Date(item.data).toLocaleString("pt-BR", { month: "short" });
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0 };
      meses[mes].saida += Number(item.valor || 0);
    });

    return Object.entries(meses).map(([mes, values]) => ({
      mes,
      entrada: values.entrada,
      saida: values.saida,
      lucro: values.entrada - values.saida,
    }));
  }, [acessos, despesas]);

  const totalEntrada = acessos.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const totalSaida = despesas.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const lucro = totalEntrada - totalSaida;
  const appOptions = useMemo(
    () => Array.from(new Set([...APP_OPTIONS, ...acessos.map((item) => item.app).filter(Boolean)])).sort(),
    [acessos],
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!firebaseConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">ESA GESTOR</h1>
              <p className="mt-2 text-sm text-slate-600">
                O Firebase ainda nao foi configurado neste ambiente.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Configure na Vercel as variaveis:
              <br />
              `NEXT_PUBLIC_FIREBASE_API_KEY`
              <br />
              `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
              <br />
              `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
              <br />
              `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
              <br />
              `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
              <br />
              `NEXT_PUBLIC_FIREBASE_APP_ID`
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">ESA GESTOR</h1>
              <p className="mt-1 text-sm text-slate-500">Controle de acessos, cobranças e despesas</p>
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-10" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="relative">
              <Input placeholder="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>

            {authError && <p className="text-center text-sm text-red-600">{authError}</p>}
            {authInfo && <p className="text-center text-sm text-emerald-600">{authInfo}</p>}

            <Button className="w-full" onClick={login} disabled={loginLoading}>
              {loginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
            <Button className="w-full" variant="outline" onClick={registrar} disabled={loginLoading}>
              Criar conta
            </Button>
            <Button className="w-full" variant="ghost" onClick={recuperarSenha} disabled={loginLoading}>
              Recuperar senha
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">ESA GESTOR</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={sair}>
          <LogOut className="mr-1 h-4 w-4" />
          Sair
        </Button>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><CardContent><div className="text-xs text-slate-500">Entrada</div><div className="mt-1 text-xl font-bold text-emerald-600">R$ {totalEntrada.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent><div className="text-xs text-slate-500">Saída</div><div className="mt-1 text-xl font-bold text-red-600">R$ {totalSaida.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent><div className="text-xs text-slate-500">Lucro</div><div className={`mt-1 text-xl font-bold ${lucro >= 0 ? "text-blue-600" : "text-red-600"}`}>R$ {lucro.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent><div className="text-xs text-slate-500">Usuários</div><div className="mt-1 text-xl font-bold text-slate-900">{usuariosAgrupados.length}</div></CardContent></Card>
      </section>

      {dadosMensais.length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <div className="mb-3 text-sm font-semibold">Lucro mensal</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosMensais}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="lucro" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={activeTab === "clientes" ? "default" : "outline"} onClick={() => setActiveTab("clientes")}>
          <Users className="mr-1 h-4 w-4" /> Clientes
        </Button>
        <Button variant={activeTab === "despesas" ? "default" : "outline"} onClick={() => setActiveTab("despesas")}>
          <TrendingDown className="mr-1 h-4 w-4" /> Despesas
        </Button>
      </div>

      {activeTab === "clientes" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Plus className="h-4 w-4 text-blue-600" /> Novo acesso
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={exportarClientesCsv}>
                    <Download className="mr-1 h-4 w-4" /> Exportar CSV
                  </Button>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importando}>
                    {importando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                    Importar CSV
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={importarClientesCsv}
                  />
                </div>
              </div>

              <p className="text-sm text-slate-500">
                Use a planilha em CSV com colunas como `usuario` ou `login`, `cliente` ou `nome`, `whatsapp` ou `telefone`,
                `valor`, `app`, `vencimento` e `data`. Datas podem vir em `dd/mm/aaaa`.
              </p>

              <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Cole aqui o link da planilha do Google Sheets"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={importarGoogleSheet} disabled={importando}>
                  {importando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                  Importar link
                </Button>
              </div>

              {importFeedback && (
                <div
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    importFeedback.type === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : importFeedback.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                  }`}
                >
                  {importFeedback.message}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-10" placeholder="Usuário" value={nomeUser} onChange={(e) => setNomeUser(e.target.value)} />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-10" placeholder="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-10" placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-10" placeholder="Valor (R$)" type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
                </div>
              </div>

              <Input list="app-options" placeholder="Aplicativo" value={appSelecionado} onChange={(e) => setAppSelecionado(e.target.value.toUpperCase())} />

              <Button onClick={addCliente}>Adicionar cliente</Button>
            </CardContent>
          </Card>

          {dadosLoading ? (
            <Card><CardContent className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></CardContent></Card>
          ) : usuariosAgrupados.length === 0 ? (
            <Card><CardContent className="text-center text-slate-500">Nenhum usuário cadastrado</CardContent></Card>
          ) : (
            usuariosAgrupados.map((grupo) => (
              <Card key={grupo.nome}>
                <CardContent>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-lg font-bold">
                      <User className="h-4 w-4 text-blue-600" />
                      {grupo.nome}
                      <span className="text-sm font-normal text-slate-500">({grupo.clientes.length}/3)</span>
                    </div>
                    {grupo.temP2P ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs text-red-600">
                        <XCircle className="h-3 w-3" /> Já tem P2P
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-600">
                        <CheckCircle className="h-3 w-3" /> Pode usar P2P
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {grupo.clientes.map((item) => {
                      const dias = Math.ceil((new Date(item.vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const status = dias <= 0
                        ? { texto: "Vencido", style: "bg-red-100 text-red-600" }
                        : dias <= 3
                          ? { texto: "Vence logo", style: "bg-amber-100 text-amber-600" }
                          : { texto: "Ativo", style: "bg-emerald-100 text-emerald-600" };

                      return (
                        <div key={item.id} className="rounded-2xl border border-slate-200 p-3">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">{item.cliente}</div>
                              <div className="text-sm text-slate-500">{item.app} • R$ {Number(item.valor).toFixed(2)}</div>
                              <div className="mt-1 text-sm text-slate-500">{formatPhone(item.telefone)}</div>
                            </div>
                            <div className={`rounded-full px-2 py-1 text-xs font-semibold ${status.style}`}>{status.texto}</div>
                          </div>

                          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="h-4 w-4" />
                            {dias <= 0 ? "Renovar agora" : `${dias} dias restantes`}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => cobrar(item)}>
                              <MessageCircle className="mr-1 h-3 w-3" /> Cobrar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => abrirEdicao(item)}>
                              <Pencil className="mr-1 h-3 w-3" /> Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => remover(item.id, "acessos")}>
                              <Trash2 className="mr-1 h-3 w-3" /> Excluir
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "despesas" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-3">
              <div className="text-lg font-semibold">Nova despesa</div>
              <Input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              <Input placeholder="Valor (R$)" type="number" value={valorDespesa} onChange={(e) => setValorDespesa(e.target.value)} />
              <Button onClick={addDespesa}>Adicionar despesa</Button>
            </CardContent>
          </Card>

          {despesas.length === 0 ? (
            <Card><CardContent className="text-center text-slate-500">Nenhuma despesa cadastrada</CardContent></Card>
          ) : (
            despesas.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.descricao}</div>
                    <div className="text-sm text-red-600">R$ {Number(item.valor).toFixed(2)}</div>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => remover(item.id, "despesas")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>Usuário</Label>
              <Input value={editForm.usuario} onChange={(e) => setEditForm((prev) => ({ ...prev, usuario: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>Cliente</Label>
              <Input value={editForm.cliente} onChange={(e) => setEditForm((prev) => ({ ...prev, cliente: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>Telefone</Label>
              <Input value={editForm.telefone} onChange={(e) => setEditForm((prev) => ({ ...prev, telefone: formatPhone(e.target.value) }))} />
            </div>
            <div className="grid gap-1">
              <Label>Valor</Label>
              <Input type="number" value={editForm.valor} onChange={(e) => setEditForm((prev) => ({ ...prev, valor: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>App</Label>
              <Input list="app-options" value={editForm.app} onChange={(e) => setEditForm((prev) => ({ ...prev, app: e.target.value.toUpperCase() }))} />
            </div>
            <div className="grid gap-1">
              <Label>Vencimento</Label>
              <Input type="date" value={editForm.vencimento} onChange={(e) => setEditForm((prev) => ({ ...prev, vencimento: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <datalist id="app-options">
        {appOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </main>
  );
}
