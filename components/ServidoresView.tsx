"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Acesso, ConsumoCredito, ServidorConfig, UsuarioLinha } from "@/lib/types";
import { extrairLoginUsuario } from "@/lib/utils";
import {
  Calendar,
  Coins,
  Download,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  Trash2,
  Users,
  X,
} from "lucide-react";

interface ServidoresViewProps {
  servidores: ServidorConfig[];
  usuariosLinhas: UsuarioLinha[];
  consumos: ConsumoCredito[];
  acessos: Acesso[];
  onAdicionarCredito: (servidorNome: string, quantidade: number) => Promise<void>;
  onSalvarServidor: (servidor: ServidorConfig) => Promise<void>;
  onCriarUsuario: (dados: {
    login: string;
    servidor: string;
    vencimento: string;
    descontarCredito: boolean;
    observacao?: string;
  }) => Promise<void>;
  onEditarUsuario: (id: string, dados: Partial<UsuarioLinha>) => Promise<void>;
  onRenovarUsuario: (usuario: UsuarioLinha) => Promise<void>;
  onRemoverUsuario: (id: string) => Promise<void>;
  onImportarUsuariosDosClientes: () => Promise<void>;
}

function getDefaultVencimentoInput() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ServidoresView({
  servidores,
  usuariosLinhas,
  consumos,
  acessos,
  onAdicionarCredito,
  onSalvarServidor,
  onCriarUsuario,
  onEditarUsuario,
  onRenovarUsuario,
  onRemoverUsuario,
  onImportarUsuariosDosClientes,
}: ServidoresViewProps) {
  // Comprar créditos
  const [servidorCompra, setServidorCompra] = useState(servidores[0]?.nome || "Five");
  const [qtdCompra, setQtdCompra] = useState("10");
  const [comprando, setComprando] = useState(false);

  // Novo servidor
  const [novoSrvAberto, setNovoSrvAberto] = useState(false);
  const [novoSrvNome, setNovoSrvNome] = useState("");
  const [novoSrvValor, setNovoSrvValor] = useState("8");
  const [novoSrvMax, setNovoSrvMax] = useState("2");
  const [salvandoSrv, setSalvandoSrv] = useState(false);

  // Editar servidor
  const [editSrv, setEditSrv] = useState<ServidorConfig | null>(null);
  const [editSrvValor, setEditSrvValor] = useState("");
  const [editSrvEstoque, setEditSrvEstoque] = useState("");

  // Novo usuário
  const [novoUserLogin, setNovoUserLogin] = useState("");
  const [novoUserSrv, setNovoUserSrv] = useState(servidores[0]?.nome || "Warez");
  const [novoUserVenc, setNovoUserVenc] = useState(getDefaultVencimentoInput);
  const [novoUserDescontar, setNovoUserDescontar] = useState(true);
  const [criandoUser, setCriandoUser] = useState(false);

  // Editar usuário
  const [editUser, setEditUser] = useState<UsuarioLinha | null>(null);
  const [editUserLogin, setEditUserLogin] = useState("");
  const [editUserSrv, setEditUserSrv] = useState("");
  const [editUserVenc, setEditUserVenc] = useState("");
  const [editUserDescontado, setEditUserDescontado] = useState(true);
  const [editUserObs, setEditUserObs] = useState("");
  const [salvandoUser, setSalvandoUser] = useState(false);

  // Filtros de usuários
  const [buscaUser, setBuscaUser] = useState("");
  const [filtroSrv, setFiltroSrv] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "vencendo" | "vencidos">("todos");
  const [importando, setImportando] = useState(false);
  const [renovandoId, setRenovandoId] = useState<string | null>(null);

  const servidorSelecionadoCompra = useMemo(
    () => servidores.find((s) => s.nome === servidorCompra) || servidores[0],
    [servidores, servidorCompra]
  );

  const totalCompra = useMemo(() => {
    const q = Number(qtdCompra) || 0;
    const v = Number(servidorSelecionadoCompra?.valorCredito || 0);
    return q * v;
  }, [qtdCompra, servidorSelecionadoCompra]);

  const ocupacaoPorLogin = useMemo(() => {
    const map = new Map<string, Acesso[]>();
    acessos
      .filter((a) => !a.desativado)
      .forEach((a) => {
        const key = extrairLoginUsuario(a.usuario).toLowerCase();
        if (!key) return;
        const arr = map.get(key) || [];
        arr.push(a);
        map.set(key, arr);
      });
    return map;
  }, [acessos]);

  const consumosMesAtual = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return consumos
      .filter((c) => c.data.slice(0, 7) === ym)
      .reduce((sum, c) => sum + Number(c.valor || 0), 0);
  }, [consumos]);

  const usuariosFiltrados = useMemo(() => {
    const q = buscaUser.toLowerCase().trim();
    const agora = Date.now();
    return usuariosLinhas
      .filter((u) => {
        if (filtroSrv !== "todos" && u.servidor !== filtroSrv) return false;
        if (q && !u.login.toLowerCase().includes(q) && !(u.observacao || "").toLowerCase().includes(q)) {
          return false;
        }
        const dias = Math.ceil((new Date(u.vencimento).getTime() - agora) / (1000 * 60 * 60 * 24));
        if (filtroStatus === "vencidos") return dias <= 0;
        if (filtroStatus === "vencendo") return dias > 0 && dias <= 3;
        return true;
      })
      .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());
  }, [usuariosLinhas, buscaUser, filtroSrv, filtroStatus]);

  async function handleComprarCreditos() {
    const q = Number(qtdCompra);
    if (!servidorSelecionadoCompra || q <= 0) return;
    setComprando(true);
    await onAdicionarCredito(servidorSelecionadoCompra.nome, q);
    setComprando(false);
  }

  async function handleCriarServidor() {
    if (!novoSrvNome.trim()) return;
    setSalvandoSrv(true);
    await onSalvarServidor({
      id: novoSrvNome.trim().toLowerCase().replace(/\s+/g, "_"),
      nome: novoSrvNome.trim(),
      valorCredito: Number(novoSrvValor) || 8,
      estoqueCreditos: 0,
      maxClientes: Math.max(1, Number(novoSrvMax) || 2),
    });
    setNovoSrvNome("");
    setNovoSrvAberto(false);
    setSalvandoSrv(false);
  }

  async function handleSalvarEditServidor() {
    if (!editSrv) return;
    await onSalvarServidor({
      ...editSrv,
      valorCredito: Number(editSrvValor) || editSrv.valorCredito,
      estoqueCreditos: Math.max(0, Number(editSrvEstoque) || 0),
    });
    setEditSrv(null);
  }

  async function handleCriarNovoUsuario() {
    if (!novoUserLogin.trim()) return;
    setCriandoUser(true);
    const vencIso = novoUserVenc
      ? new Date(`${novoUserVenc}T12:00:00`).toISOString()
      : new Date(Date.now() + 30 * 86400000).toISOString();
    await onCriarUsuario({
      login: novoUserLogin.trim(),
      servidor: novoUserSrv,
      vencimento: vencIso,
      descontarCredito: novoUserDescontar,
    });
    setNovoUserLogin("");
    setNovoUserVenc(getDefaultVencimentoInput());
    setCriandoUser(false);
  }

  function abrirEditarUsuario(u: UsuarioLinha) {
    setEditUser(u);
    setEditUserLogin(u.login);
    setEditUserSrv(u.servidor);
    const d = new Date(u.vencimento);
    setEditUserVenc(!isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : getDefaultVencimentoInput());
    setEditUserDescontado(Boolean(u.creditoDescontadoNoCiclo));
    setEditUserObs(u.observacao || "");
  }

  async function handleSalvarEditUsuario() {
    if (!editUser || !editUserLogin.trim()) return;
    setSalvandoUser(true);
    await onEditarUsuario(editUser.id, {
      login: editUserLogin.trim(),
      servidor: editUserSrv,
      vencimento: editUserVenc ? new Date(`${editUserVenc}T12:00:00`).toISOString() : editUser.vencimento,
      creditoDescontadoNoCiclo: editUserDescontado,
      observacao: editUserObs.trim(),
    });
    setSalvandoUser(false);
    setEditUser(null);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho + Estoque dos Servidores */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Servidores, Créditos & Usuários
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Consumo no mês atual: <strong className="text-rose-600 dark:text-rose-400">R$ {consumosMesAtual.toFixed(2)}</strong> (descontado do Retorno ESA PLAY)
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setNovoSrvAberto((v) => !v)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Servidor
        </Button>
      </div>

      {novoSrvAberto && (
        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
            <Input placeholder="Nome do servidor" value={novoSrvNome} onChange={(e) => setNovoSrvNome(e.target.value)} />
            <Input
              placeholder="Valor por crédito (R$)"
              type="number"
              step="0.01"
              value={novoSrvValor}
              onChange={(e) => setNovoSrvValor(e.target.value)}
            />
            <Input
              placeholder="Máx. clientes/usuário"
              type="number"
              min={1}
              value={novoSrvMax}
              onChange={(e) => setNovoSrvMax(e.target.value)}
            />
            <Button onClick={handleCriarServidor} disabled={salvandoSrv}>
              {salvandoSrv ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Servidor"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cards dos Servidores */}
      <div className="grid gap-3 sm:grid-cols-3">
        {servidores.map((srv) => (
          <Card key={srv.id} className="border-slate-200/80 dark:border-slate-800/80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                  <Server className="h-4 w-4 text-blue-500" />
                  {srv.nome}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-slate-400 hover:text-slate-700"
                  onClick={() => {
                    setEditSrv(srv);
                    setEditSrvValor(String(srv.valorCredito));
                    setEditSrvEstoque(String(srv.estoqueCreditos));
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-heading font-bold text-emerald-600 dark:text-emerald-400">
                    {srv.estoqueCreditos} <span className="text-xs font-normal text-slate-500">créditos</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    R$ {Number(srv.valorCredito).toFixed(2)} / crédito • Até {srv.maxClientes} clientes/usuário
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comprar / Adicionar Créditos */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            <Coins className="h-4 w-4 text-amber-500" />
            Adicionar Créditos no Servidor (lança despesa no Caixa Geral)
          </div>
          <div className="grid gap-3 sm:grid-cols-4 items-center">
            <select
              value={servidorCompra}
              onChange={(e) => setServidorCompra(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              {servidores.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome} (R$ {Number(s.valorCredito).toFixed(2)}/créd.)
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              placeholder="Quantidade (ex: 10)"
              value={qtdCompra}
              onChange={(e) => setQtdCompra(e.target.value)}
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              Total: <span className="text-rose-600 dark:text-rose-400">R$ {totalCompra.toFixed(2)}</span>
            </div>
            <Button onClick={handleComprarCreditos} disabled={comprando || totalCompra <= 0} className="h-10">
              {comprando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Confirmar Compra
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cadastrar Novo Usuário */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
              <Users className="h-4 w-4 text-blue-500" />
              Cadastrar Novo Usuário (Linha)
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                setImportando(true);
                await onImportarUsuariosDosClientes();
                setImportando(false);
              }}
              disabled={importando}
              className="gap-1.5 text-xs"
            >
              {importando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Importar usuários dos clientes atuais
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Input
              placeholder="Login do usuário (ex: m8q1e2)"
              value={novoUserLogin}
              onChange={(e) => setNovoUserLogin(e.target.value)}
            />
            <select
              value={novoUserSrv}
              onChange={(e) => setNovoUserSrv(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              {servidores.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={novoUserVenc}
              onChange={(e) => setNovoUserVenc(e.target.value)}
              title="Data de vencimento do usuário"
            />
            <Button onClick={handleCriarNovoUsuario} disabled={criandoUser || !novoUserLogin.trim()} className="h-10">
              {criandoUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Cadastrar Usuário
            </Button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={novoUserDescontar}
              onChange={(e) => setNovoUserDescontar(e.target.checked)}
              className="rounded"
            />
            Descontar 1 crédito do estoque agora (desmarque se for um usuário antigo que já está ativo)
          </label>
        </CardContent>
      </Card>

      {/* Lista de Usuários (Linhas) */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar usuário por login ou observação..."
              value={buscaUser}
              onChange={(e) => setBuscaUser(e.target.value)}
              className="pl-10 pr-10"
            />
            {buscaUser && (
              <button
                onClick={() => setBuscaUser("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <select
            value={filtroSrv}
            onChange={(e) => setFiltroSrv(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900"
          >
            <option value="todos">Todos servidores</option>
            {servidores.map((s) => (
              <option key={s.id} value={s.nome}>
                {s.nome}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            {(
              [
                { id: "todos", label: `Todos (${usuariosLinhas.length})` },
                { id: "vencendo", label: "Vencendo (≤3d)" },
                { id: "vencidos", label: "Vencidos" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroStatus(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filtroStatus === f.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {usuariosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              Nenhum usuário cadastrado aqui ainda. Clique em &ldquo;Importar usuários dos clientes atuais&rdquo; ou cadastre acima.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {usuariosFiltrados.map((u) => {
              const dias = Math.ceil((new Date(u.vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const clientesVinculados = ocupacaoPorLogin.get(u.login.toLowerCase()) || [];
              const srvObj = servidores.find((s) => s.nome === u.servidor);
              const max = srvObj?.maxClientes || (u.servidor === "Warez" ? 3 : 2);
              const badgeCor =
                dias <= 0
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  : dias <= 3
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";

              return (
                <Card key={u.id} className="border-slate-200/80 dark:border-slate-800/80">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{u.login}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {u.servidor}
                          </span>
                          <span className="text-xs text-slate-500">
                            {clientesVinculados.length}/{max} clientes
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeCor}`}>
                        {dias <= 0 ? "Vencido" : dias <= 3 ? `Vence em ${dias}d` : "Ativo"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Vence: <strong className="text-slate-700 dark:text-slate-200">{new Date(u.vencimento).toLocaleDateString("pt-BR")}</strong>
                      </span>
                      <span className={u.creditoDescontadoNoCiclo ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}>
                        {u.creditoDescontadoNoCiclo ? "1 créd. no ciclo" : "Sem crédito no ciclo"}
                      </span>
                    </div>

                    {u.observacao && <p className="text-xs text-slate-400 truncate">{u.observacao}</p>}

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        disabled={renovandoId === u.id}
                        onClick={async () => {
                          setRenovandoId(u.id);
                          await onRenovarUsuario(u);
                          setRenovandoId(null);
                        }}
                      >
                        {renovandoId === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Renovar +30d (-1 créd.)
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => abrirEditarUsuario(u)} title="Editar usuário">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-slate-400 hover:text-rose-600"
                        onClick={() => onRemoverUsuario(u.id)}
                        title="Excluir usuário"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Editar Servidor */}
      <ConfirmDialog
        open={!!editSrv}
        title={`Editar Servidor (${editSrv?.nome})`}
        message={
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-500">Valor por crédito (R$)</label>
              <Input type="number" step="0.01" value={editSrvValor} onChange={(e) => setEditSrvValor(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Estoque atual de créditos</label>
              <Input type="number" min={0} value={editSrvEstoque} onChange={(e) => setEditSrvEstoque(e.target.value)} />
            </div>
          </div>
        }
        onConfirm={handleSalvarEditServidor}
        onCancel={() => setEditSrv(null)}
        confirmLabel="Salvar"
      />

      {/* Modal Editar Usuário (NÃO altera vencimento dos clientes) */}
      <ConfirmDialog
        open={!!editUser}
        title="Editar Usuário (Linha)"
        message={
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-500">
              Alterar o vencimento aqui afeta apenas este usuário no servidor — os vencimentos dos clientes permanecem intactos.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-500">Login</label>
              <Input value={editUserLogin} onChange={(e) => setEditUserLogin(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Servidor</label>
              <select
                value={editUserSrv}
                onChange={(e) => setEditUserSrv(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {servidores.map((s) => (
                  <option key={s.id} value={s.nome}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Vencimento do Usuário</label>
              <Input type="date" value={editUserVenc} onChange={(e) => setEditUserVenc(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Observação (opcional)</label>
              <Input value={editUserObs} onChange={(e) => setEditUserObs(e.target.value)} placeholder="Ex: Senha, notas..." />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editUserDescontado}
                onChange={(e) => setEditUserDescontado(e.target.checked)}
              />
              Crédito já descontado neste ciclo (não descontar ao vincular novo cliente)
            </label>
          </div>
        }
        onConfirm={handleSalvarEditUsuario}
        onCancel={() => setEditUser(null)}
        loading={salvandoUser}
        confirmLabel="Salvar Alterações"
      />
    </div>
  );
}
