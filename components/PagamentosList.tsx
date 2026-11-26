"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Despesa, MetodoPagamento, Pagamento, TipoEntrada } from "@/lib/types";
import { escapeCsvValue } from "@/lib/utils";
import { inferirCategoriaDespesa, inferirTipoDespesa } from "@/components/DespesaList";
import { ArrowDownCircle, ArrowUpCircle, Download, Trash2, Search, X } from "lucide-react";

interface PagamentosListProps {
  pagamentos: Pagamento[];
  despesas?: Despesa[];
  onRemover: (id: string) => Promise<void>;
  onRemoverDespesa?: (id: string) => Promise<void>;
  onAtualizarMetodo?: (id: string, metodo: MetodoPagamento) => Promise<void>;
}

const METODOS: { id: MetodoPagamento; label: string }[] = [
  { id: "pix", label: "Pix" },
  { id: "mercadopago", label: "Mercado Pago" },
  { id: "cartao", label: "Cartão" },
  { id: "dinheiro", label: "Dinheiro" },
];

const CATEGORIA_LABELS: Record<string, string> = {
  creditos: "Créditos / Servidor",
  infraestrutura: "Infra / Sistema",
  marketing: "Marketing",
  pessoal: "Pessoal / Retirada",
  outros: "Outros",
};

function normalizarMetodo(m?: string): MetodoPagamento {
  if (m === "cartao" || m === "mercadopago" || m === "dinheiro" || m === "pix") return m;
  return "pix";
}

function getPeriodoBrasilia(dateInput: string | number | Date) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
    }).format(d);
    const [mes, ano] = formatted.split("/");
    return `${ano}-${mes}`;
  } catch {
    return null;
  }
}

function getDiaBrasilia(dateInput: string | number | Date) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
    }).format(d);
  } catch {
    return null;
  }
}

