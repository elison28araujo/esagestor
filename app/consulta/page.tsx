"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Search, 
  Smartphone, 
  Calendar, 
  CreditCard, 
  ChevronLeft, 
  Check, 
  Copy, 
  ExternalLink, 
  Moon, 
  Sun, 
  AlertTriangle,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  QrCode,
  Sparkles,
  HelpCircle,
  Clock,
  Tv,
  ArrowRight
} from "lucide-react";
import { gerarPixEstatico } from "@/lib/pix";
import { getApiUrl } from "@/lib/utils";

export default function ConsultaPage() {
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [acessos, setAcessos] = useState<any[]>([]);
  const [useMp, setUseMp] = useState(false);
  const [pixManual, setPixManual] = useState<any>(null);
  const [whatsappGestor, setWhatsappGestor] = useState("");

  const [acessoSelecionado, setAcessoSelecionado] = useState<any | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<"pix" | "cartao">("pix");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);

  const [pixCopiaCola, setPixCopiaCola] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending"); // "pending", "approved"
  const [copied, setCopied] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Notificação de retorno de pagamento (ex: Mercado Pago Checkout Pro redirect)
  const [returnFeedback, setReturnFeedback] = useState<{
    type: "success" | "error" | "pending";
    title: string;
    message: string;
  } | null>(null);

  // Sincronizar preferência do Dark Mode
  useEffect(() => {
    const saved = localStorage.getItem("esa_dark");
    if (saved === "1") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Verificar parâmetros na URL (status de pagamento e telefone)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get("status") || params.get("collection_status");

    if (statusParam === "approved") {
      setReturnFeedback({
        type: "success",
        title: "Pagamento Confirmado!",
        message: "Seu acesso foi renovado por 30 dias automaticamente. Desfrute da programação completa!",
      });
    } else if (statusParam === "failure") {
      setReturnFeedback({
        type: "error",
        title: "Pagamento Não Concluído",
        message: "Houve um problema na aprovação do pagamento ou a operação foi cancelada. Tente novamente.",
      });
    } else if (statusParam === "pending") {
      setReturnFeedback({
        type: "pending",
        title: "Pagamento em Processamento",
        message: "O Mercado Pago está validando os dados. Assim que aprovado, seu acesso será ativado na hora.",
      });
    }

    const telParam = params.get("telefone") || params.get("tel");
    if (telParam) {
      const cleanTel = telParam.replace(/\D/g, "");
      if (cleanTel) {
        setTelefone(formatarTelefoneExibicao(cleanTel));
        realizarBusca(cleanTel);
      }
    }
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("esa_dark", next ? "1" : "0");
  }

  // Formatador dinâmico de telefone brasileiro
  function formatarTelefoneExibicao(valor: string) {
    const digits = valor.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function handleTelefoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatado = formatarTelefoneExibicao(e.target.value);
    setTelefone(formatado);
  }

  async function realizarBusca(numLimpo: string) {
    setLoading(true);
    setErro(null);
    setAcessos([]);
    setAcessoSelecionado(null);
    setPixCopiaCola("");
    setQrCodeBase64("");
    setPaymentId("");

    try {
      const res = await fetch(getApiUrl("/api/consulta"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: numLimpo }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Dados não encontrados para este telefone.");
      }

      setAcessos(data.acessos || []);
      setUseMp(Boolean(data.useMp));
      setPixManual(data.pixManual);
      setWhatsappGestor(data.whatsappGestor || "");

      // Se houver somente 1 acesso, já abre a tela de pagamento diretamente
      if (data.acessos && data.acessos.length === 1) {
        iniciarFluxoPagamento(data.acessos[0], Boolean(data.useMp), data.pixManual, "pix");
      }
    } catch (err: any) {
      setErro(err.message || "Houve uma falha na consulta dos seus dados.");
    } finally {
      setLoading(false);
    }
  }

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    const clean = telefone.replace(/\D/g, "");
    if (!clean || clean.length < 8) {
      setErro("Por favor, digite um número de telefone com DDD válido.");
      return;
    }
    realizarBusca(clean);
  }

  function iniciarFluxoPagamento(
    acesso: any, 
    mpActive: boolean, 
    pixManualData: any, 
    metodo: "pix" | "cartao" = "pix"
  ) {
    setAcessoSelecionado(acesso);
    setFormaPagamento(metodo);
    setPixCopiaCola("");
    setQrCodeBase64("");
    setPaymentId("");
    setPaymentStatus("pending");
    setErro(null);

    if (metodo === "pix") {
      gerarPix(acesso, mpActive, pixManualData);
    }
  }

  async function gerarPix(acesso: any, mpActive: boolean, pixManualData: any) {
    if (mpActive) {
      setCheckoutLoading(true);
      try {
        const res = await fetch(getApiUrl("/api/mercado-pago/criar-pagamento"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acessoId: acesso.id }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Falha ao gerar o Pix dinâmico.");
        }

        setPixCopiaCola(data.qrCode);
        setQrCodeBase64(data.qrCodeBase64);
        setPaymentId(data.paymentId);
      } catch (err: any) {
        setErro(err.message || "Erro ao conectar com Mercado Pago.");
      } finally {
        setCheckoutLoading(false);
      }
    } else {
      // Checkout Pix Manual
      if (!pixManualData || !pixManualData.pixKey) {
        setErro("O gestor ainda não cadastrou a chave Pix de recebimento.");
        return;
      }

      try {
        const payload = gerarPixEstatico({
          chave: pixManualData.pixKey,
          nome: pixManualData.pixNome || "ESA GESTOR",
          cidade: pixManualData.pixCidade || "SAO PAULO",
          valor: Number(acesso.valor),
        });
        setPixCopiaCola(payload);
      } catch (err) {
        console.error(err);
        setErro("Erro ao estruturar o código Pix manual.");
      }
    }
  }

  // Iniciar Pagamento com Cartão de Crédito (Mercado Pago Checkout Pro)
  async function handlePagarCartao() {
    if (!acessoSelecionado) return;
    setCardLoading(true);
    setErro(null);

    try {
      const res = await fetch(getApiUrl("/api/mercado-pago/criar-preferencia"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acessoId: acessoSelecionado.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || "Falha ao iniciar checkout com cartão.");
      }

      if (data.initPoint) {
        // Redireciona com segurança para a página oficial do Mercado Pago Checkout Pro
        window.location.href = data.initPoint;
      } else {
        throw new Error("Link seguro de checkout não retornado pelo gateway.");
      }
    } catch (err: any) {
      setErro(err.message || "Não foi possível iniciar o pagamento com cartão.");
      setCardLoading(false);
    }
  }

  // Polling em tempo real do status de pagamento Pix Mercado Pago
  useEffect(() => {
    if (!paymentId || paymentStatus !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(getApiUrl(`/api/mercado-pago/status?paymentId=${paymentId}`));
        const data = await res.json();
        if (data.status === "approved") {
          setPaymentStatus("approved");
          // Atualiza o vencimento local na lista em tempo real (+30 dias)
          setAcessos((prev) =>
            prev.map((a) => {
              if (a.id === acessoSelecionado?.id) {
                const hoje = new Date();
                const venc = new Date(a.vencimento);
                const novaData = venc > hoje ? venc : hoje;
                novaData.setDate(novaData.getDate() + 30);
                return { ...a, vencimento: novaData.toISOString() };
              }
              return a;
            })
          );
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Erro ao verificar status do pagamento:", err);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [paymentId, paymentStatus, acessoSelecionado]);

  function handleCopiarTexto(texto: string, itemKey: string) {
    navigator.clipboard.writeText(texto);
    if (itemKey === "pix") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      setCopiedItem(itemKey);
      setTimeout(() => setCopiedItem(null), 2000);
    }
  }

  function formatarData(isoStr: string) {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
  }

  function getDiasRestantes(vencimentoStr: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(vencimentoStr);
    venc.setHours(0, 0, 0, 0);
    const diff = venc.getTime() - hoje.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getWhatsAppLink() {
    if (!whatsappGestor || !acessoSelecionado) return "#";
    const msg = `Olá! Realizei o pagamento da renovação de R$ ${Number(acessoSelecionado.valor).toFixed(2)} referente ao acesso ${acessoSelecionado.cliente} (Usuário: ${acessoSelecionado.usuario}). Segue o comprovante:`;
    return `https://api.whatsapp.com/send?phone=${whatsappGestor.replace(/\D/g, "")}&text=${encodeURIComponent(msg)}`;
  }

  function getWhatsAppSuporteGeral() {
    const destino = whatsappGestor ? whatsappGestor.replace(/\D/g, "") : "5591985066711";
    const msg = `Olá! Gostaria de tirar uma dúvida sobre a renovação do meu acesso no ESA PLAY / ESA GESTOR.`;
    return `https://api.whatsapp.com/send?phone=${destino}&text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Header do Portal com Efeito Vidro */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-colors shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
              E
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                  ESA PLAY
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                  Autoatendimento
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Consulta e Renovação Instantânea
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={getWhatsAppSuporteGeral()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Suporte WhatsApp</span>
            </a>
            
            <button 
              onClick={toggleDark}
              aria-label="Alternar modo escuro"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-300 shadow-sm"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-start">
        
        {/* Banner de Feedback de Retorno (Mercado Pago Redirect) */}
        {returnFeedback && (
          <div className={`w-full max-w-xl mb-6 p-4 rounded-2xl border flex items-start gap-3 shadow-lg transition-all animate-in fade-in slide-in-from-top-4 ${
            returnFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
              : returnFeedback.type === "error"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
          }`}>
            {returnFeedback.type === "success" ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : returnFeedback.type === "error" ? (
              <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="h-6 w-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-sm sm:text-base">{returnFeedback.title}</h4>
              <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed">{returnFeedback.message}</p>
            </div>
            <button 
              onClick={() => setReturnFeedback(null)} 
              className="text-xs font-bold px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition"
            >
              OK
            </button>
          </div>
        )}

        {/* Alerta de Erro */}
        {erro && (
          <div className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-3 shadow-md">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <span className="font-bold">Aviso: </span>
              {erro}
            </div>
            <button onClick={() => setErro(null)} className="text-xs text-red-500 hover:underline">
              Fechar
            </button>
          </div>
        )}

        {/* ========================================================
            ETAPA 1: TELA INICIAL DE BUSCA / HERO DE CONSULTA
        ======================================================== */}
        {!acessos.length && !acessoSelecionado && (
          <div className="w-full max-w-xl space-y-6">
            
            {/* Card Principal de Busca */}
            <Card className="rounded-3xl shadow-xl border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
                    <Sparkles className="h-3.5 w-3.5" />
                    Renovação Automática 24 Horas
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Consulte sua Mensalidade
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                    Digite seu número de WhatsApp com DDD para verificar o vencimento, status do sinal e renovar em segundos via Pix ou Cartão de Crédito.
                  </p>
                </div>

                <form onSubmit={handleBuscar} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>WhatsApp Cadastrado</span>
                      <span className="text-[11px] font-normal text-slate-400">Com DDD</span>
                    </Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input 
                        id="telefone"
                        type="tel"
                        placeholder="(91) 98506-6711"
                        value={telefone}
                        onChange={handleTelefoneChange}
                        maxLength={16}
                        className="h-13 pl-11 text-base font-semibold border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Localizando seus acessos...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span>Consultar Vencimento</span>
                        <ArrowRight className="h-4 w-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Selos de Confiança */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-1.5">
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Liberação Imediata</span>
                    <span className="text-[10px] text-slate-400">Sem espera manual</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-1.5">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Pix ou Cartão</span>
                    <span className="text-[10px] text-slate-400">Até 12x no cartão</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-1.5">
                      <Lock className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">100% Protegido</span>
                    <span className="text-[10px] text-slate-400">Mercado Pago SSL</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dúvidas ou Ajuda */}
            <div className="text-center">
              <a 
                href={getWhatsAppSuporteGeral()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition"
              >
                <span>Não sabe qual número utilizou ou precisa de ajuda?</span>
                <span className="text-blue-600 dark:text-blue-400 underline">Fale no WhatsApp</span>
              </a>
            </div>

          </div>
        )}

        {/* ========================================================
            ETAPA 2: LISTA DE ACESSOS ENCONTRADOS
        ======================================================== */}
        {acessos.length > 0 && !acessoSelecionado && (
          <div className="w-full max-w-xl space-y-4">
            
            {/* Barra de Topo */}
            <div className="flex items-center justify-between px-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAcessos([])}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 p-0 h-auto font-semibold text-xs"
              >
                <ChevronLeft className="h-4 w-4" /> Buscar outro número
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-200/60 dark:bg-slate-800 px-3 py-1 rounded-full">
                {acessos.length} acesso(s) localizado(s)
              </span>
            </div>

            {/* Cards dos Acessos */}
            {acessos.map((acesso) => {
              const dias = getDiasRestantes(acesso.vencimento);
              const isVencido = dias <= 0;
              const isExpirando = dias > 0 && dias <= 3;

              return (
                <Card 
                  key={acesso.id} 
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      
                      {/* Dados Principais */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                            {acesso.cliente}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                            {acesso.usuario}
                          </span>
                          
                          {/* Badge de Status */}
                          {isVencido ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                              Vencido (há {Math.abs(dias)} dias)
                            </span>
                          ) : isExpirando ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Expira em {dias} dia(s)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Ativo ({dias} dias restantes)
                            </span>
                          )}
                        </div>

                        {/* Metadados */}
                        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Tv className="h-4 w-4 text-blue-500 shrink-0" />
                            <span>App: <strong className="text-slate-800 dark:text-slate-200">{acesso.app || "IPTV Padrão"}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                            <span>Vence: <strong className="text-slate-800 dark:text-slate-200">{formatarData(acesso.vencimento)}</strong></span>
                          </div>
                        </div>

                        {/* Detalhes Técnicos (MAC / Key) */}
                        {(acesso.enderecoMac || acesso.chaveKey) && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-3 text-xs font-mono">
                            {acesso.enderecoMac && (
                              <button
                                onClick={() => handleCopiarTexto(acesso.enderecoMac, `mac-${acesso.id}`)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                                title="Clique para copiar o MAC"
                              >
                                <span>MAC: <strong>{acesso.enderecoMac}</strong></span>
                                {copiedItem === `mac-${acesso.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-slate-400" />}
                              </button>
                            )}
                            {acesso.chaveKey && (
                              <button
                                onClick={() => handleCopiarTexto(acesso.chaveKey, `key-${acesso.id}`)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
                                title="Clique para copiar a Chave"
                              >
                                <span>Key: <strong>{acesso.chaveKey}</strong></span>
                                {copiedItem === `key-${acesso.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-slate-400" />}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bloco de Valor e Ação */}
                      <div className="sm:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Mensalidade (30 dias)
                          </span>
                          <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            R$ {Number(acesso.valor || 0).toFixed(2)}
                          </span>
                        </div>

                        <Button 
                          onClick={() => iniciarFluxoPagamento(acesso, useMp, pixManual, "pix")}
                          className="h-11 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Renovar Acesso</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ========================================================
            ETAPA 3: PAINEL DE CHECKOUT / FORMAS DE PAGAMENTO
        ======================================================== */}
        {acessoSelecionado && (
          <div className="w-full max-w-xl space-y-4">
            
            {/* Botão Voltar */}
            <div className="flex items-center justify-between px-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setAcessoSelecionado(null);
                  setPaymentId("");
                  setPixCopiaCola("");
                  setQrCodeBase64("");
                }}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 p-0 h-auto font-semibold text-xs"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar aos acessos
              </Button>
              <span className="text-xs font-semibold text-slate-400">
                Acesso ID: #{acessoSelecionado.id.slice(0, 6)}
              </span>
            </div>

            <Card className="rounded-3xl shadow-2xl border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              
              <CardContent className="p-6 sm:p-8">
                
                {/* Resumo do Pedido de Renovação */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 mb-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Renovação de Acesso (+30 Dias)
                    </span>
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                      {acessoSelecionado.cliente} <span className="font-normal text-xs text-slate-400">({acessoSelecionado.usuario})</span>
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Tv className="h-3 w-3 text-blue-500" /> {acessoSelecionado.app || "IPTV"} • Vencimento atual: {formatarData(acessoSelecionado.vencimento)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total a pagar</span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      R$ {Number(acessoSelecionado.valor || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Status: Pagamento Aprovado com Sucesso */}
                {useMp && paymentStatus === "approved" ? (
                  <div className="text-center py-8 space-y-5 animate-in zoom-in-95 duration-300">
                    <div className="h-20 w-20 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                      <Check className="h-10 w-10 stroke-[3]" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-black text-2xl text-slate-900 dark:text-white">
                        Pagamento Aprovado com Sucesso!
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                        Seu acesso foi renovado por <strong>mais 30 dias</strong> de forma automática no servidor. Aproveite todos os canais, filmes e séries!
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={() => {
                          setAcessoSelecionado(null);
                          setPaymentId("");
                        }}
                        className="rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-6 h-11"
                      >
                        Ver Meus Acessos
                      </Button>
                      <a
                        href={getWhatsAppSuporteGeral()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 h-11 text-sm shadow-md transition"
                      >
                        Falar com Atendimento
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Seleção do Método de Pagamento (Tabs Modernas) */}
                    <div className="mb-6">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Escolha como deseja pagar:
                      </Label>
                      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                        
                        {/* Aba PIX */}
                        <button
                          type="button"
                          onClick={() => {
                            setFormaPagamento("pix");
                            if (!pixCopiaCola && !checkoutLoading) {
                              gerarPix(acessoSelecionado, useMp, pixManual);
                            }
                          }}
                          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                            formaPagamento === "pix"
                              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          <Zap className="h-4 w-4 text-emerald-500" />
                          <span>PIX Instantâneo</span>
                        </button>

                        {/* Aba Cartão de Crédito */}
                        <button
                          type="button"
                          onClick={() => setFormaPagamento("cartao")}
                          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                            formaPagamento === "cartao"
                              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          <CreditCard className="h-4 w-4 text-indigo-500" />
                          <span>Cartão de Crédito</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold hidden sm:inline">
                            Até 12x
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* ========================================================
                        ABA PIX
                    ======================================================== */}
                    {formaPagamento === "pix" && (
                      <div className="space-y-6">
                        {checkoutLoading ? (
                          <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            <span className="text-xs sm:text-sm text-slate-500 font-medium">
                              Gerando código Pix dinâmico no Mercado Pago...
                            </span>
                          </div>
                        ) : (
                          <>
                            {/* Card do QR Code */}
                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-center">
                              {useMp && qrCodeBase64 ? (
                                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                                  <img 
                                    src={`data:image/png;base64,${qrCodeBase64}`}
                                    alt="QR Code do Pix"
                                    className="h-44 w-44 object-contain"
                                  />
                                </div>
                              ) : !useMp && pixCopiaCola ? (
                                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                                  <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCopiaCola)}`}
                                    alt="QR Code do Pix"
                                    className="h-44 w-44 object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="h-44 w-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                                  <QrCode className="h-12 w-12 text-slate-400" />
                                </div>
                              )}

                              <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                  Escaneie pelo aplicativo do seu banco
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
                                  Abra o app do seu banco, escolha &quot;Pagar com Pix&quot; e aponte a câmera para o QR Code acima.
                                </p>
                              </div>
                            </div>

                            {/* Campo Copia e Cola */}
                            {pixCopiaCola && (
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                  <span>Ou copie o código Pix abaixo:</span>
                                  {copied && <span className="text-emerald-500 font-bold flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Copiado!</span>}
                                </Label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    readOnly
                                    value={pixCopiaCola}
                                    onClick={() => handleCopiarTexto(pixCopiaCola, "pix")}
                                    className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 text-xs text-slate-600 dark:text-slate-300 font-mono select-all outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <Button 
                                    onClick={() => handleCopiarTexto(pixCopiaCola, "pix")}
                                    className={`h-12 px-5 rounded-2xl font-bold shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                                      copied 
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20" 
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                                    }`}
                                  >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    <span>{copied ? "Copiado!" : "Copiar"}</span>
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Status de Identificação Automática ou Manual */}
                            {useMp ? (
                              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center gap-2.5 text-xs text-blue-700 dark:text-blue-300 font-semibold text-center">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600" />
                                </span>
                                <span>Aguardando pagamento... Assim que confirmado, esta tela atualiza sozinha.</span>
                              </div>
                            ) : (
                              whatsappGestor && (
                                <div className="space-y-3 pt-1">
                                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
                                    ⚠️ <strong>Atenção:</strong> Após realizar o pagamento via Pix, envie o comprovante para que o atendimento libere sua renovação.
                                  </div>
                                  <a 
                                    href={getWhatsAppLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/20"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span>Enviar Comprovante pelo WhatsApp</span>
                                  </a>
                                </div>
                              )
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* ========================================================
                        ABA CARTÃO DE CRÉDITO (MERCADO PAGO CHECKOUT PRO)
                    ======================================================== */}
                    {formaPagamento === "cartao" && (
                      <div className="space-y-6">
                        {useMp ? (
                          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 space-y-5">
                            
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25">
                                <CreditCard className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                                  Pagamento com Cartão de Crédito
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Parcele em até <strong>12x</strong> pelo Mercado Pago com proteção total.
                                </p>
                              </div>
                            </div>

                            {/* Bandeiras Suportadas */}
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Bandeiras Aceitas:
                              </span>
                              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                  💳 Visa
                                </span>
                                <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                  💳 Mastercard
                                </span>
                                <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                  💳 Elo
                                </span>
                                <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                  💳 Hipercard
                                </span>
                                <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                  💳 Amex
                                </span>
                              </div>
                            </div>

                            {/* Benefícios */}
                            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Aprovação rápida e renovação automática de 30 dias</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Dados criptografados de ponta a ponta</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span>Pagamento processado em ambiente seguro Mercado Pago</span>
                              </div>
                            </div>

                            {/* Botão de Ação: Iniciar Checkout Cartão */}
                            <Button 
                              onClick={handlePagarCartao}
                              disabled={cardLoading}
                              className="w-full h-13 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {cardLoading ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  <span>Conectando ao Mercado Pago...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-5 w-5" />
                                  <span>Pagar R$ {Number(acessoSelecionado.valor || 0).toFixed(2)} com Cartão</span>
                                  <ArrowRight className="h-4 w-4 ml-1" />
                                </>
                              )}
                            </Button>

                            <p className="text-[11px] text-center text-slate-400">
                              Você será redirecionado para a página oficial do Mercado Pago para digitar os dados do cartão em total segurança.
                            </p>
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                            <CreditCard className="h-10 w-10 text-slate-400 mx-auto" />
                            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                              Pagamento com cartão temporariamente indisponível
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                              O checkout com cartão de crédito ainda não foi ativado para sua região. Por favor, utilize a opção <strong>PIX</strong> para renovar na hora.
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setFormaPagamento("pix");
                                gerarPix(acessoSelecionado, useMp, pixManual);
                              }}
                              className="rounded-xl text-xs font-bold"
                            >
                              Mudar para PIX
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

              </CardContent>
            </Card>

            {/* Suporte no rodapé do checkout */}
            <div className="text-center pt-2">
              <a 
                href={getWhatsAppSuporteGeral()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition"
              >
                <span>Teve algum problema com o pagamento?</span>
                <span className="text-emerald-600 dark:text-emerald-400 underline font-bold">Chamar Suporte no WhatsApp</span>
              </a>
            </div>

          </div>
        )}

      </main>

      {/* Footer Profissional */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-950/40">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Ambiente 100% Protegido por Criptografia SSL 256-bit</span>
          </div>
          <p>&copy; {new Date().getFullYear()} ESA PLAY & ESA GESTOR. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}