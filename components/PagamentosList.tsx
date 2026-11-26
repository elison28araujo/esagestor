"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MetodoPagamento, Pagamento } from "@/lib/types";
import { escapeCsvValue } from "@/lib/utils";
import { Download, Loader2, Receipt, Trash2, Search, X } from "lucide-react";

interface PagamentosListProps {
  pagamentos: Pagamento[];
  onRemover: (id: string) => Promise<void>;
  onAtualizarMetodo?: (id: string, metodo: MetodoPagamento) => Promise<void>;
}

const METODOS: { id: MetodoPagamento; label: string; badge: string }[] = [
  { id: "pix", label: "Pix", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { id: "mercadopago", label: "Mercado Pago", badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  { id: "cartao", label: "Cartão", badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  { id: "dinheiro", label: "Dinheiro", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
];

function normalizarMetodo(m?: string): MetodoPagamento {
  if (m === "cartao" || m === "mercadopago" || m === "dinheiro" || m === "pix") return m;
  return "pix";
}

// Helpers para obter data/período no fuso horário de Brasília
function getPeriodoBrasilia(dateInput: string | number | Date) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
    });
    const formatted = formatter.format(d);
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
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
    });
    return formatter.format(d);
  } catch {
    return null;
  }
}

export function PagamentosList({ pagamentos, onRemover, onAtualizarMetodo }: PagamentosListProps) {
  const [busca, setBusca] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("todos");
  const [selectedDay, setSelectedDay] = useState("todos");
  const [selectedMetodo, setSelectedMetodo] = useState<"todos" | MetodoPagamento>("todos");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState(false);

  async function handleRemover() {
    if (!confirmId) return;
    setRemovendo(true);
    await onRemover(confirmId);
    setRemovendo(false);
    setConfirmId(null);
  }

  const confirmItem = pagamentos.find((p) => p.id === confirmId);

  // Períodos (Mês/Ano) disponíveis no histórico
  const periodosDisponiveis = useMemo(() => {
    const periods = new Set<string>();
    pagamentos.forEach((p) => {
      const periodStr = getPeriodoBrasilia(p.data);
      if (periodStr) periods.add(periodStr);
    });
    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  }, [pagamentos]);

  function formatPeriodoLabel(periodStr: string) {
    const [year, month] = periodStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const mStr = date.toLocaleString("pt-BR", { month: "long" });
    return `${mStr.charAt(0).toUpperCase() + mStr.slice(1)} de ${year}`;
  }

  // Filtragem dos pagamentos por busca, período e dia
  const pagamentosFiltrados = useMemo(() => {
    let list = pagamentos.slice();

    // 1. Filtrar por busca textual
    const q = busca.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.cliente.toLowerCase().includes(q) ||
          p.usuario.toLowerCase().includes(q) ||
          p.app.toLowerCase().includes(q)
      );
    }

    // 2. Filtrar por período (Mês/Ano) de Brasília
    if (selectedPeriod !== "todos") {
      list = list.filter((p) => getPeriodoBrasilia(p.data) === selectedPeriod);
    }

    // 3. Filtrar por dia do mês de Brasília
    if (selectedDay !== "todos") {
      list = list.filter((p) => getDiaBrasilia(p.data) === selectedDay);
    }

    // 4. Filtrar por método de pagamento
    if (selectedMetodo !== "todos") {
      list = list.filter((p) => normalizarMetodo(p.metodoPagamento) === selectedMetodo);
    }

    // Ordenar por data decrescente
    return list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [pagamentos, busca, selectedPeriod, selectedDay, selectedMetodo]);

  const receitaTotal = useMemo(() => {
    return pagamentosFiltrados.reduce((sum, p) => sum + Number(p.valor || 0), 0);
  }, [pagamentosFiltrados]);

  const totaisPorMetodo = useMemo(() => {
    const map: Record<MetodoPagamento, number> = { pix: 0, mercadopago: 0, cartao: 0, dinheiro: 0 };
    pagamentosFiltrados.forEach((p) => {
      const m = normalizarMetodo(p.metodoPagamento);
      map[m] += Number(p.valor || 0);
    });
    return map;
  }, [pagamentosFiltrados]);

  function exportarCsv() {
    const headers = ["Cliente", "Usuario", "App", "Metodo", "Valor", "Data"];
    const rows = pagamentosFiltrados.map((p) => [
      escapeCsvValue(p.cliente),
      escapeCsvValue(p.usuario),
      escapeCsvValue(p.app),
      escapeCsvValue(normalizarMetodo(p.metodoPagamento)),
      escapeCsvValue(Number(p.valor || 0).toFixed(2)),
      escapeCsvValue(new Date(p.data).toLocaleString("pt-BR")),
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-pagamentos-${selectedPeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Resumo Financeiro Simples */}
      <Card className="border-none bg-gradient-to-br from-blue-500/10 to-blue-500/5 shadow-sm dark:from-blue-900/20 dark:to-blue-900/5">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">
              {selectedPeriod !== "todos" || selectedDay !== "todos" 
                ? "Receita do Filtro Selecionado" 
                : "Receita Acumulada no Histórico"}
            </div>
            <div className="mt-2 text-3xl font-heading font-bold text-blue-600 dark:text-blue-400">
              R$ {receitaTotal.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={exportarCsv}
              disabled={pagamentosFiltrados.length === 0}
              className="gap-1.5 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Receipt className="h-10 w-10 text-blue-500 opacity-60 hidden sm:block" />
          </div>
        </CardContent>
      </Card>

      {/* Filtro rápido por método de pagamento */}
      <div className="flex flex-wrap gap-1.5">
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

      {/* Filtros de Data e Busca */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        {/* Barra de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-11 pl-10 pr-10 dark:border-slate-800 dark:bg-slate-900"
            placeholder="Buscar por cliente, usuário ou app..."
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

        {/* Seletor de Mês/Ano */}
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

        {/* Seletor de Dia */}
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

      {/* Lista de Pagamentos */}
      <div className="grid gap-4">
        {pagamentosFiltrados.length === 0 ? (
          <Card className="bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60">
            <CardContent className="py-12 text-center text-slate-500">
              {busca || selectedPeriod !== "todos" || selectedDay !== "todos" 
                ? "Nenhum pagamento encontrado para os filtros selecionados." 
                : "Nenhum histórico de pagamentos registrado."}
            </CardContent>
          </Card>
        ) : (
          pagamentosFiltrados.map((item) => (
            <Card key={item.id} className="border-slate-200/60 dark:border-slate-800/60 hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                    {item.cliente}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {item.app}
                    </span>
                    {onAtualizarMetodo ? (
                      <select
                        value={normalizarMetodo(item.metodoPagamento)}
                        onChange={(e) => onAtualizarMetodo(item.id, e.target.value as MetodoPagamento)}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        title="Alterar forma de pagamento"
                      >
                        {METODOS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {METODOS.find((m) => m.id === normalizarMetodo(item.metodoPagamento))?.label || "Pix"}
                      </span>
                    )}
                    <span className="text-slate-500 dark:text-slate-400">
                      Usuário: <strong className="text-slate-700 dark:text-slate-300">{item.usuario}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>Pago em: {new Date(item.data).toLocaleDateString("pt-BR") + " " + new Date(item.data).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-heading font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                    + R$ {Number(item.valor).toFixed(2)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    onClick={() => setConfirmId(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!confirmId}
        title="Estornar Pagamento"
        message={`Deseja estornar o pagamento de "${confirmItem?.cliente}" no valor de R$ ${Number(confirmItem?.valor || 0).toFixed(2)}? Esta ação irá removê-lo do histórico financeiro.`}
        onConfirm={handleRemover}
        onCancel={() => setConfirmId(null)}
        loading={removendo}
      />
    </div>
  );
}