export function PagamentosList({
  pagamentos,
  despesas = [],
  onRemover,
  onRemoverDespesa,
  onAtualizarMetodo,
}: PagamentosListProps) {
  const [busca, setBusca] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("todos");
  const [selectedDay, setSelectedDay] = useState("todos");
  const [selectedMetodo, setSelectedMetodo] = useState<"todos" | MetodoPagamento>("todos");
  const [selectedTipoEntrada, setSelectedTipoEntrada] = useState<"todos" | TipoEntrada>("todos");
  const [confirmAlvo, setConfirmAlvo] = useState<{ tipo: "pagamento" | "despesa"; id: string; label: string; valor: number } | null>(null);
  const [removendo, setRemovendo] = useState(false);

  async function handleRemover() {
    if (!confirmAlvo) return;
    setRemovendo(true);
    if (confirmAlvo.tipo === "pagamento") {
      await onRemover(confirmAlvo.id);
    } else if (onRemoverDespesa) {
      await onRemoverDespesa(confirmAlvo.id);
    }
    setRemovendo(false);
    setConfirmAlvo(null);
  }

  const periodosDisponiveis = useMemo(() => {
    const periods = new Set<string>();
    pagamentos.forEach((p) => {
      const periodStr = getPeriodoBrasilia(p.data);
      if (periodStr) periods.add(periodStr);
    });
    despesas.forEach((d) => {
      const periodStr = getPeriodoBrasilia(d.data);
      if (periodStr) periods.add(periodStr);
    });
    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  }, [pagamentos, despesas]);

  function formatPeriodoLabel(periodStr: string) {
    const [year, month] = periodStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const mStr = date.toLocaleString("pt-BR", { month: "long" });
    return `${mStr.charAt(0).toUpperCase() + mStr.slice(1)} de ${year}`;
  }

  const pagamentosFiltrados = useMemo(() => {
    let list = pagamentos.slice();
    const q = busca.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.cliente.toLowerCase().includes(q) ||
          p.usuario.toLowerCase().includes(q) ||
          p.app.toLowerCase().includes(q)
      );
    }
    if (selectedPeriod !== "todos") {
      list = list.filter((p) => getPeriodoBrasilia(p.data) === selectedPeriod);
    }
    if (selectedDay !== "todos") {
      list = list.filter((p) => getDiaBrasilia(p.data) === selectedDay);
    }
    if (selectedMetodo !== "todos") {
      list = list.filter((p) => normalizarMetodo(p.metodoPagamento) === selectedMetodo);
    }
    if (selectedTipoEntrada !== "todos") {
      list = list.filter((p) => (p.tipoEntrada === "extra" ? "extra" : "iptv") === selectedTipoEntrada);
    }
    return list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [pagamentos, busca, selectedPeriod, selectedDay, selectedMetodo, selectedTipoEntrada]);

  const despesasFiltradas = useMemo(() => {
    let list = despesas.slice();
    const q = busca.toLowerCase().trim();
    if (q) {
      list = list.filter((d) => d.descricao.toLowerCase().includes(q));
    }
    if (selectedPeriod !== "todos") {
      list = list.filter((d) => getPeriodoBrasilia(d.data) === selectedPeriod);
    }
    if (selectedDay !== "todos") {
      list = list.filter((d) => getDiaBrasilia(d.data) === selectedDay);
    }
    return list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [despesas, busca, selectedPeriod, selectedDay]);

  const { receitaTotal, receitaIptv, receitaExtra } = useMemo(() => {
    let iptv = 0;
    let extra = 0;
    pagamentosFiltrados.forEach((p) => {
      const v = Number(p.valor || 0);
      if (p.tipoEntrada === "extra") extra += v;
      else iptv += v;
    });
    return { receitaTotal: iptv + extra, receitaIptv: iptv, receitaExtra: extra };
  }, [pagamentosFiltrados]);

  const saidaTotal = useMemo(
    () => despesasFiltradas.reduce((sum, d) => sum + Number(d.valor || 0), 0),
    [despesasFiltradas]
  );

  const saldoFiltro = receitaTotal - saidaTotal;

  const totaisPorMetodo = useMemo(() => {
    const map: Record<MetodoPagamento, number> = { pix: 0, mercadopago: 0, cartao: 0, dinheiro: 0 };
    pagamentosFiltrados.forEach((p) => {
      const m = normalizarMetodo(p.metodoPagamento);
      map[m] += Number(p.valor || 0);
    });
    return map;
  }, [pagamentosFiltrados]);

  function exportarCsv() {
    const headers = ["Tipo", "Descricao/Cliente", "Usuario", "Categoria/App", "Metodo", "Valor", "Data"];
    const rowsEntradas = pagamentosFiltrados.map((p) => [
      "ENTRADA",
      escapeCsvValue(p.cliente),
      escapeCsvValue(p.usuario),
      escapeCsvValue(p.tipoEntrada === "extra" ? "Salario/Extra" : p.app),
      escapeCsvValue(normalizarMetodo(p.metodoPagamento)),
      escapeCsvValue(Number(p.valor || 0).toFixed(2)),
      escapeCsvValue(new Date(p.data).toLocaleString("pt-BR")),
    ]);
    const rowsSaidas = despesasFiltradas.map((d) => [
      "SAIDA",
      escapeCsvValue(d.descricao),
      "-",
      escapeCsvValue(CATEGORIA_LABELS[inferirCategoriaDespesa(d)] || "Outros"),
      escapeCsvValue(inferirTipoDespesa(d) === "retirada" ? "Pessoal" : "Operacao"),
      escapeCsvValue((-Number(d.valor || 0)).toFixed(2)),
      escapeCsvValue(new Date(d.data).toLocaleString("pt-BR")),
    ]);
    const csv = [headers.join(";"), ...rowsEntradas.map((r) => r.join(";")), ...rowsSaidas.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-financeiro-${selectedPeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Resumo Entradas vs Saídas */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent shadow-sm">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Entradas no Filtro
            </div>
            <div className="mt-1 text-2xl font-heading font-bold text-emerald-600 dark:text-emerald-400">
              + R$ {receitaTotal.toFixed(2)}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              IPTV: R$ {receitaIptv.toFixed(2)}
              {receitaExtra > 0 && ` • Extras/Salário: R$ ${receitaExtra.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-transparent shadow-sm">
          <CardContent className="p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Saídas no Filtro
            </div>
            <div className="mt-1 text-2xl font-heading font-bold text-rose-600 dark:text-rose-400">
              - R$ {saidaTotal.toFixed(2)}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {despesasFiltradas.length} despesa(s)
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent shadow-sm">
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Saldo do Filtro
              </div>
              <div
                className={`mt-1 text-2xl font-heading font-bold ${
                  saldoFiltro >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                R$ {saldoFiltro.toFixed(2)}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={exportarCsv}
              disabled={pagamentosFiltrados.length === 0 && despesasFiltradas.length === 0}
              className="gap-1.5 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Data e Busca */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-11 pl-10 pr-10 dark:border-slate-800 dark:bg-slate-900"
            placeholder="Buscar entrada ou saída..."
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

        <select
          className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="todos">Todos os meses</option>
          {periodosDisponiveis.map((p) => (
            <option key={p} value={p}>
              {formatPeriodoLabel(p)}
            </option>
          ))}
        </select>

        <select
          className="h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        >
          <option value="todos">Todos os dias</option>
          {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
            <option key={d} value={d}>
              Dia {d}
            </option>
          ))}
        </select>
      </div>

      {/* Filtros de Origem e Método */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: "todos", label: "Origem: Todas" },
            { id: "iptv", label: "ESA PLAY (IPTV)" },
            { id: "extra", label: "Salário / Extras" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedTipoEntrada(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selectedTipoEntrada === t.id
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="mx-1 text-slate-300 dark:text-slate-700">|</span>
        <button
          type="button"
          onClick={() => setSelectedMetodo("todos")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            selectedMetodo === "todos"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          Todos ({pagamentosFiltrados.length})
        </button>
        {METODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedMetodo(m.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selectedMetodo === m.id
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {m.label}
            {totaisPorMetodo[m.id] > 0 && ` • R$ ${totaisPorMetodo[m.id].toFixed(0)}`}
          </button>
        ))}
      </div>

      {/* Entradas e Saídas lado a lado */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-start">
        {/* Coluna Esquerda: ENTRADAS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <ArrowUpCircle className="h-4 w-4" />
              Entradas ({pagamentosFiltrados.length})
            </h3>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              + R$ {receitaTotal.toFixed(2)}
            </span>
          </div>

          {pagamentosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                Nenhuma entrada encontrada para os filtros selecionados.
              </CardContent>
            </Card>
          ) : (
            pagamentosFiltrados.map((item) => (
              <Card key={item.id} className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.cliente}</div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.tipoEntrada === "extra"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}
                      >
                        {item.tipoEntrada === "extra" ? "Salário / Extra" : item.app}
                      </span>
                      {onAtualizarMetodo ? (
                        <select
                          value={normalizarMetodo(item.metodoPagamento)}
                          onChange={(e) => onAtualizarMetodo(item.id, e.target.value as MetodoPagamento)}
                          className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          title="Alterar forma de pagamento"
                        >
                          {METODOS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      <span className="text-slate-500 dark:text-slate-400 truncate">{item.usuario}</span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-400">
                      {new Date(item.data).toLocaleDateString("pt-BR")}{" "}
                      {new Date(item.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right font-heading font-bold text-emerald-600 dark:text-emerald-400">
                      + R$ {Number(item.valor).toFixed(2)}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() =>
                        setConfirmAlvo({
                          tipo: "pagamento",
                          id: item.id,
                          label: item.cliente,
                          valor: Number(item.valor || 0),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Coluna Direita: SAÍDAS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              <ArrowDownCircle className="h-4 w-4" />
              Saídas ({despesasFiltradas.length})
            </h3>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              - R$ {saidaTotal.toFixed(2)}
            </span>
          </div>

          {despesasFiltradas.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                Nenhuma saída encontrada para os filtros selecionados.
              </CardContent>
            </Card>
          ) : (
            despesasFiltradas.map((item) => {
              const cat = inferirCategoriaDespesa(item);
              const tp = inferirTipoDespesa(item);
              return (
                <Card key={item.id} className="border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.descricao}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {CATEGORIA_LABELS[cat] || "Outros"}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            tp === "retirada"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-300"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-300"
                          }`}
                        >
                          {tp === "retirada" ? "Pessoal" : "Operação"}
                        </span>
                      </div>
                      <div className="mt-1.5 text-[11px] text-slate-400">
                        {new Date(item.data).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right font-heading font-bold text-rose-600 dark:text-rose-400">
                        - R$ {Number(item.valor).toFixed(2)}
                      </div>
                      {onRemoverDespesa && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-600"
                          onClick={() =>
                            setConfirmAlvo({
                              tipo: "despesa",
                              id: item.id,
                              label: item.descricao,
                              valor: Number(item.valor || 0),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmAlvo}
        title={confirmAlvo?.tipo === "despesa" ? "Excluir Saída" : "Estornar Entrada"}
        message={`Deseja remover "${confirmAlvo?.label}" no valor de R$ ${Number(confirmAlvo?.valor || 0).toFixed(2)}?`}
        onConfirm={handleRemover}
        onCancel={() => setConfirmAlvo(null)}
        loading={removendo}
      />
    </div>
  );
}
