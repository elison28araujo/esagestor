"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Acesso, Despesa, Pagamento, UsuarioAgrupado } from "@/lib/types";
import { AlertTriangle, FileText, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  acessos: Acesso[];
  despesas: Despesa[];
  usuariosAgrupados: UsuarioAgrupado[];
  pagamentos: Pagamento[];
}

export function Dashboard({ acessos, despesas, usuariosAgrupados, pagamentos }: DashboardProps) {
  // Estado para o período selecionado (Mês/Ano). Padrão é o mês atual.
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });

  // Gerar lista de períodos disponíveis (meses que possuem transações + mês atual)
  const periodosDisponiveis = useMemo(() => {
    const periods = new Set<string>();
    
    // Sempre incluir mês atual na lista
    const hoje = new Date();
    periods.add(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`);
    
    pagamentos.forEach((p) => {
      const d = new Date(p.data);
      if (!isNaN(d.getTime())) {
        periods.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
    });
    
    despesas.forEach((d) => {
      const dt = new Date(d.data);
      if (!isNaN(dt.getTime())) {
        periods.add(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
      }
    });

    // Ordenar decrescente (meses mais recentes primeiro)
    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  }, [pagamentos, despesas]);

  // Formatar rótulo amigável (Ex: "Agosto de 2026")
  function formatPeriodoLabel(periodStr: string) {
    const [year, month] = periodStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const mStr = date.toLocaleString("pt-BR", { month: "long" });
    return `${mStr.charAt(0).toUpperCase() + mStr.slice(1)} de ${year}`;
  }

  // Filtrar pagamentos do período selecionado
  const pagamentosFiltrados = useMemo(() => {
    return pagamentos.filter((p) => {
      const d = new Date(p.data);
      if (isNaN(d.getTime())) return false;
      const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return periodStr === selectedPeriod;
    });
  }, [pagamentos, selectedPeriod]);

  // Filtrar despesas do período selecionado
  const despesasFiltradas = useMemo(() => {
    return despesas.filter((d) => {
      const dt = new Date(d.data);
      if (isNaN(dt.getTime())) return false;
      const periodStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      return periodStr === selectedPeriod;
    });
  }, [despesas, selectedPeriod]);

  // Totais do período selecionado
  const totalEntrada = pagamentosFiltrados.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const totalSaida = despesasFiltradas.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const lucro = totalEntrada - totalSaida;

  const vencendoHoje = useMemo(() => {
    const hoje = Date.now();
    return acessos.filter((a) => {
      const dias = Math.ceil((new Date(a.vencimento).getTime() - hoje) / (1000 * 60 * 60 * 24));
      return dias <= 3 && dias >= 0;
    }).length;
  }, [acessos]);

  const vencidos = useMemo(() => {
    return acessos.filter((a) => new Date(a.vencimento).getTime() < Date.now()).length;
  }, [acessos]);

  // Histórico de lucro por mês (para o gráfico anual de linha)
  const dadosMensais = useMemo(() => {
    const meses: Record<string, { entrada: number; saida: number }> = {};
    pagamentos.forEach((item) => {
      const mes = new Date(item.data).toLocaleString("pt-BR", { month: "short" });
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0 };
      meses[mes].entrada += Number(item.valor || 0);
    });
    despesas.forEach((item) => {
      const mes = new Date(item.data).toLocaleString("pt-BR", { month: "short" });
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0 };
      meses[mes].saida += Number(item.valor || 0);
    });

    const nomeMeses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    return Object.entries(meses)
      .map(([mes, v]) => ({
        mes,
        entrada: v.entrada,
        saida: v.saida,
        lucro: v.entrada - v.saida,
      }))
      .sort((a, b) => {
        const idxA = nomeMeses.findIndex((m) => a.mes.toLowerCase().startsWith(m));
        const idxB = nomeMeses.findIndex((m) => b.mes.toLowerCase().startsWith(m));
        return idxA - idxB;
      });
  }, [pagamentos, despesas]);

  async function gerarRelatorioPDF() {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      
      const doc = new jsPDF();
      const dataGeracao = new Date().toLocaleDateString("pt-BR");
      const refLabel = formatPeriodoLabel(selectedPeriod);

      // Título
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Blue color (#2563eb)
      doc.text("ESA GESTOR", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105);
      doc.text(`Relatório Financeiro - Referência: ${refLabel}`, 14, 28);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dataGeracao}`, 14, 34);
      doc.line(14, 36, 196, 36);
 
      // Resumo Métricas
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("Resumo Financeiro do Mês", 14, 45);

      autoTable(doc, {
        startY: 48,
        head: [["Entradas Totais", "Saídas Totais", "Lucro Líquido"]],
        body: [[
          `R$ ${totalEntrada.toFixed(2)}`,
          `R$ ${totalSaida.toFixed(2)}`,
          `R$ ${lucro.toFixed(2)}`
        ]],
        theme: "striped",
        styles: { halign: "center", font: "helvetica", fontSize: 11 },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
      });

      // Pagamentos (Entradas)
      let currentY = (doc as any).lastAutoTable.finalY + 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Recebimentos no Período", 14, currentY);

      const rowsPagamentos = pagamentosFiltrados
        .slice()
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .map((p) => [
          new Date(p.data).toLocaleDateString("pt-BR"),
          p.cliente,
          p.app,
          `R$ ${Number(p.valor).toFixed(2)}`
        ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [["Data", "Cliente", "Aplicativo", "Valor"]],
        body: rowsPagamentos.length > 0 ? rowsPagamentos : [["-", "Sem registros", "-", "-"]],
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      });

      // Despesas (Saídas)
      currentY = (doc as any).lastAutoTable.finalY + 12;
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Despesas no Período", 14, currentY);

      const rowsDespesas = despesasFiltradas
        .slice()
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .map((d) => [
          new Date(d.data).toLocaleDateString("pt-BR"),
          d.descricao,
          `R$ ${Number(d.valor).toFixed(2)}`
        ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [["Data", "Descrição", "Valor"]],
        body: rowsDespesas.length > 0 ? rowsDespesas : [["-", "Sem registros", "-"]],
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255] },
      });

      // Salvar PDF
      doc.save(`relatorio-financeiro-esa-${selectedPeriod}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    }
  }

  return (
    <>
      {(vencidos > 0 || vencendoHoje > 0) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {vencidos > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span><strong>{vencidos}</strong> acesso{vencidos > 1 ? "s" : ""} vencido{vencidos > 1 ? "s" : ""}</span>
            </div>
          )}
          {vencendoHoje > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <span><strong>{vencendoHoje}</strong> acesso{vencendoHoje > 1 ? "s" : ""} vence{vencendoHoje > 1 ? "m" : ""} em até 3 dias</span>
            </div>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Painel Geral</h2>
        
        {/* Seletor de Período Mensal */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            id="period-selector"
            className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {periodosDisponiveis.map((p) => (
              <option key={p} value={p}>
                {formatPeriodoLabel(p)}
              </option>
            ))}
          </select>

          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-slate-900" 
            onClick={gerarRelatorioPDF}
          >
            <FileText className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-none bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 shadow-sm dark:from-emerald-900/20 dark:to-emerald-900/5">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80 text-ellipsis overflow-hidden whitespace-nowrap">Entrada no mês</div>
            <div className="mt-2 text-2xl font-heading font-bold text-emerald-600 dark:text-emerald-400">R$ {totalEntrada.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-gradient-to-br from-rose-500/10 to-rose-500/5 shadow-sm dark:from-rose-900/20 dark:to-rose-900/5">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-600/80 dark:text-rose-400/80 text-ellipsis overflow-hidden whitespace-nowrap">Saída no mês</div>
            <div className="mt-2 text-2xl font-heading font-bold text-rose-600 dark:text-rose-400">R$ {totalSaida.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className={cn("border-none shadow-sm", lucro >= 0 ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white" : "bg-gradient-to-br from-red-600 to-rose-600 text-white")}>
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80 text-ellipsis overflow-hidden whitespace-nowrap">Lucro no mês</div>
            <div className="mt-2 text-2xl font-heading font-bold">
              R$ {lucro.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/50 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-ellipsis overflow-hidden whitespace-nowrap">Total Clientes</div>
            <div className="mt-2 text-2xl font-heading font-bold text-slate-900 dark:text-slate-100">{acessos.length}</div>
          </CardContent>
        </Card>
      </section>

      {dadosMensais.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-3 text-sm font-semibold">Lucro mensal</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosMensais}>
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="lucro" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}
