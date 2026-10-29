"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Acesso, Despesa, Pagamento, UsuarioAgrupado, ServidorNome } from "@/lib/types";
import { SERVIDORES } from "@/lib/constants";
import {
  AlertTriangle,
  FileText,
  Calendar,
  Server,
  Copy,
  Check,
  PlusCircle,
  Search,
  Tv,
  Radio,
  CheckCircle2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  acessos: Acesso[];
  despesas: Despesa[];
  usuariosAgrupados: UsuarioAgrupado[];
  pagamentos: Pagamento[];
  onCadastrarComUsuario?: (usuario: string, servidor: string) => void;
  onFiltrarStatus?: (filtro: "vencidos" | "vencendo") => void;
}

export function Dashboard({
  acessos,
  despesas,
  usuariosAgrupados,
  pagamentos,
  onCadastrarComUsuario,
  onFiltrarStatus,
}: DashboardProps) {
  // Helper para obter o período (AAAA-MM) no fuso horário de Brasília
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

  // Estado para o período selecionado (Mês/Ano). Padrão é o mês atual de Brasília.
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const periodoAtual = getPeriodoBrasilia(new Date());
    if (periodoAtual) return periodoAtual;
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });

  // Estados da seção de Linhas com Vagas
  const [filtroServidor, setFiltroServidor] = useState<"TODOS" | ServidorNome>("TODOS");
  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [copiadoUser, setCopiadoUser] = useState<string | null>(null);

  function copiarLogin(login: string) {
    navigator.clipboard.writeText(login);
    setCopiadoUser(login);
    setTimeout(() => setCopiadoUser(null), 2000);
  }

  // Usuários com vagas disponíveis
  const usuariosDisponiveis = useMemo(() => {
    return usuariosAgrupados.filter((u) => u.disponivel);
  }, [usuariosAgrupados]);

  // Estatísticas por Servidor
  const estatisticasServidores = useMemo(() => {
    const stats: Record<ServidorNome, { usuariosComVagas: number; vagasTotal: number; vagasP2P: number; vagasIPTV: number }> = {
      Warez: { usuariosComVagas: 0, vagasTotal: 0, vagasP2P: 0, vagasIPTV: 0 },
      Genial: { usuariosComVagas: 0, vagasTotal: 0, vagasP2P: 0, vagasIPTV: 0 },
      Five: { usuariosComVagas: 0, vagasTotal: 0, vagasP2P: 0, vagasIPTV: 0 },
    };

    usuariosDisponiveis.forEach((u) => {
      const srv = (u.servidor as ServidorNome) || "Warez";
      if (stats[srv]) {
        stats[srv].usuariosComVagas += 1;
        stats[srv].vagasTotal += u.vagas.total;
        stats[srv].vagasP2P += u.vagas.p2p;
        stats[srv].vagasIPTV += u.vagas.iptv;
      }
    });

    return stats;
  }, [usuariosDisponiveis]);

  // Lista filtrada para exibição
  const usuariosFiltradosPorServidor = useMemo(() => {
    let list = usuariosDisponiveis;
    if (filtroServidor !== "TODOS") {
      list = list.filter((u) => u.servidor === filtroServidor);
    }
    if (buscaUsuario.trim()) {
      const q = buscaUsuario.toLowerCase();
      list = list.filter(
        (u) =>
          u.nome.toLowerCase().includes(q) ||
          u.clientes.some(
            (c) =>
              c.cliente.toLowerCase().includes(q) ||
              c.telefone.includes(q) ||
              (c.enderecoMac && c.enderecoMac.toLowerCase().includes(q))
          )
      );
    }
    return list;
  }, [usuariosDisponiveis, filtroServidor, buscaUsuario]);

  // Gerar lista de períodos disponíveis (meses que possuem transações + mês atual)
  const periodosDisponiveis = useMemo(() => {
    const periods = new Set<string>();
    
    // Sempre incluir mês atual na lista
    const periodoAtual = getPeriodoBrasilia(new Date());
    if (periodoAtual) periods.add(periodoAtual);
    else {
      const hoje = new Date();
      periods.add(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`);
    }
    
    pagamentos.forEach((p) => {
      const periodStr = getPeriodoBrasilia(p.data);
      if (periodStr) periods.add(periodStr);
    });
    
    despesas.forEach((d) => {
      const periodStr = getPeriodoBrasilia(d.data);
      if (periodStr) periods.add(periodStr);
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
      const periodStr = getPeriodoBrasilia(p.data);
      return periodStr === selectedPeriod;
    });
  }, [pagamentos, selectedPeriod]);

  // Filtrar despesas do período selecionado
  const despesasFiltradas = useMemo(() => {
    return despesas.filter((d) => {
      const periodStr = getPeriodoBrasilia(d.data);
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
            <button
              onClick={() => onFiltrarStatus?.("vencidos")}
              className="group flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm text-red-700 transition hover:bg-red-100 active:scale-95 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-950"
            >
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <strong>{vencidos}</strong>&nbsp;acesso{vencidos > 1 ? "s" : ""} vencido{vencidos > 1 ? "s" : ""}
              <span className="text-[11px] underline underline-offset-2 opacity-70 group-hover:opacity-100">
                Cobrar agora →
              </span>
            </button>
          )}
          {vencendoHoje > 0 && (
            <button
              onClick={() => onFiltrarStatus?.("vencendo")}
              className="group flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm text-amber-700 transition hover:bg-amber-100 active:scale-95 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950"
            >
              <span className="flex h-2 w-2 rounded-full bg-amber-500" />
              <strong>{vencendoHoje}</strong>&nbsp;vencendo em até 3 dias
              <span className="text-[11px] underline underline-offset-2 opacity-70 group-hover:opacity-100">
                Ver clientes →
              </span>
            </button>
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
        {/* Entrada */}
        <Card className="border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Entrada no mês</span>
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              </div>
            </div>
            <div className="mt-2 text-xl font-heading font-bold text-emerald-600 dark:text-emerald-400">
              R$ {totalEntrada.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Recebimentos do período
            </div>
          </CardContent>
        </Card>

        {/* Saída */}
        <Card className="border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Saída no mês</span>
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m19 12-7 7-7-7"/><path d="M12 5v14"/></svg>
              </div>
            </div>
            <div className="mt-2 text-xl font-heading font-bold text-rose-600 dark:text-rose-400">
              R$ {totalSaida.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Custos operacionais
            </div>
          </CardContent>
        </Card>

        {/* Lucro */}
        <Card className={cn(
          "overflow-hidden shadow-sm",
          lucro >= 0
            ? "border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent dark:from-blue-600/20 dark:to-transparent"
            : "border-red-500/20 bg-gradient-to-br from-red-600/10 to-transparent dark:from-red-600/20"
        )}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">Lucro no mês</span>
              <div className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md",
                lucro >= 0 ? "bg-blue-600 shadow-blue-500/30" : "bg-red-600 shadow-red-500/30"
              )}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
            </div>
            <div className={cn("mt-2 text-xl font-heading font-bold", lucro >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400")}>
              R$ {lucro.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Margem: {totalEntrada > 0 ? ((lucro / totalEntrada) * 100).toFixed(0) : 0}%
            </div>
          </CardContent>
        </Card>

        {/* Total Clientes */}
        <Card className="border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">Total Clientes</span>
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Users className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl font-heading font-bold text-slate-900 dark:text-slate-100">
              {acessos.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Acessos monitorados
            </div>
          </CardContent>
        </Card>
      </section>

      {dadosMensais.length > 0 && (
        <Card className="mb-6 overflow-hidden border-slate-200/80 dark:border-slate-800/80 dark:bg-slate-900/80">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Evolução do Lucro</h3>
                <p className="text-xs text-slate-400">Resultado líquido por mês</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={dadosMensais} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(m: string) => m.toUpperCase()}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `R$${v}`}
                />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-xl border border-slate-700/60 bg-slate-950/95 p-3 shadow-xl backdrop-blur-md">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                        <p className="mt-1 text-sm font-bold text-blue-400">
                          Lucro: R$ {Number(payload[0]?.value ?? 0).toFixed(2)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="lucro"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#profitGradient)"
                  dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#3b82f6" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* SEÇÃO: LINHAS COM VAGAS DISPONÍVEIS */}
      <section className="mt-8 space-y-4">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Linhas com Vagas Disponíveis
              </h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                {usuariosDisponiveis.length} linha{usuariosDisponiveis.length !== 1 ? "s" : ""} livre{usuariosDisponiveis.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contas ativas que ainda possuem vagas para cadastrar novos clientes antes de atingir o limite.
            </p>
          </div>
        </div>

        {/* Cards Informativos dos 3 Servidores */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* WAREZ */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111622]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Warez</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 tabular-nums">
                R$ 9,00 / crédito
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              1 P2P e 2 IPTV (Até 3 clientes)
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
              <span className="text-slate-500">Linhas c/ vagas:</span>
              <strong className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {estatisticasServidores.Warez.usuariosComVagas} ({estatisticasServidores.Warez.vagasTotal} vaga{estatisticasServidores.Warez.vagasTotal !== 1 ? "s" : ""})
              </strong>
            </div>
          </div>

          {/* GENIAL */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111622]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Genial</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 tabular-nums">
                R$ 7,00 / crédito
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              2 IPTV ou 2 P2P (Até 2 clientes)
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
              <span className="text-slate-500">Linhas c/ vagas:</span>
              <strong className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {estatisticasServidores.Genial.usuariosComVagas} ({estatisticasServidores.Genial.vagasTotal} vaga{estatisticasServidores.Genial.vagasTotal !== 1 ? "s" : ""})
              </strong>
            </div>
          </div>

          {/* FIVE */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111622]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Five</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 tabular-nums">
                R$ 8,00 / crédito
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              2 IPTV (Até 2 clientes)
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
              <span className="text-slate-500">Linhas c/ vagas:</span>
              <strong className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {estatisticasServidores.Five.usuariosComVagas} ({estatisticasServidores.Five.vagasTotal} vaga{estatisticasServidores.Five.vagasTotal !== 1 ? "s" : ""})
              </strong>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(["TODOS", "Warez", "Genial", "Five"] as const).map((srv) => (
              <button
                key={srv}
                type="button"
                onClick={() => setFiltroServidor(srv)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filtroServidor === srv
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {srv === "TODOS" ? "Todos os Servidores" : srv}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-8 pl-9 text-xs"
              placeholder="Filtrar linha ou cliente..."
              value={buscaUsuario}
              onChange={(e) => setBuscaUsuario(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Usuários Disponíveis */}
        {usuariosFiltradosPorServidor.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
            <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {buscaUsuario || filtroServidor !== "TODOS"
                ? "Nenhum usuário com vagas encontrado para este filtro."
                : "Todas as suas contas estão com a capacidade máxima ocupada!"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Para cadastrar novos clientes, crie um novo login/usuário no formulário de cadastro.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {usuariosFiltradosPorServidor.map((u) => {
              const porcentagem = Math.min(100, Math.round((u.clientes.length / u.capacidadeTotal) * 100));
              const srvColor =
                u.servidor === "Genial"
                  ? "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400"
                  : u.servidor === "Five"
                  ? "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400"
                  : "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400";

              return (
                <div
                  key={u.nome}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#111622] dark:hover:border-slate-700"
                >
                  <div>
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {u.nome}
                          </span>
                          <button
                            type="button"
                            onClick={() => copiarLogin(u.nome)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
                            title="Copiar usuário"
                          >
                            {copiadoUser === u.nome ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${srvColor}`}>
                        {u.servidor}
                      </span>
                    </div>

                    {/* Vagas e Ocupação */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono tabular-nums">
                          {u.clientes.length}/{u.capacidadeTotal} ocupados ({porcentagem}%)
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                          {u.vagas.total} vaga{u.vagas.total !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            u.clientes.length === 0
                              ? "bg-slate-300"
                              : porcentagem >= 66
                              ? "bg-amber-500"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${Math.max(8, porcentagem)}%` }}
                        />
                      </div>

                      <div className="mt-2 rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 font-medium">
                        ✨ {u.vagas.detalhes}
                      </div>
                    </div>

                    {/* Clientes Atuais */}
                    {u.clientes.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Clientes nesta conta:
                        </span>
                        <div className="mt-1.5 space-y-1">
                          {u.clientes.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-xs dark:bg-slate-800/40"
                            >
                              <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                {c.cliente}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                  {c.app}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ação: Usar esta linha */}
                  <div className="mt-4 pt-2">
                    <Button
                      size="sm"
                      className="w-full gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 font-medium text-xs h-7.5 rounded-lg"
                      onClick={() => onCadastrarComUsuario?.(u.nome, String(u.servidor))}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Usar esta linha (+ cliente)
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
