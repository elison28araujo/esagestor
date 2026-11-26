"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Acesso, Despesa, Pagamento, UsuarioAgrupado, ServidorNome } from "@/lib/types";
import { inferirTipoDespesa } from "@/components/DespesaList";
import { SERVIDORES } from "@/lib/constants";
import { auth } from "@/lib/firebase";
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
  Sparkles,
  TrendingUp,
  Eye,
  EyeOff,
  Clock3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { cn, CUSTO_SERVIDOR_PADRAO, calcularLucroPorServidor } from "@/lib/utils";

const BRASILIA_PERIOD_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
});

const MESES_CURTOS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Helper para obter o período (AAAA-MM) no fuso horário de Brasília sem recriar Intl.DateTimeFormat
function getPeriodoBrasilia(dateInput: string | number | Date): string | null {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    const [mes, ano] = BRASILIA_PERIOD_FORMATTER.format(d).split("/");
    return `${ano}-${mes}`;
  } catch {
    return null;
  }
}

function SantaChartOverlay({
  chartWrapperRef,
  active,
}: {
  chartWrapperRef: React.RefObject<HTMLDivElement | null>;
  active: boolean;
}) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;

    let rafId = 0;
    const durationMs = 7500;
    const startTime = performance.now();

    const step = (now: number) => {
      const container = chartWrapperRef.current;
      const overlay = overlayRef.current;
      const path = container?.querySelector(".recharts-area-curve") as SVGPathElement | null;
      if (overlay && path && typeof path.getTotalLength === "function") {
        const len = path.getTotalLength();
        if (len > 10) {
          const progress = ((now - startTime) % durationMs) / durationMs;
          const dist = progress * len;
          const pt = path.getPointAtLength(dist);
          const ptNext = path.getPointAtLength(Math.min(len, dist + 4));
          const rawAngle = (Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x) * 180) / Math.PI;
          const angle = Math.max(-28, Math.min(28, rawAngle));
          const opacity = progress < 0.06 ? progress / 0.06 : progress > 0.94 ? (1 - progress) / 0.06 : 1;
          overlay.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) translate(-50%, -92%) rotate(${angle * 0.45}deg)`;
          overlay.style.opacity = String(opacity);
        }
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [active, chartWrapperRef]);

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 select-none"
      style={{ opacity: 0 }}
    >
      <img
        src="/papai-noel.gif"
        alt=""
        className="h-14 w-auto object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
}

interface DashboardProps {
  acessos: Acesso[];
  despesas: Despesa[];
  usuariosAgrupados: UsuarioAgrupado[];
  pagamentos: Pagamento[];
  onCadastrarComUsuario?: (usuario: string, servidor: string) => void;
  onFiltrarStatus?: (filtro: "vencidos" | "vencendo") => void;
  onAbrirCampanhaUpgrade?: () => void;
  christmasMode?: boolean;
}

export function Dashboard({
  acessos,
  despesas,
  usuariosAgrupados,
  pagamentos,
  onCadastrarComUsuario,
  onFiltrarStatus,
  onAbrirCampanhaUpgrade,
  christmasMode = true,
}: DashboardProps) {
  // Estado para o período selecionado (Mês/Ano). Padrão é o mês atual de Brasília.
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const periodoAtual = getPeriodoBrasilia(new Date());
    if (periodoAtual) return periodoAtual;
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  });

  // Estados da seção de Linhas com Vagas
  const [filtroServidor, setFiltroServidor] = useState<"TODOS" | ServidorNome>("TODOS");
  const [filtroTipoVaga, setFiltroTipoVaga] = useState<"TODOS" | "P2P" | "IPTV">("TODOS");
  const [custosServidor, setCustosServidor] = useState<Record<"Warez" | "Five" | "Genial", number>>(CUSTO_SERVIDOR_PADRAO);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const [ocultarValores, setOcultarValores] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("esa_hide_values") === "1";
  });
  const [pendentesPixCount, setPendentesPixCount] = useState<number>(0);
  const [metaLucro, setMetaLucro] = useState<number>(() => {
    if (typeof window === "undefined") return 2000;
    const saved = Number(localStorage.getItem("esa_meta_lucro_mensal"));
    return Number.isFinite(saved) && saved > 0 ? saved : 2000;
  });
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaInput, setMetaInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("esa_hide_values", ocultarValores ? "1" : "0");
    }
  }, [ocultarValores]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch("/api/insights-conversao", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (ativo && typeof json.pendentesCount === "number") {
          setPendentesPixCount(json.pendentesCount);
        }
      } catch {
        // Silencioso em modo estático/offline
      }
    })();
    return () => {
      ativo = false;
    };
  }, [pagamentos.length]);

  const fmtValor = (v: number) => (ocultarValores ? "R$ •••••" : `R$ ${v.toFixed(2)}`);

  const lucroPorServidor = useMemo(
    () => calcularLucroPorServidor(usuariosAgrupados, custosServidor),
    [usuariosAgrupados, custosServidor]
  );
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
    if (filtroTipoVaga === "P2P") {
      list = list.filter((u) => u.vagas.p2p > 0);
    } else if (filtroTipoVaga === "IPTV") {
      list = list.filter((u) => u.vagas.iptv > 0);
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
  }, [usuariosDisponiveis, filtroServidor, filtroTipoVaga, buscaUsuario]);

  // Pré-calcula o período (AAAA-MM) uma única vez por registro
  const pagamentosComPeriodo = useMemo(
    () => pagamentos.map((p) => ({ item: p, periodo: getPeriodoBrasilia(p.data) })),
    [pagamentos]
  );

  const despesasComPeriodo = useMemo(
    () => despesas.map((d) => ({ item: d, periodo: getPeriodoBrasilia(d.data) })),
    [despesas]
  );

  // Gerar lista de períodos disponíveis (meses que possuem transações + mês atual)
  const periodosDisponiveis = useMemo(() => {
    const periods = new Set<string>();

    const periodoAtual = getPeriodoBrasilia(new Date());
    if (periodoAtual) periods.add(periodoAtual);
    else {
      const hoje = new Date();
      periods.add(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`);
    }

    pagamentosComPeriodo.forEach(({ periodo }) => {
      if (periodo) periods.add(periodo);
    });

    despesasComPeriodo.forEach(({ periodo }) => {
      if (periodo) periods.add(periodo);
    });

    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  }, [pagamentosComPeriodo, despesasComPeriodo]);

  // Formatar rótulo amigável (Ex: "Agosto de 2026")
  function formatPeriodoLabel(periodStr: string) {
    const [year, month] = periodStr.split("-");
    const mesNome = MESES_LONGOS_PT[parseInt(month, 10) - 1] || month;
    return `${mesNome} de ${year}`;
  }

  // Filtrar pagamentos e despesas do período selecionado
  const pagamentosFiltrados = useMemo(
    () => pagamentosComPeriodo.filter((p) => p.periodo === selectedPeriod).map((p) => p.item),
    [pagamentosComPeriodo, selectedPeriod]
  );

  const despesasFiltradas = useMemo(
    () => despesasComPeriodo.filter((d) => d.periodo === selectedPeriod).map((d) => d.item),
    [despesasComPeriodo, selectedPeriod]
  );

  // Totais do período selecionado
  const totalEntrada = useMemo(
    () => pagamentosFiltrados.reduce((sum, item) => sum + Number(item.valor || 0), 0),
    [pagamentosFiltrados]
  );
  const totalSaidaOperacao = useMemo(
    () =>
      despesasFiltradas
        .filter((item) => inferirTipoDespesa(item) !== "retirada")
        .reduce((sum, item) => sum + Number(item.valor || 0), 0),
    [despesasFiltradas]
  );
  const totalRetiradas = useMemo(
    () =>
      despesasFiltradas
        .filter((item) => inferirTipoDespesa(item) === "retirada")
        .reduce((sum, item) => sum + Number(item.valor || 0), 0),
    [despesasFiltradas]
  );
  const totalSaida = totalSaidaOperacao + totalRetiradas;
  const lucro = totalEntrada - totalSaidaOperacao;
  const saldoLivre = lucro - totalRetiradas;

  const acessosAtivos = useMemo(() => acessos.filter((a) => !a.desativado), [acessos]);

  const previsaoAReceberMes = useMemo(() => {
    const [anoStr, mesStr] = selectedPeriod.split("-");
    const ano = Number(anoStr);
    const mes = Number(mesStr);
    if (!ano || !mes) return { valor: 0, qtd: 0 };
    const agora = Date.now();
    const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999).getTime();
    let valor = 0;
    let qtd = 0;
    acessosAtivos.forEach((a) => {
      if (a.acordoAtivo && Number(a.acordoValor || 0) > 0) {
        valor += Number(a.acordoValor || 0);
        qtd += 1;
        return;
      }
      const vMs = new Date(a.vencimento).getTime();
      if (vMs >= agora && vMs <= fimMes) {
        valor += Number(a.valor || 0);
        qtd += 1;
      }
    });
    return { valor, qtd };
  }, [acessosAtivos, selectedPeriod]);

  const vencendoHoje = useMemo(() => {
    const hoje = Date.now();
    return acessosAtivos.filter((a) => {
      const dias = Math.ceil((new Date(a.vencimento).getTime() - hoje) / (1000 * 60 * 60 * 24));
      return dias > 0 && dias <= 3;
    }).length;
  }, [acessosAtivos]);

  const vencidos = useMemo(() => {
    const hoje = Date.now();
    return acessosAtivos.filter((a) => {
      const dias = Math.ceil((new Date(a.vencimento).getTime() - hoje) / (1000 * 60 * 60 * 24));
      return dias <= 0;
    }).length;
  }, [acessosAtivos]);

  // Histórico de lucro por mês (para o gráfico anual de linha)
  const dadosMensais = useMemo(() => {
    const meses: Record<string, { entrada: number; saida: number; idx: number }> = {};

    pagamentosComPeriodo.forEach(({ item, periodo }) => {
      if (!periodo) return;
      const monthIdx = parseInt(periodo.split("-")[1], 10) - 1;
      const mes = MESES_CURTOS_PT[monthIdx];
      if (!mes) return;
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0, idx: monthIdx };
      meses[mes].entrada += Number(item.valor || 0);
    });

    despesasComPeriodo.forEach(({ item, periodo }) => {
      if (!periodo) return;
      const monthIdx = parseInt(periodo.split("-")[1], 10) - 1;
      const mes = MESES_CURTOS_PT[monthIdx];
      if (!mes) return;
      if (!meses[mes]) meses[mes] = { entrada: 0, saida: 0, idx: monthIdx };
      meses[mes].saida += Number(item.valor || 0);
    });

    return Object.entries(meses)
      .map(([mes, v]) => ({
        mes,
        entrada: v.entrada,
        saida: v.saida,
        lucro: v.entrada - v.saida,
        idx: v.idx,
      }))
      .sort((a, b) => a.idx - b.idx)
      .map(({ mes, entrada, saida, lucro }) => ({ mes, entrada, saida, lucro }));
  }, [pagamentosComPeriodo, despesasComPeriodo]);

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
            className="h-9 gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
            onClick={() => setOcultarValores((v) => !v)}
            title={ocultarValores ? "Exibir valores financeiros" : "Ocultar valores financeiros"}
          >
            {ocultarValores ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">{ocultarValores ? "Exibir" : "Ocultar"}</span>
          </Button>

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
              {fmtValor(totalEntrada)}
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
              {fmtValor(totalSaidaOperacao)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {totalRetiradas > 0
                ? `Custos op. • Retiradas: ${fmtValor(totalRetiradas)}`
                : "Custos operacionais"}
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">Lucro Operacional</span>
              <div className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md",
                lucro >= 0 ? "bg-blue-600 shadow-blue-500/30" : "bg-red-600 shadow-red-500/30"
              )}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              </div>
            </div>
            <div className={cn("mt-2 text-xl font-heading font-bold", lucro >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400")}>
              {fmtValor(lucro)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Margem: {totalEntrada > 0 ? ((lucro / totalEntrada) * 100).toFixed(0) : 0}%
              {totalRetiradas > 0 && ` • Livre: ${fmtValor(saldoLivre)}`}
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
              {acessosAtivos.length}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Acessos monitorados
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Fluxo de Caixa & Meta Mensal */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card className="border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                A Receber até o Fim do Mês
              </div>
              <div className="mt-1 text-xl font-heading font-bold text-emerald-600 dark:text-emerald-400">
                {fmtValor(previsaoAReceberMes.valor)}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {previsaoAReceberMes.qtd} vencimento(s) / acordo(s) previstos no período
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Projeção Entrada</div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {fmtValor(totalEntrada + previsaoAReceberMes.valor)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Meta Mensal de Lucro ({fmtValor(metaLucro)})
              </div>
              {editandoMeta ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={metaInput}
                    onChange={(e) => setMetaInput(e.target.value)}
                    className="h-6 w-20 rounded border border-slate-300 bg-white px-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    placeholder="2000"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = Number(metaInput);
                      if (val > 0) {
                        setMetaLucro(val);
                        localStorage.setItem("esa_meta_lucro_mensal", String(val));
                      }
                      setEditandoMeta(false);
                    }}
                    className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMetaInput(String(metaLucro));
                    setEditandoMeta(true);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Editar meta
                </button>
              )}
            </div>
            {(() => {
              const pct = metaLucro > 0 ? Math.max(0, Math.min(100, (lucro / metaLucro) * 100)) : 0;
              return (
                <>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{pct.toFixed(0)}% atingido</span>
                    <span>
                      {lucro >= metaLucro
                        ? "Meta batida!"
                        : `Faltam ${fmtValor(Math.max(0, metaLucro - lucro))}`}
                    </span>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </section>

      {/* Previsão de Lucro por Servidor */}
      <Card className="mb-6 border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Previsão de Lucro por Servidor (Base Mensal)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calcula quanto você terá de lucro descontando o gasto por crédito de cada servidor ({lucroPorServidor.totais.linhas} linhas / {lucroPorServidor.totais.clientes} clientes).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Receita: <strong>R$ {lucroPorServidor.totais.receitaPrevista.toFixed(2)}</strong>
              </span>
              <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-rose-600 dark:text-rose-400">
                Gasto: <strong>R$ {lucroPorServidor.totais.custoTotal.toFixed(2)}</strong>
              </span>
              <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-400">
                Lucro: R$ {lucroPorServidor.totais.lucroPrevisto.toFixed(2)} ({lucroPorServidor.totais.margem}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["Warez", "Five", "Genial"] as const).map((srv) => {
              const info = lucroPorServidor.porServidor[srv];
              return (
                <div
                  key={srv}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-[#111622]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{srv}</span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span>Custo/crédito: R$</span>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        value={custosServidor[srv]}
                        onChange={(e) =>
                          setCustosServidor((prev) => ({
                            ...prev,
                            [srv]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="w-16 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-right font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="mt-2.5 space-y-1 text-xs font-mono tabular-nums">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>{info.linhas} linha(s) × R$ {info.custoUnitario.toFixed(2)}:</span>
                      <span className="text-rose-600 dark:text-rose-400">- R$ {info.custoTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Receita ({info.clientes} cliente{info.clientes !== 1 ? "s" : ""}):</span>
                      <span className="text-slate-800 dark:text-slate-200">R$ {info.receitaPrevista.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/80 pt-1.5 font-bold dark:border-slate-800">
                      <span className="text-slate-700 dark:text-slate-300">Lucro previsto:</span>
                      <span className={info.lucroPrevisto >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        R$ {info.lucroPrevisto.toFixed(2)} ({info.margem}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {dadosMensais.length > 0 && (
        <Card className="mb-6 overflow-hidden border-slate-200/80 dark:border-slate-800/80 dark:bg-slate-900/80">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Evolução do Lucro</h3>
                <p className="text-xs text-slate-400">Resultado líquido por mês</p>
              </div>
            </div>
            <div ref={chartWrapperRef} className="relative">
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
              <SantaChartOverlay chartWrapperRef={chartWrapperRef} active={christmasMode} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights de Conversão PIX & Melhores Horários */}
      {(() => {
        const aprovadosCount = pagamentosFiltrados.length;
        const totalPixGerados = aprovadosCount + pendentesPixCount;
        const taxaConversao = totalPixGerados > 0 ? Math.round((aprovadosCount / totalPixGerados) * 100) : 0;
        const pieData = [
          { name: "Pagos", value: aprovadosCount, color: "#10b981" },
          { name: "Pendentes", value: pendentesPixCount, color: "#f59e0b" },
        ].filter((d) => d.value > 0);

        const buckets = Array.from({ length: 8 }, (_, idx) => ({
          label: `${String(idx * 3).padStart(2, "0")}h`,
          value: 0,
        }));
        pagamentosFiltrados.forEach((p) => {
          try {
            const hStr = new Intl.DateTimeFormat("pt-BR", {
              timeZone: "America/Sao_Paulo",
              hour: "2-digit",
              hour12: false,
            }).format(new Date(p.data));
            const h = parseInt(hStr, 10);
            if (!isNaN(h)) {
              const bucket = buckets[Math.floor(h / 3)];
              if (bucket) bucket.value += Number(p.valor || 0);
            }
          } catch {
            // ignora data inválida
          }
        });
        const pico = buckets.reduce((best, cur) => (cur.value > best.value ? cur : best), {
          label: "00h",
          value: 0,
        });

        return (
          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Taxa de Conversão PIX */}
            <Card className="border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <PieChartIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Taxa de Conversão PIX</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pagamentos aprovados no período vs. PIX pendentes.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-5">
                  <div className="relative h-[108px] w-[108px] shrink-0">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            innerRadius={35}
                            outerRadius={50}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {pieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full rounded-full border-[12px] border-slate-200 dark:border-slate-800" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-heading font-bold text-slate-900 dark:text-slate-100 leading-none">
                        {taxaConversao}%
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">conversão</span>
                    </div>
                  </div>
                  <ul className="flex-1 space-y-2 text-xs">
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Pagos (período)
                      </span>
                      <strong className="text-slate-900 dark:text-slate-100">{aprovadosCount}</strong>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        Pendentes (aguardando)
                      </span>
                      <strong className="text-slate-900 dark:text-slate-100">{pendentesPixCount}</strong>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Melhores Horários */}
            <Card className="border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Melhores Horários</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {pico.value > 0
                        ? `Pico entre ${pico.label} e ${String(parseInt(pico.label, 10) + 3).padStart(2, "0")}h (ideal para disparos).`
                        : "Quando seus clientes mais pagam no período."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-[112px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={buckets} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <Tooltip
                        cursor={{ fill: "rgba(148,163,184,0.12)" }}
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "#f8fafc",
                        }}
                        formatter={(val: number) => [fmtValor(Number(val)), "Recebido"]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 2, 2]}>
                        {buckets.map((entry) => (
                          <Cell
                            key={entry.label}
                            fill={entry.label === pico.label && entry.value > 0 ? "#3b82f6" : "#334155"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </section>
        );
      })()}

      {/* SEÇÃO: LINHAS COM VAGAS DISPONÍVEIS */}
      <section className="mt-8 space-y-4">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Linhas com Vagas Disponíveis
              </h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                {usuariosDisponiveis.length} linha{usuariosDisponiveis.length !== 1 ? "s" : ""} livre{usuariosDisponiveis.length !== 1 ? "s" : ""}
              </span>
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                {estatisticasServidores.Warez.vagasP2P + estatisticasServidores.Genial.vagasP2P + estatisticasServidores.Five.vagasP2P} P2P
              </span>
              <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                {estatisticasServidores.Warez.vagasIPTV + estatisticasServidores.Genial.vagasIPTV + estatisticasServidores.Five.vagasIPTV} IPTV
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contas ativas que ainda possuem vagas para cadastrar novos clientes antes de atingir o limite.
            </p>
          </div>
          {onAbrirCampanhaUpgrade && (
            <Button
              type="button"
              size="sm"
              onClick={onAbrirCampanhaUpgrade}
              className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Campanha +1 Tela (+R$ 10)
            </Button>
          )}
        </div>

        {/* Cards Informativos dos 3 Servidores */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              { nome: "Warez", preco: "R$ 9,00 / crédito", regra: "1 P2P e 2 IPTV (Até 3 clientes)" },
              { nome: "Genial", preco: "R$ 7,00 / crédito", regra: "2 IPTV ou 2 P2P (Até 2 clientes)" },
              { nome: "Five", preco: "R$ 8,00 / crédito", regra: "2 IPTV (Até 2 clientes)" },
            ] as const
          ).map((srv) => {
            const stat = estatisticasServidores[srv.nome];
            return (
              <div
                key={srv.nome}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111622]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{srv.nome}</span>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 tabular-nums">
                    {srv.preco}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {srv.regra}
                </p>
                <div className="mt-3 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Linhas c/ vagas:</span>
                    <strong className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                      {stat.usuariosComVagas} ({stat.vagasTotal} vaga{stat.vagasTotal !== 1 ? "s" : ""})
                    </strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                    <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-600 dark:text-amber-400">
                      P2P: {stat.vagasP2P} vaga{stat.vagasP2P !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-600 dark:text-blue-400">
                      IPTV: {stat.vagasIPTV} vaga{stat.vagasIPTV !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
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

            <span className="mx-1 hidden h-4 w-px bg-slate-200 dark:bg-slate-700 sm:inline-block" />

            {(
              [
                { id: "TODOS", label: "Todas" },
                { id: "P2P", label: "Só P2P" },
                { id: "IPTV", label: "Só IPTV" },
              ] as const
            ).map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => setFiltroTipoVaga(tipo.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  filtroTipoVaga === tipo.id
                    ? tipo.id === "P2P"
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : tipo.id === "IPTV"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {tipo.label}
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
              {buscaUsuario || filtroServidor !== "TODOS" || filtroTipoVaga !== "TODOS"
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
              const ocupados = u.ocupadosTotal ?? u.clientes.length;
              const porcentagem = Math.min(100, Math.round((ocupados / u.capacidadeTotal) * 100));
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
                          {ocupados}/{u.capacidadeTotal} ocupados ({porcentagem}%)
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                          {u.vagas.total} vaga{u.vagas.total !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            ocupados === 0
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
                                {c.dispositivos && c.dispositivos > 1 && (
                                  <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 dark:text-violet-300">
                                    {c.dispositivos} disp.
                                  </span>
                                )}
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
