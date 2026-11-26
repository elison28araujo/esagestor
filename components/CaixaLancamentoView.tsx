"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoriaEntradaExtra, EntradaRecorrente, MetodoPagamento, Pagamento } from "@/lib/types";
import { ChevronDown, ChevronUp, Loader2, Plus, Repeat, Trash2, Wallet } from "lucide-react";

interface NovaEntradaExtraInput {
  descricao: string;
  valor: string;
  categoria: CategoriaEntradaExtra;
  metodoPagamento: MetodoPagamento;
  data?: string;
}

interface CaixaLancamentoViewProps {
  pagamentos: Pagamento[];
  entradasRecorrentes: EntradaRecorrente[];
  onAddEntradaExtra: (dados: NovaEntradaExtraInput) => Promise<void>;
  onAddEntradaRecorrente: (item: Omit<EntradaRecorrente, "id">) => Promise<void>;
  onRemoverEntradaRecorrente: (id: string) => Promise<void>;
  onRemoverPagamento: (id: string) => Promise<void>;
}

const CATEGORIAS_EXTRA: { id: CategoriaEntradaExtra; label: string }[] = [
  { id: "salario", label: "Salário / Empresa" },
  { id: "caixa_inicial", label: "Caixa Inicial" },
  { id: "extra", label: "Renda Extra" },
];

const METODOS: { id: MetodoPagamento; label: string }[] = [
  { id: "pix", label: "Pix" },
  { id: "mercadopago", label: "Mercado Pago" },
  { id: "cartao", label: "Cartão" },
  { id: "dinheiro", label: "Dinheiro" },
];

function getTodayDateInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function CaixaLancamentoView({
  pagamentos,
  entradasRecorrentes,
  onAddEntradaExtra,
  onAddEntradaRecorrente,
  onRemoverEntradaRecorrente,
  onRemoverPagamento,
}: CaixaLancamentoViewProps) {
  const [extraDesc, setExtraDesc] = useState("");
  const [extraValor, setExtraValor] = useState("");
  const [extraCat, setExtraCat] = useState<CategoriaEntradaExtra>("salario");
  const [extraMetodo, setExtraMetodo] = useState<MetodoPagamento>("pix");
  const [extraData, setExtraData] = useState(getTodayDateInput);
  const [salvandoExtra, setSalvandoExtra] = useState(false);
  const [erroExtra, setErroExtra] = useState("");

  const [recAberto, setRecAberto] = useState(true);
  const [recDesc, setRecDesc] = useState("");
  const [recValor, setRecValor] = useState("");
  const [recCat, setRecCat] = useState<CategoriaEntradaExtra>("salario");
  const [recDia, setRecDia] = useState("1");
  const [salvandoRec, setSalvandoRec] = useState(false);
  const [lancandoRecId, setLancandoRecId] = useState<string | null>(null);

  const entradasExtras = useMemo(
    () =>
      pagamentos
        .filter((p) => p.tipoEntrada === "extra")
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [pagamentos]
  );

  const totalExtras = useMemo(
    () => entradasExtras.reduce((sum, p) => sum + Number(p.valor || 0), 0),
    [entradasExtras]
  );

  async function handleAddExtra() {
    if (!extraDesc.trim() || !extraValor || Number(extraValor) <= 0) {
      setErroExtra("Preencha descrição e um valor válido.");
      return;
    }
    setErroExtra("");
    setSalvandoExtra(true);
    const iso = extraData ? new Date(`${extraData}T12:00:00`).toISOString() : new Date().toISOString();
    await onAddEntradaExtra({
      descricao: extraDesc.trim(),
      valor: extraValor,
      categoria: extraCat,
      metodoPagamento: extraMetodo,
      data: iso,
    });
    setExtraDesc("");
    setExtraValor("");
    setExtraData(getTodayDateInput());
    setSalvandoExtra(false);
  }

  async function handleAddRecorrente() {
    if (!recDesc.trim() || !recValor || Number(recValor) <= 0) return;
    setSalvandoRec(true);
    await onAddEntradaRecorrente({
      descricao: recDesc.trim(),
      valor: Number(recValor),
      categoria: recCat,
      metodoPagamento: "pix",
      diaRecebimento: Math.min(31, Math.max(1, Number(recDia) || 1)),
    });
    setRecDesc("");
    setRecValor("");
    setSalvandoRec(false);
  }

  async function handleLancarRecorrente(rec: EntradaRecorrente) {
    setLancandoRecId(rec.id);
    const now = new Date();
    const dia = String(Math.min(28, rec.diaRecebimento || now.getDate())).padStart(2, "0");
    const mes = String(now.getMonth() + 1).padStart(2, "0");
    const iso = new Date(`${now.getFullYear()}-${mes}-${dia}T12:00:00`).toISOString();
    await onAddEntradaExtra({
      descricao: rec.descricao,
      valor: String(rec.valor),
      categoria: (rec.categoria as CategoriaEntradaExtra) || "salario",
      metodoPagamento: rec.metodoPagamento || "pix",
      data: iso,
    });
    setLancandoRecId(null);
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <Card className="border-none bg-gradient-to-br from-emerald-500/10 to-teal-500/5 shadow-sm dark:from-emerald-900/20 dark:to-teal-900/5">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">
              Total Lançado no Caixa (Salário / Extras)
            </div>
            <div className="mt-1 text-3xl font-heading font-bold text-emerald-600 dark:text-emerald-400">
              R$ {totalExtras.toFixed(2)}
            </div>
          </div>
          <Wallet className="h-10 w-10 text-emerald-500 opacity-60" />
        </CardContent>
      </Card>

      {/* Nova Entrada Extra / Salário */}
      <Card>
        <CardContent className="grid gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <Plus className="h-4 w-4 text-emerald-500" /> Novo Lançamento no Caixa
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setExtraDesc("Salário UEM");
                  setExtraCat("salario");
                }}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                + Salário UEM
              </button>
              <button
                type="button"
                onClick={() => {
                  setExtraDesc("Caixa Inicial do Mês");
                  setExtraCat("caixa_inicial");
                }}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                + Caixa Inicial
              </button>
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Descrição (ex: Salário UEM)"
              value={extraDesc}
              onChange={(e) => setExtraDesc(e.target.value)}
            />
            <Input
              placeholder="Valor (R$)"
              type="number"
              step="0.01"
              value={extraValor}
              onChange={(e) => setExtraValor(e.target.value)}
            />
            <select
              value={extraCat}
              onChange={(e) => setExtraCat(e.target.value as CategoriaEntradaExtra)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              {CATEGORIAS_EXTRA.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={extraMetodo}
              onChange={(e) => setExtraMetodo(e.target.value as MetodoPagamento)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
            >
              {METODOS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <Input type="date" value={extraData} onChange={(e) => setExtraData(e.target.value)} />
          </div>

          {erroExtra && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 dark:bg-red-950 dark:text-red-300">
              {erroExtra}
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleAddExtra} disabled={salvandoExtra} className="h-10 px-6">
              {salvandoExtra ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
              Lançar no Caixa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entradas Fixas / Salário Recorrente */}
      <Card>
        <CardContent className="p-4">
          <button
            type="button"
            onClick={() => setRecAberto((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
              <Repeat className="h-4 w-4 text-emerald-500" />
              Entradas Fixas / Salário Recorrente
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {entradasRecorrentes.length}
              </span>
            </div>
            {recAberto ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {recAberto && (
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="grid gap-2 sm:grid-cols-5">
                <Input
                  placeholder="Ex: Salário UEM"
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
                  onChange={(e) => setRecCat(e.target.value as CategoriaEntradaExtra)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  {CATEGORIAS_EXTRA.map((c) => (
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
                    className="w-16"
                  />
                  <Button onClick={handleAddRecorrente} disabled={salvandoRec} className="flex-1">
                    {salvandoRec ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </div>

              {entradasRecorrentes.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma entrada fixa cadastrada ainda.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {entradasRecorrentes.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 p-3 dark:border-slate-800"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {rec.descricao}
                        </div>
                        <div className="text-xs text-slate-500">
                          R$ {Number(rec.valor).toFixed(2)} • Dia {rec.diaRecebimento || 1}
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
                          onClick={() => onRemoverEntradaRecorrente(rec.id)}
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

      {/* Lançamentos Extras Recentes */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-1">
          Lançamentos no Caixa ({entradasExtras.length})
        </h3>
        {entradasExtras.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              Nenhum lançamento extra no caixa ainda.
            </CardContent>
          </Card>
        ) : (
          entradasExtras.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{item.cliente}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.usuario} • {new Date(item.data).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    + R$ {Number(item.valor).toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-red-600"
                    onClick={() => onRemoverPagamento(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
