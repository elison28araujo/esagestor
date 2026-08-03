"use client";

import { useEffect, useState } from "react";
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
  AlertTriangle 
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pixCopiaCola, setPixCopiaCola] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending"); // "pending", "approved"
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Sincronizar dark mode preference
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

  // Autocompletar e buscar telefone se passado por parâmetro (ex: /consulta?telefone=5591985066711)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const telParam = params.get("telefone") || params.get("tel");
      if (telParam) {
        const cleanTel = telParam.replace(/\D/g, "");
        if (cleanTel) {
          setTelefone(cleanTel);
          setLoading(true);
          setErro(null);
          setAcessos([]);
          setAcessoSelecionado(null);
          setPixCopiaCola("");
          setQrCodeBase64("");
          setPaymentId("");

          fetch(getApiUrl("/api/consulta"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telefone: cleanTel }),
          })
            .then(async (res) => {
              const data = await res.json();
              if (!res.ok) {
                throw new Error(data.error || "Dados não encontrados.");
              }
              setAcessos(data.acessos);
              setUseMp(data.useMp);
              setPixManual(data.pixManual);
              setWhatsappGestor(data.whatsappGestor);

              // Se houver exatamente 1 acesso encontrado, já inicia o checkout automaticamente!
              if (data.acessos && data.acessos.length === 1) {
                iniciarPagamentoDireto(data.acessos[0], data.useMp, data.pixManual);
              }
            })
            .catch((err) => {
              setErro(err.message || "Falha na consulta automática.");
            })
            .finally(() => {
              setLoading(false);
            });
        }
      }
    }
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("esa_dark", next ? "1" : "0");
  }

  // Buscar acessos
  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!telefone.trim()) {
      setErro("Por favor, preencha o número de telefone.");
      return;
    }

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
        body: JSON.stringify({ telefone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Dados não encontrados.");
      }

      setAcessos(data.acessos);
      setUseMp(data.useMp);
      setPixManual(data.pixManual);
      setWhatsappGestor(data.whatsappGestor);
    } catch (err: any) {
      setErro(err.message || "Houve uma falha na busca das informações.");
    } finally {
      setLoading(false);
    }
  }

  // Iniciar Checkout do Pix
  async function handleIniciarPagamento(acesso: any) {
    await iniciarPagamentoDireto(acesso, useMp, pixManual);
  }

  async function iniciarPagamentoDireto(acesso: any, mpActive: boolean, pixManualData: any) {
    setAcessoSelecionado(acesso);
    setPixCopiaCola("");
    setQrCodeBase64("");
    setPaymentId("");
    setPaymentStatus("pending");
    setErro(null);

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
        setErro(err.message || "Erro de conexão ao gerar o Pix.");
        setAcessoSelecionado(null);
      } finally {
        setCheckoutLoading(false);
      }
    } else {
      // Checkout Manual
      if (!pixManualData || !pixManualData.pixKey) {
        setErro("O gestor ainda não configurou as chaves de recebimento Pix.");
        setAcessoSelecionado(null);
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
        setAcessoSelecionado(null);
      }
    }
  }

  // Polling de pagamento para Mercado Pago
  useEffect(() => {
    if (!paymentId || paymentStatus !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(getApiUrl(`/api/mercado-pago/status?paymentId=${paymentId}`));
        const data = await res.json();
        if (data.status === "approved") {
          setPaymentStatus("approved");
          // Atualizar o vencimento local na lista
          setAcessos((prev) =>
            prev.map((a) => {
              if (a.id === acessoSelecionado.id) {
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
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentId, paymentStatus, acessoSelecionado]);

  function handleCopiarPix() {
    navigator.clipboard.writeText(pixCopiaCola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatarData(isoStr: string) {
    return new Date(isoStr).toLocaleDateString("pt-BR");
  }

  function getDiasRestantes(vencimentoStr: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(vencimentoStr);
    venc.setHours(0, 0, 0, 0);
    const diff = venc.getTime() - hoje.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // WhatsApp manual redirect link
  function getWhatsAppLink() {
    if (!whatsappGestor) return "#";
    const msg = `Olá! Realizei o pagamento da mensalidade de R$ ${acessoSelecionado.valor.toFixed(2)} referente ao acesso ${acessoSelecionado.cliente} (Usuário: ${acessoSelecionado.usuario}). Segue o comprovante:`;
    return `https://api.whatsapp.com/send?phone=${whatsappGestor.replace(/\D/g, "")}&text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Header do Portal */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">E</div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ESA GESTOR</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">Portal</span>
          </div>
          <button 
            onClick={toggleDark}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-500" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center items-center">
        
        {/* Bloco de Erro */}
        {erro && (
          <div className="w-full max-w-md mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Aviso: </span>
              {erro}
            </div>
          </div>
        )}

        {/* 1. Tela de Consulta / Busca */}
        {!acessos.length && (
          <Card className="w-full max-w-md rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight mb-2">Consulta de Mensalidade</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Entre com o número do seu celular com DDD para consultar e renovar seus acessos.</p>
              </div>

              <form onSubmit={handleBuscar} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="telefone">Telefone WhatsApp</Label>
                  <Input 
                    id="telefone"
                    type="tel"
                    placeholder="Ex: (11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="h-11 border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  {loading ? "Buscando..." : "Consultar Vencimento"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 2. Lista de Acessos Encontrados */}
        {acessos.length > 0 && !acessoSelecionado && (
          <div className="w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Button 
                variant="ghost" 
                onClick={() => setAcessos([])}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5 p-0"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar à busca
              </Button>
              <span className="text-xs text-slate-400 font-semibold">{acessos.length} acesso(s) encontrado(s)</span>
            </div>

            {acessos.map((acesso) => {
              const dias = getDiasRestantes(acesso.vencimento);
              const isVencido = dias <= 0;
              const isExpirando = dias > 0 && dias <= 3;
              
              let badgeColor = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/30";
              let badgeText = "Ativo";
              if (isVencido) {
                badgeColor = "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-200 dark:border-red-900/30";
                badgeText = `Vencido (há ${Math.abs(dias)} dias)`;
              } else if (isExpirando) {
                badgeColor = "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200 dark:border-amber-900/30";
                badgeText = `Expira em ${dias} dia(s)`;
              } else {
                badgeText = `Ativo (${dias} dias restantes)`;
              }

              return (
                <Card key={acesso.id} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md overflow-hidden hover:shadow-md transition">
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{acesso.cliente}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">({acesso.usuario})</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5" />
                          <span>App: <strong className="text-slate-700 dark:text-slate-300">{acesso.app}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Vence em: <strong className="text-slate-700 dark:text-slate-300">{formatarData(acesso.vencimento)}</strong></span>
                        </div>
                      </div>
                      {(acesso.enderecoMac || acesso.chaveKey) && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                          {acesso.enderecoMac && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-300">MAC:</span> {acesso.enderecoMac}
                            </div>
                          )}
                          {acesso.chaveKey && (
                            <div>
                              <span className="font-semibold text-slate-600 dark:text-slate-300">Key:</span> {acesso.chaveKey}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t border-slate-100 dark:border-slate-800 md:border-none">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Mensalidade</span>
                        <span className="text-lg font-black text-blue-600 dark:text-blue-400">R$ {acesso.valor.toFixed(2)}</span>
                      </div>
                      <Button 
                        onClick={() => handleIniciarPagamento(acesso)}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 text-sm transition"
                      >
                        Pagar Mensalidade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 3. checkout Pix */}
        {acessoSelecionado && (
          <Card className="w-full max-w-md rounded-2xl shadow-xl border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
            <CardContent className="pt-6">
              
              {/* Cabeçalho do Checkout */}
              <div className="flex items-center gap-2 mb-6">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setAcessoSelecionado(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-200">Pagamento Pix</h2>
                  <p className="text-xs text-slate-400">Acesso: {acessoSelecionado.cliente} (Valor: R$ {acessoSelecionado.valor.toFixed(2)})</p>
                </div>
              </div>

              {checkoutLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <span className="text-sm text-slate-500">Conectando ao Mercado Pago...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Status do Checkout Automático Mercado Pago */}
                  {useMp && paymentStatus === "approved" ? (
                    <div className="text-center py-6 space-y-4">
                      <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                        <Check className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-xl text-slate-800 dark:text-slate-100">Pagamento Aprovado!</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Seu acesso já foi renovado por mais 30 dias com sucesso no sistema.</p>
                      </div>
                      <Button 
                        onClick={() => {
                          setAcessoSelecionado(null);
                          setPaymentId("");
                        }}
                        className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold px-6"
                      >
                        Concluído
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Área do QR Code */}
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-3 shadow-inner">
                        {useMp && qrCodeBase64 ? (
                          <img 
                            src={`data:image/png;base64,${qrCodeBase64}`}
                            alt="QR Code do Pix"
                            className="h-44 w-44 object-contain rounded-lg bg-white p-1 border border-slate-200 dark:border-slate-800"
                          />
                        ) : !useMp && pixCopiaCola ? (
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCopiaCola)}`}
                            alt="QR Code do Pix"
                            className="h-44 w-44 object-contain rounded-lg bg-white p-1 border border-slate-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="h-44 w-44 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        )}
                        
                        <div className="text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Como pagar</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mt-0.5">
                            Abra o app do seu banco, escolha a opção "Pagar via Pix" e escaneie o código acima ou copie o código abaixo.
                          </p>
                        </div>
                      </div>

                      {/* Pix Copia e Cola */}
                      {pixCopiaCola && (
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400 font-bold uppercase tracking-wide">Código Pix Copia e Cola</Label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              readOnly
                              value={pixCopiaCola}
                              onClick={handleCopiarPix}
                              className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-500 select-all outline-none"
                            />
                            <Button 
                              onClick={handleCopiarPix}
                              className={`h-11 px-4 rounded-xl transition-all shrink-0 flex items-center gap-1.5 font-bold ${
                                copied 
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              {copied ? "Copiado" : "Copiar"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Mensagem de Auto-Confirmação ou Link do WhatsApp */}
                      {useMp ? (
                        <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs text-center font-medium">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                          <span>Identificando pagamento em tempo real... Não feche esta tela.</span>
                        </div>
                      ) : (
                        whatsappGestor && (
                          <div className="space-y-3 pt-2">
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                              ⚠️ <strong>Atenção:</strong> Como este pagamento é manual, você precisa nos enviar o comprovante para que possamos liberar seu acesso no sistema.
                            </div>
                            <a 
                              href={getWhatsAppLink()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
                            >
                              <ExternalLink className="h-4.5 w-4.5" /> Enviar Comprovante no WhatsApp
                            </a>
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} ESA GESTOR. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
