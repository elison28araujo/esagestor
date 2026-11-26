"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CategoriaDespesa, Despesa, DespesaRecorrente, TipoDespesa } from "@/lib/types";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Repeat,
  Search,
  Trash2,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";

interface NovaDespesaInput {
  descricao: string;
  valor: string;
  categoria: CategoriaDespesa;
  tipo: TipoDespesa;
  data?: string;
}

interface DespesaListProps {
  despesas: Despesa[];
  recorrentes: DespesaRecorrente[];
  onAdd: (dados: NovaDespesaInput) => Promise<void>;
  onEditar: (id: string, dados: Partial<Despesa>) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
  onAddRecorrente: (item: Omit<DespesaRecorrente, "id">) => Promise<void>;
  onRemoverRecorrente: (id: string) => Promise<void>;
}

const CATEGORIAS: { id: CategoriaDespesa; label: string; cor: string }[] = [
  { id: "creditos", label: "Créditos / Servidor", cor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  { id: "infraestrutura", label: "Infra / Sistema", cor: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" },
  { id: "marketing", label: "Marketing", cor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  { id: "pessoal", label: "Pessoal / Retirada", cor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30" },
  { id: "outros", label: "Outros", cor: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30" },
];

const ATALHOS_RAPIDOS: { label: string; descricao: string; valor: string; categoria: CategoriaDespesa; tipo: TipoDespesa }[] = [
  { label: "+ Crédito Warez (R$ 90)", descricao: "Crédito Warez", valor: "90", categoria: "creditos", tipo: "operacao" },
  { label: "+ Crédito Five (R$ 80)", descricao: "Crédito Five", valor: "80", categoria: "creditos", tipo: "operacao" },
  { label: "+ Crédito Genial (R$ 70)", descricao: "Crédito Genial", valor: "70", categoria: "creditos", tipo: "operacao" },
  { label: "+ Retirada Pessoal", descricao: "Retirada Pessoal", valor: "", categoria: "pessoal", tipo: "retirada" },
];

function getPeriodoBrasilia(dateInput: string | number | Date) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    const parts = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
    }).format(d);
    const [mes, ano] = parts.split("/");
    return `${ano}-${mes}`;
  } catch {
    return null;
  }
}

function getTodayDateInput() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function inferirCategoriaDespesa(d: Despesa): CategoriaDespesa {
  if (d.categoria && CATEGORIAS.some((c) => c.id === d.categoria)) {
    return d.categoria as CategoriaDespesa;
  }
  const desc = (d.descricao || "").toLowerCase();
  if (desc.includes("crédito") || desc.includes("credito") || desc.includes("warez") || desc.includes("five") || desc.includes("genial")) {
    return "creditos";
  }
  if (desc.includes("mercado") || desc.includes("pessoal") || desc.includes("retirada")) {
    return "pessoal";
  }
  return "outros";
}

export function inferirTipoDespesa(d: Despesa): TipoDespesa {
  if (d.tipo === "operacao" || d.tipo === "retirada") return d.tipo;
  return inferirCategoriaDespesa(d) === "pessoal" ? "retirada" : "operacao";
}

export function DespesaList({
  despesas,
  recorrentes,
  onAdd,
  onEditar,
  onRemover,
  onAddRecorrente,
  onRemoverRecorrente,
}: DespesaListProps) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<CategoriaDespesa>("creditos");
  const [tipo, setTipo] = useState<TipoDespesa>("operacao");
  const [dataInput, setDataInput] = useState(getTodayDateInput);
  const [adicionando, setAdicionando] = useState(false);
  const [erro, setErro] = useState("");

  // Filtros
  const [busca, setBusca] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<"todas" | CategoriaDespesa>("todas");

  // Edição e exclusão
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [editandoItem, setEditandoItem] = useState<Despesa | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editValor, setEditValor] = useState("");
  const [editCat, setEditCat] = useState<CategoriaDespesa>("creditos");
  const [editTipo, setEditTipo] = useState<TipoDespesa>("operacao");
  const [editData, setEditData] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Recorrentes
  const [recorrentesAberto, setRecorrentesAberto] = useState(false);
  const [recDesc, setRecDesc] = useState("");
  const [recValor, setRecValor] = useState("");
  const [recCat, setRecCat] = useState<CategoriaDespesa>("infraestrutura");
  const [recTipo, setRecTipo] = useState<TipoDespesa>("operacao");
  const [recDia, setRecDia] = useState("1");
  const [salvandoRec, setSalvandoRec] = useState(false);
  const [lancandoRecId, setLancandoRecId] = useState<string | null>(null);

  function handleCategoriaChange(novaCat: CategoriaDespesa) {
    setCategoria(novaCat);
    setTipo(novaCat === "pessoal" ? "retirada" : "operacao");
  }

  async function handleAdd() {
    if (!descricao.trim() || !valor || Number(valor) <= 0) {
      setErro("Preencha descrição e um valor válido.");
      return;
    }
    setErro("");
    setAdicionando(true);
    const isoData = dataInput ? new Date(`${dataInput}T12:00:00`).toISOString() : new Date().toISOString();
    await onAdd({ descricao, valor, categoria, tipo, data: isoData });
    setDescricao("");
    setValor("");
    setDataInput(getTodayDateInput());
    setAdicionando(false);
  }

  function abrirEdicao(item: Despesa) {
    const cat = inferirCategoriaDespesa(item);
    const tp = inferirTipoDespesa(item);
    setEditandoItem(item);
    setEditDesc(item.descricao);
    setEditValor(String(item.valor));
    setEditCat(cat);
    setEditTipo(tp);
    const d = new Date(item.data);
    setEditData(!isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : getTodayDateInput());
  }

  async function handleSalvarEdicao() {
    if (!editandoItem || !editDesc.trim() || !editValor || Number(editValor) <= 0) return;
    setSalvandoEdicao(true);
    await onEditar(editandoItem.id, {
      descricao: editDesc.trim(),
      valor: Number(editValor),
      categoria: editCat,
      tipo: editTipo,
      data: editData ? new Date(`${editData}T12:00:00`).toISOString() : editandoItem.data,
    });
    setSalvandoEdicao(false);
    setEditandoItem(null);
  }

  async function handleRemover() {
    if (!confirmId) return;
    setRemovendo(true);
    await onRemover(confirmId);
    setRemovendo(false);
    setConfirmId(null);
  }

  async function handleAddRecorrente() {
    if (!recDesc.trim() || !recValor || Number(recValor) <= 0) return;
    setSalvandoRec(true);
    await onAddRecorrente({
      descricao: recDesc.trim(),
      valor: Number(recValor),
      categoria: recCat,
      tipo: recTipo,
      diaVencimento: Math.min(31, Math.max(1, Number(recDia) || 1)),
    });
    setRecDesc("");
    setRecValor("");
    setSalvandoRec(false);
  }

  async function handleLancarRecorrente(rec: DespesaRecorrente) {
    setLancandoRecId(rec.id);
    const now = new Date();
    const dia = String(Math.min(28, rec.diaVencimento || now.getDate())).padStart(2, "0");
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const iso = new Date(`${now.getFullYear()}-${mes}-${dia}T12:00:00`).toISOString();
    await onAdd({
      descricao: rec.descricao,
      valor: String(rec.valor),
      categoria: (rec.categoria as CategoriaDespesa) || "outros",
      tipo: rec.tipo || "operacao",
      data: iso,
    });
    setLancandoRecId(null);
  }

  const periodosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    const atual = getPeriodoBrasilia(new Date());
    if (atual) set.add(atual);
    despesas.forEach((d) => {
      const p = getPeriodoBrasilia(d.data);
      if (p) set.add(p);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [despesas]);

  function formatPeriodoLabel(periodStr: string) {
    const [year, month] = periodStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const mStr = date.toLocaleString("pt-BR", { month: "long" });
    return `${mStr.charAt(0).toUpperCase() + mStr.slice(1)} de ${year}`;
  }

  const despesasFiltradas = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return despesas
      .filter((d) => {
        if (selectedPeriod !== "todos" && getPeriodoBrasilia(d.data) !== selectedPeriod) return false;
        if (filtroCategoria !== "todas" && inferirCategoriaDespesa(d) !== filtroCategoria) return false;
        if (q && !d.descricao.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [despesas, selectedPeriod, filtroCategoria, busca]);

  const resumo = useMemo(() => {
    let operacao = 0;
    let retirada = 0;
    const porCategoria: Record<CategoriaDespesa, number> = {
      creditos: 0,
      infraestrutura: 0,
      marketing: 0,
      pessoal: 0,
      outros: 0,
    };
    despesasFiltradas.forEach((d) => {
      const v = Number(d.valor || 0);
      const cat = inferirCategoriaDespesa(d);
      const tp = inferirTipoDespesa(d);
      porCategoria[cat] = (porCategoria[cat] || 0) + v;
      if (tp === "retirada") retirada += v;
      else operacao += v;
    });
    return {
      total: operacao + retirada,
      operacao,
      retirada,
      porCategoria,
    };
  }, [despesasFiltradas]);

  const confirmItem = despesas.find((d) => d.id === confirmId);

  return (
    <div className="space-y-4">
      {/* Resumo Financeiro das Despesas */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-slate-200/80 dark:border-slate-800/80">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total de Saídas</div>
            <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
              R$ {resumo.total.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{despesasFiltradas.length} lançamento(s)</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 dark:border-slate-800/80">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Custos da Operação</div>
            <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              R$ {resumo.operacao.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Créditos, infra e marketing</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 dark:border-slate-800/80">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Retiradas Pessoais</div>
            <div className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              R$ {resumo.retirada.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Não distorce o lucro operacional</div>
          </CardContent>
        </Card>
      </div>

      {/* Nova despesa */}
      <Card>
        <CardContent className="grid gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <TrendingDown className="h-4 w-4 text-red-500" /> Nova despesa
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ATALHOS_RAPIDOS.map((atalho) => (
                <button
                  key={atalho.label}
                  type="button"
                  onClick={() => {
                    setDescricao(atalho.descricao);
                    setValor(atalho.valor);
                    setCategoria(atalho.categoria);
                    setTipo(atalho.tipo);
                  }}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {atalho.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Descrição (ex: Crédito Warez)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <Input
              placeholder="Valor (R$)"
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
            <select
              value={categoria}
              onChange={(e) => handleCategoriaChange(e.target.value as CategoriaDespesa)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Classificação:</span>
              <button
                type="button"
                onClick={() => setTipo("operacao")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  tipo === "operacao"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Custo da Operação
              </button>
              <button
                type="button"
                onClick={() => setTipo("retirada")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  tipo === "retirada"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                Retirada Pessoal
              </button>
            </div>

            <Button onClick={handleAdd} disabled={adicionando} className="h-10 px-6">
              {adicionando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Adicionar despesa
            </Button>
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 dark:bg-red-950 dark:text-red-300">
              {erro}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Despesas Recorrentes / Contas Fixas */}
      <Card>
        <CardContent className="p-4">
          <button
            type="button"
            onClick={() => setRecorrentesAberto((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
              <Repeat className="h-4 w-4 text-indigo-500" />
              Despesas Recorrentes / Contas Fixas
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {recorrentes.length}
              </span>
            </div>
            {recorrentesAberto ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {recorrentesAberto && (
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="grid gap-2 sm:grid-cols-5">
                <Input
                  placeholder="Descrição fixa"
                  value={recDesc}
                  onChange={(e) => setRecDesc(e.target.value)}
                  className="sm:col-span-2"
                />
                <Input
                  placeholder="Valor (R$)"
                  type="number"
                  step="0.01"
                  value={recValor}
                  onChange={(e) => setRecValor(e.target.value)}
                />
                <select
                  value={recCat}
                  onChange={(e) => {
                    const cat = e.target.value as CategoriaDespesa;
                    setRecCat(cat);
                    setRecTipo(cat === "pessoal" ? "retirada" : "operacao");
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="Dia"
                    value={recDia}
                    onChange={(e) => setRecDia(e.target.value)}
                    title="Dia do vencimento"
                    className="w-16"
                  />
                  <Button onClick={handleAddRecorrente} disabled={salvandoRec} className="flex-1">
                    {salvandoRec ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </div>

              {recorrentes.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma conta fixa cadastrada ainda.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {recorrentes.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 p-3 dark:border-slate-800"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {rec.descricao}
                        </div>
                        <div className="text-xs text-slate-500">
                          R$ {Number(rec.valor).toFixed(2)} • Dia {rec.diaVencimento || 1} •{" "}
                          {rec.tipo === "retirada" ? "Pessoal" : "Operação"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => handleLancarRecorrente(rec)}
                          disabled={lancandoRecId === rec.id}
                        >
                          {lancandoRecId === rec.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Lançar no mês"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-slate-400 hover:text-rose-600"
                          onClick={() => onRemoverRecorrente(rec.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros e Busca */}
      <div className="space-y-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar despesa por descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 pr-10"
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

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="todos">Todos os meses</option>
              {periodosDisponiveis.map((p) => (
                <option key={p} value={p}>
                  {formatPeriodoLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFiltroCategoria("todas")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              filtroCategoria === "todas"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Todas
          </button>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFiltroCategoria(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filtroCategoria === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {cat.label}
              {resumo.porCategoria[cat.id] > 0 && ` (R$ ${resumo.porCategoria[cat.id].toFixed(0)})`}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Despesas */}
      {despesasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Nenhuma despesa encontrada para os filtros selecionados.
          </CardContent>
        </Card>
      ) : (
        despesasFiltradas.map((item) => {
          const cat = inferirCategoriaDespesa(item);
          const tp = inferirTipoDespesa(item);
          const catInfo = CATEGORIAS.find((c) => c.id === cat) || CATEGORIAS[4];
          return (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{item.descricao}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${catInfo.cor}`}>
                      {catInfo.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        tp === "retirada"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-300"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Wallet className="h-2.5 w-2.5" />
                      {tp === "retirada" ? "Pessoal" : "Operação"}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-red-600 mt-1">R$ {Number(item.valor).toFixed(2)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {new Date(item.data).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => abrirEdicao(item)} title="Editar despesa">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setConfirmId(item.id)} title="Excluir despesa">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Excluir despesa"
        message={`Excluir "${confirmItem?.descricao}"?`}
        onConfirm={handleRemover}
        onCancel={() => setConfirmId(null)}
        loading={removendo}
      />

      <ConfirmDialog
        open={!!editandoItem}
        title="Editar Despesa"
        message={
          <div className="space-y-3 pt-2">
            <Input placeholder="Descrição" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            <Input
              placeholder="Valor (R$)"
              type="number"
              step="0.01"
              value={editValor}
              onChange={(e) => setEditValor(e.target.value)}
            />
            <select
              value={editCat}
              onChange={(e) => {
                const c = e.target.value as CategoriaDespesa;
                setEditCat(c);
                setEditTipo(c === "pessoal" ? "retirada" : "operacao");
              }}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditTipo("operacao")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                  editTipo === "operacao" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                }`}
              >
                Custo da Operação
              </button>
              <button
                type="button"
                onClick={() => setEditTipo("retirada")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                  editTipo === "retirada" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                }`}
              >
                Retirada Pessoal
              </button>
            </div>
            <Input type="date" value={editData} onChange={(e) => setEditData(e.target.value)} />
          </div>
        }
        onConfirm={handleSalvarEdicao}
        onCancel={() => setEditandoItem(null)}
        loading={salvandoEdicao}
        confirmLabel="Salvar"
      />
    </div>
  );
}
