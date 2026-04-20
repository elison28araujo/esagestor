"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LogOut,
  Trash2,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  User,
  Phone,
  Mail,
  Lock,
  Loader2,
  MessageCircle,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Pencil,
  BellRing,
} from "lucide-react";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

type AbaAtiva = "clientes" | "despesas";

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

interface DadoMensal {
  mes: string;
  entrada: number;
  saida: number;
  lucro: number;
}

interface UsuarioAgrupado {
  nome: string;
  clientes: Acesso[];
  temP2P: boolean;
}

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarTelefone(valor: string) {
  const numero = normalizarTelefone(valor).slice(0, 11);

  if (numero.length <= 2) return numero;
  if (numero.length <= 7) return `(${numero.slice(0, 2)}) ${numero.slice(2)}`;
  return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
}

function telefoneValido(valor: string) {
  const numero = normalizarTelefone(valor);
  return numero.length === 10 || numero.length === 11;
}

function dataInputParaIso(data: string) {
  return new Date(`${data}T12:00:00`).toISOString();
}

function isoParaDataInput(valor: string) {
  if (!valor) return "";
  const data = new Date(valor);
  const yyyy = data.getFullYear();
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function GestorProMaxAtualizado() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");

  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [dadosLoading, setDadosLoading] = useState(true);

  const [nomeUser, setNomeUser] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [valor, setValor] = useState("");
  const [appSelecionado, setAppSelecionado] = useState("P2P");

  const [descricao, setDescricao] = useState("");
  const [valorDespesa, setValorDespesa] = useState("");

  const [activeTab, setActiveTab] = useState<AbaAtiva>("clientes");
  const [editando, setEditando] = useState<Acesso | null>(null);
  const [editForm, setEditForm] = useState({
    usuario: "",
    cliente: "",
    telefone: "",
    valor: "",
    app: "P2P",
    vencimento: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setAcessos([]);
      setDespesas([]);
      setDadosLoading(false);
      return;
    }

    setDadosLoading(true);

    const qAcessos = query(collection(db, "acessos"), where("userId", "==", user.uid));
    const qDespesas = query(collection(db, "despesas"), where("userId", "==", user.uid));

    const unsubAcessos = onSnapshot(qAcessos, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Acesso[];
      setAcessos(data);
      setDadosLoading(false);
    });

    const unsubDespesas = onSnapshot(qDespesas, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Despesa[];
      setDespesas(data);
    });

    return () => {
      unsubAcessos();
      unsubDespesas();
    };
  }, [user]);

  const login = async () => {
    if (!email || !senha) {
      setAuthError("Preencha email e senha");
      return;
    }

    setLoginLoading(true);
    setAuthInfo("");
    setAuthError("");

    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao entrar";
      if (msg.includes("invalid-credential")) setAuthError("Email ou senha incorretos");
      else if (msg.includes("invalid-email")) setAuthError("Email inválido");
      else setAuthError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const registrar = async () => {
    if (!email || !senha) {
      setAuthError("Preencha email e senha");
      return;
    }

    if (senha.length < 6) {
      setAuthError("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoginLoading(true);
    setAuthInfo("");
    setAuthError("");

    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      setAuthInfo("Conta criada com sucesso");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao criar conta";
      if (msg.includes("email-already-in-use")) setAuthError("Este email já está em uso");
      else if (msg.includes("invalid-email")) setAuthError("Email inválido");
      else setAuthError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const recuperarSenha = async () => {
    if (!email) {
      setAuthError("Digite seu email para recuperar a senha");
      return;
    }

    setLoginLoading(true);
    setAuthInfo("");
    setAuthError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setAuthInfo("Enviamos o link de recuperação para seu email");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao enviar recuperação";
      setAuthError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const sair = async () => {
    await signOut(auth);
    setUser(null);
  };

  const addCliente = async () => {
    if (!user) return;

    if (!nomeUser.trim() || !cliente.trim()) {
      alert("Preencha usuário e cliente");
      return;
    }

    if (!telefoneValido(telefone)) {
      alert("Digite um telefone válido com DDD");
      return;
    }

    const clientesUser = acessos.filter((a) => a.usuario.trim().toLowerCase() === nomeUser.trim().toLowerCase());

    if (clientesUser.length >= 3) {
      alert("Máximo de 3 clientes por usuário");
      return;
    }

    if (appSelecionado === "P2P" && clientesUser.some((c) => c.app === "P2P")) {
      alert("Este usuário já possui P2P");
      return;
    }

    const venc = new Date();
    venc.setDate(venc.getDate() + 30);

    try {
      await addDoc(collection(db, "acessos"), {
        usuario: nomeUser.trim(),
        cliente: cliente.trim(),
        telefone: normalizarTelefone(telefone),
        valor: Number(valor) || 0,
        app: appSelecionado,
        vencimento: venc.toISOString(),
        data: new Date().toISOString(),
        userId: user.uid,
        createdAt: Timestamp.now(),
      });

      setNomeUser("");
      setCliente("");
      setTelefone("");
      setValor("");
      setAppSelecionado("P2P");
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar cliente");
    }
  };

  const addDespesa = async () => {
    if (!user) return;
    if (!descricao.trim() || !valorDespesa) {
      alert("Preencha descrição e valor");
      return;
    }

    try {
      await addDoc(collection(db, "despesas"), {
        descricao: descricao.trim(),
        valor: Number(valorDespesa),
        data: new Date().toISOString(),
        userId: user.uid,
        createdAt: Timestamp.now(),
      });

      setDescricao("");
      setValorDespesa("");
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar despesa");
    }
  };

  const remover = async (id: string, tipo: "acessos" | "despesas") => {
    try {
      await deleteDoc(doc(db, tipo, id));
    } catch (error) {
      console.error(error);
      alert("Erro ao remover");
    }
  };

  const abrirEdicao = (a: Acesso) => {
    setEditando(a);
    setEditForm({
      usuario: a.usuario,
      cliente: a.cliente,
      telefone: formatarTelefone(a.telefone),
      valor: String(a.valor ?? ""),
      app: a.app,
      vencimento: isoParaDataInput(a.vencimento),
    });
  };

  const salvarEdicao = async () => {
    if (!editando) return;

    if (!editForm.usuario.trim() || !editForm.cliente.trim()) {
      alert("Preencha usuário e cliente");
      return;
    }

    if (!telefoneValido(editForm.telefone)) {
      alert("Digite um telefone válido");
      return;
    }

    try {
      await updateDoc(doc(db, "acessos", editando.id), {
        usuario: editForm.usuario.trim(),
        cliente: editForm.cliente.trim(),
        telefone: normalizarTelefone(editForm.telefone),
        valor: Number(editForm.valor) || 0,
        app: editForm.app,
        vencimento: dataInputParaIso(editForm.vencimento),
      });

      setEditando(null);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar edição");
    }
  };

  const cobrar = (a: Acesso) => {
    const telefone = normalizarTelefone(a.telefone);
    if (!telefoneValido(telefone)) {
      alert("Telefone inválido");
      return;
    }

    const msg = `Olá ${a.cliente}, seu acesso ${a.app} venceu ou está próximo do vencimento. Deseja renovar? Valor: R$ ${a.valor}.`;
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const cobrarVencidos = () => {
    const vencidos = acessos.filter((a) => {
      const dias = Math.ceil((new Date(a.vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return dias <= 0;
    });

    if (vencidos.length === 0) {
      alert("Nenhum cliente vencido no momento");
      return;
    }

    cobrar(vencidos[0]);
  };

  const usuariosAgrupados = useMemo(() => {
    const grupos: Record<string, Acesso[]> = {};

    acessos.forEach((a) => {
      if (!grupos[a.usuario]) grupos[a.usuario] = [];
      grupos[a.usuario].push(a);
    });

    return Object.keys(grupos)
      .map((nome) => ({
        nome,
        clientes: grupos[nome].sort(
          (a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
        ),
        temP2P: grupos[nome].some((c) => c.app === "P2P"),
      }))
      .sort((a, b) => {
        if (a.temP2P !== b.temP2P) return a.temP2P ? 1 : -1;
        return a.clientes.length - b.clientes.length;
      });
  }, [acessos]);

  const dadosMensais = useMemo(() => {
    const meses: Record<string, { entrada: number; saida: number }> = {};

    acessos.forEach((a) => {
      const mes = new Date(a.data).toLocaleString("pt-BR", { month: "short" });
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0 };
      meses[mes].entrada += Number(a.valor || 0);
    });

    despesas.forEach((d) => {
      const mes = new Date(d.data).toLocaleString("pt-BR", { month: "short" });
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0 };
      meses[mes].saida += Number(d.valor || 0);
    });

    return Object.entries(meses).map(([mes, valores]) => ({
      mes,
      entrada: valores.entrada,
      saida: valores.saida,
      lucro: valores.entrada - valores.saida,
    }));
  }, [acessos, despesas]);

  const totalEntrada = acessos.reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const totalSaida = despesas.reduce((acc, item) => acc + Number(item.valor || 0), 0);
  const lucro = totalEntrada - totalSaida;
  const vencidos = acessos.filter((a) => new Date(a.vencimento).getTime() < Date.now()).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold">GESTOR PRO MAX</h1>
              <p className="text-sm text-muted-foreground mt-1">Controle de acessos e finanças</p>
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="pl-10"
              />
            </div>

            {authError && <p className="text-sm text-red-500 text-center">{authError}</p>}
            {authInfo && <p className="text-sm text-emerald-600 text-center">{authInfo}</p>}

            <Button className="w-full" onClick={login} disabled={loginLoading}>
              {loginLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Entrar
            </Button>
            <Button variant="outline" className="w-full" onClick={registrar} disabled={loginLoading}>
              {loginLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar conta
            </Button>
            <Button variant="ghost" className="w-full" onClick={recuperarSenha} disabled={loginLoading}>
              Recuperar senha
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">GESTOR PRO MAX</h1>
          <p className="text-xs text-foreground/70">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={sair}>
          <LogOut className="h-4 w-4 mr-1" />
          Sair
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Entrada</div><div className="text-xl font-bold text-emerald-600">R$ {totalEntrada.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Saída</div><div className="text-xl font-bold text-red-600">R$ {totalSaida.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Lucro</div><div className={`text-xl font-bold ${lucro >= 0 ? "text-blue-600" : "text-red-600"}`}>R$ {lucro.toFixed(2)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Vencidos</div><div className="text-xl font-bold text-amber-600">{vencidos}</div></CardContent></Card>
      </div>

      {dadosMensais.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Lucro mensal</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dadosMensais}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="lucro" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Button variant={activeTab === "clientes" ? "default" : "outline"} onClick={() => setActiveTab("clientes")}>Clientes</Button>
        <Button variant={activeTab === "despesas" ? "default" : "outline"} onClick={() => setActiveTab("despesas")}>Despesas</Button>
        <Button variant="secondary" onClick={cobrarVencidos}>
          <BellRing className="h-4 w-4 mr-1" />
          Cobrar vencidos
        </Button>
      </div>

      {activeTab === "clientes" && (
        <>
          <Card className="mb-4">
            <CardContent className="p-4 grid gap-3">
              <div className="font-semibold">Novo acesso</div>
              <Input placeholder="Usuário" value={nomeUser} onChange={(e) => setNomeUser(e.target.value)} />
              <Input placeholder="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
              <Input placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} />
              <Input placeholder="Valor (R$)" type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
              <select value={appSelecionado} onChange={(e) => setAppSelecionado(e.target.value)} className="w-full h-10 rounded-md border px-3 bg-background">
                <option value="P2P">P2P</option>
                <option value="OTT">OTT</option>
                <option value="KPLAY">KPLAY</option>
              </select>
              <Button onClick={addCliente}><Plus className="h-4 w-4 mr-1" />Adicionar cliente</Button>
            </CardContent>
          </Card>

          {dadosLoading ? (
            <Card><CardContent className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {usuariosAgrupados.map((u) => (
                <Card key={u.nome}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold">{u.nome} <span className="text-sm text-muted-foreground">({u.clientes.length}/3)</span></div>
                      {u.temP2P ? (
                        <span className="flex items-center gap-1 text-red-600 text-sm"><XCircle className="h-3 w-3" />Já tem P2P</span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle className="h-3 w-3" />Pode usar P2P</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {u.clientes.map((a) => {
                        const dias = Math.ceil((new Date(a.vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        const status = dias <= 0
                          ? { texto: "Vencido", classe: "text-red-600 bg-red-100" }
                          : dias <= 3
                          ? { texto: "Vence logo", classe: "text-amber-600 bg-amber-100" }
                          : { texto: "Ativo", classe: "text-emerald-600 bg-emerald-100" };

                        return (
                          <div key={a.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <div className="font-medium">{a.cliente}</div>
                                <div className="text-sm text-muted-foreground">{a.app} • R$ {Number(a.valor).toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">{formatarTelefone(a.telefone)}</div>
                              </div>
                              <div className={`text-xs px-2 py-1 rounded ${status.classe}`}>{status.texto}</div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => cobrar(a)}>
                                <MessageCircle className="h-3 w-3 mr-1" />Cobrar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => abrirEdicao(a)}>
                                <Pencil className="h-3 w-3 mr-1" />Editar
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => remover(a.id, "acessos")}>
                                <Trash2 className="h-3 w-3 mr-1" />Excluir
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {usuariosAgrupados.length === 0 && (
                <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhum usuário cadastrado</CardContent></Card>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "despesas" && (
        <>
          <Card className="mb-4">
            <CardContent className="p-4 grid gap-3">
              <div className="font-semibold">Nova despesa</div>
              <Input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              <Input placeholder="Valor (R$)" type="number" value={valorDespesa} onChange={(e) => setValorDespesa(e.target.value)} />
              <Button onClick={addDespesa}><Plus className="h-4 w-4 mr-1" />Adicionar despesa</Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {despesas.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhuma despesa cadastrada</CardContent></Card>
            ) : (
              despesas.map((d) => (
                <Card key={d.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{d.descricao}</div>
                      <div className="text-sm text-red-600">R$ {Number(d.valor).toFixed(2)}</div>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => remover(d.id, "despesas")}>Excluir</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2">
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
              <Input value={editForm.telefone} onChange={(e) => setEditForm((prev) => ({ ...prev, telefone: formatarTelefone(e.target.value) }))} />
            </div>
            <div className="grid gap-1">
              <Label>Valor</Label>
              <Input type="number" value={editForm.valor} onChange={(e) => setEditForm((prev) => ({ ...prev, valor: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>App</Label>
              <select value={editForm.app} onChange={(e) => setEditForm((prev) => ({ ...prev, app: e.target.value }))} className="w-full h-10 rounded-md border px-3 bg-background">
                <option value="P2P">P2P</option>
                <option value="OTT">OTT</option>
                <option value="KPLAY">KPLAY</option>
              </select>
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
    </div>
  );
}
