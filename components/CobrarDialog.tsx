"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "firebase/auth";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Acesso } from "@/lib/types";
import { REATIVACAO_TEMPLATES, PROMOCOES_TEMPLATES } from "@/lib/constants";
import { Loader2, MessageCircle, Send, Sparkles, Wand2 } from "lucide-react";

interface CobrarDialogProps {
  open: boolean;
  itens: Acesso[];
  user: User | null;
  mensagemCobranca: string;
  mensagemReativacao: string;
  zapiInstanceId: string;
  zapiToken: string;
  onFechar: () => void;
  onToast: (toast: { type: "success" | "error" | "info"; message: string }) => void;
}

type EstiloIA = "amigavel" | "praticidade" | "oferta" | "novidades" | "ultimo_aviso" | "variar";

const ESTILOS_IA: { id: EstiloIA; label: string }[] = [
  { id: "amigavel", label: "Check-in Amigável" },
  { id: "praticidade", label: "Pix & Cartão" },
  { id: "oferta", label: "Condição de Retorno" },
  { id: "novidades", label: "Novidades" },
  { id: "ultimo_aviso", label: "Limpeza de Cadastro" },
  { id: "variar", label: "Reescrever Texto" },
];

function calcularDiasVencido(vencimento: string): number {
  const diffMs = Date.now() - new Date(vencimento).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function formatarMensagem(template: string, item: Acesso, origin: string): string {
  const phone = item.telefone.replace(/\D/g, "");
  const linkPortal = `${origin}/consulta?telefone=${phone}`;
  let msg = template
    .replace(/\{cliente\}/g, item.cliente)
    .replace(/\{app\}/g, item.app)
    .replace(/\{valor\}/g, Number(item.valor || 0).toFixed(2));

  if (msg.includes("{link}")) {
    msg = msg.replace(/\{link\}/g, linkPortal);
  } else if (!msg.includes(linkPortal)) {
    msg = `${msg}\n\nEfetue o pagamento pelo link: ${linkPortal}`;
  }
  return msg;
}

export function CobrarDialog({
  open,
  itens,
  user,
  mensagemCobranca,
  mensagemReativacao,
  zapiInstanceId,
  zapiToken,
  onFechar,
  onToast,
}: CobrarDialogProps) {
  const isBulk = itens.length > 1;
  const primeiro = itens[0] || null;
  const temZapi = Boolean(zapiInstanceId && zapiToken);

  const [templateAtual, setTemplateAtual] = useState(mensagemCobranca);
  const [mensagemTexto, setMensagemTexto] = useState("");
  const [estiloIA, setEstiloIA] = useState<EstiloIA>("amigavel");
  const [variarComIAEmLote, setVariarComIAEmLote] = useState(true);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progressoLote, setProgressoLote] = useState<{ atual: number; total: number } | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!open || !primeiro) return;
    cancelRef.current = false;
    setProgressoLote(null);
    setEnviando(false);

    const diasVenc = calcularDiasVencido(primeiro.vencimento);
    const tplInicial = diasVenc >= 15 ? mensagemReativacao : mensagemCobranca;
    setTemplateAtual(tplInicial);
    setEstiloIA(diasVenc >= 15 ? "amigavel" : "variar");

    if (itens.length === 1) {
      setMensagemTexto(formatarMensagem(tplInicial, primeiro, window.location.origin));
    } else {
      setMensagemTexto(tplInicial);
    }
  }, [open, itens, primeiro, mensagemCobranca, mensagemReativacao]);

  if (!primeiro) return null;

  const diasVencidoPrimeiro = calcularDiasVencido(primeiro.vencimento);

  function aplicarTemplate(tpl: string) {
    setTemplateAtual(tpl);
    if (isBulk) {
      setMensagemTexto(tpl);
    } else if (primeiro) {
      setMensagemTexto(formatarMensagem(tpl, primeiro, window.location.origin));
    }
  }

  async function solicitarMensagemIA(item: Acesso, estilo: EstiloIA, base: string): Promise<string> {
    if (!user) throw new Error("Usuário não autenticado.");
    const token = await user.getIdToken();
    const phone = item.telefone.replace(/\D/g, "");
    const linkPortal = `${window.location.origin}/consulta?telefone=${phone}`;

    const res = await fetch("/api/ia-mensagem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cliente: item.cliente,
        app: item.app,
        valor: Number(item.valor || 0),
        diasVencido: calcularDiasVencido(item.vencimento),
        linkPortal,
        mensagemBase: base,
        estilo,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Erro ao gerar mensagem com Gemini.");
    }
    return String(data.mensagem || "").trim();
  }

  async function handleGerarComIA() {
    if (!primeiro) return;
    setGerandoIA(true);
    try {
      const gerada = await solicitarMensagemIA(primeiro, estiloIA, mensagemTexto || templateAtual);
      if (gerada) {
        setMensagemTexto(gerada);
        onToast({ type: "success", message: "Mensagem gerada com IA (Gemini)!" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao consultar Gemini.";
      onToast({ type: "error", message: msg });
    } finally {
      setGerandoIA(false);
    }
  }

  async function enviarViaZapi(phone: string, message: string): Promise<boolean> {
    const phoneFormatted = phone.startsWith("55") ? phone : `55${phone}`;
    const res = await fetch(
      `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneFormatted, message }),
      }
    );
    return res.ok;
  }

  async function handleEnviar() {
    if (!isBulk && primeiro) {
      const phone = primeiro.telefone.replace(/\D/g, "");
      if (!phone) {
        onToast({ type: "error", message: "Cliente sem telefone cadastrado." });
        return;
      }

      if (temZapi) {
        setEnviando(true);
        try {
          const ok = await enviarViaZapi(phone, mensagemTexto);
          if (ok) {
            onToast({ type: "success", message: `Mensagem enviada para ${primeiro.cliente} via WhatsApp!` });
            onFechar();
            return;
          }
          throw new Error("Erro na Z-API");
        } catch {
          onToast({ type: "info", message: "Falha na Z-API. Abrindo WhatsApp Web..." });
          window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(mensagemTexto)}`, "_blank");
          onFechar();
        } finally {
          setEnviando(false);
        }
      } else {
        window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(mensagemTexto)}`, "_blank");
        onFechar();
      }
      return;
    }

    // Envio em lote
    if (!temZapi) {
      onToast({
        type: "error",
        message: "Para disparar em lote automaticamente, configure a Z-API em Configurações → WhatsApp & Z-API.",
      });
      return;
    }

    setEnviando(true);
    cancelRef.current = false;
    let sucessos = 0;
    let falhas = 0;

    for (let i = 0; i < itens.length; i++) {
      if (cancelRef.current) break;
      const item = itens[i];
      setProgressoLote({ atual: i + 1, total: itens.length });

      const phone = item.telefone.replace(/\D/g, "");
      if (!phone) {
        falhas++;
        continue;
      }

      let textoFinal = formatarMensagem(mensagemTexto, item, window.location.origin);
      if (variarComIAEmLote) {
        try {
          const variada = await solicitarMensagemIA(item, estiloIA, textoFinal);
          if (variada) textoFinal = variada;
        } catch {
          // Fallback para o template formatado se a IA falhar em um item
        }
      }

      try {
        const ok = await enviarViaZapi(phone, textoFinal);
        if (ok) sucessos++;
        else falhas++;
      } catch {
        falhas++;
      }

      if (i < itens.length - 1 && !cancelRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }

    setEnviando(false);
    setProgressoLote(null);
    onToast({
      type: falhas === 0 ? "success" : "info",
      message: cancelRef.current
        ? `Envio interrompido: ${sucessos} enviada(s), ${falhas} falha(s).`
        : `Disparo concluído: ${sucessos} enviada(s)${falhas > 0 ? `, ${falhas} falha(s)` : ""}.`,
    });
    onFechar();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !enviando) onFechar();
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            {isBulk ? `Cobrar / Reativar ${itens.length} Clientes` : `Mensagem para ${primeiro.cliente}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isBulk && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/60">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{primeiro.app}</span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-emerald-600">R$ {Number(primeiro.valor || 0).toFixed(2)}</span>
              <span className="text-slate-400">•</span>
              <span
                className={`font-semibold ${
                  diasVencidoPrimeiro > 0 ? "text-rose-600 dark:text-rose-400" : "text-amber-600"
                }`}
              >
                {diasVencidoPrimeiro > 0
                  ? `Vencido há ${diasVencidoPrimeiro} dia(s)`
                  : diasVencidoPrimeiro === 0
                    ? "Vence hoje"
                    : `Vence em ${Math.abs(diasVencidoPrimeiro)} dia(s)`}
              </span>
            </div>
          )}

          {/* Modelos Rápidos */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Escolha um modelo pronto
            </Label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => aplicarTemplate(mensagemCobranca)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  templateAtual === mensagemCobranca
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Cobrança Padrão
              </button>
              <button
                type="button"
                onClick={() => aplicarTemplate(mensagemReativacao)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  templateAtual === mensagemReativacao
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                Reativação Salva
              </button>
              {REATIVACAO_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setEstiloIA(tpl.estilo);
                    aplicarTemplate(tpl.texto);
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    templateAtual === tpl.texto
                      ? "border-purple-600 bg-purple-600 text-white"
                      : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800/60 dark:bg-purple-900/20 dark:text-purple-300"
                  }`}
                >
                  {tpl.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* Seção Black Friday / Promoções */}
          <div className="space-y-1.5 rounded-xl border border-amber-500/30 bg-slate-950/90 p-3 text-white">
            <Label className="text-xs font-bold uppercase tracking-wider text-amber-400">
              🔥🖤 Promoções — Black Friday
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {PROMOCOES_TEMPLATES.map((promo) => (
                <button
                  key={promo.id}
                  type="button"
                  onClick={() => {
                    setEstiloIA("variar");
                    aplicarTemplate(promo.texto);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                    templateAtual === promo.texto
                      ? "border-amber-400 bg-amber-500 text-slate-950 shadow-sm"
                      : "border-amber-500/40 bg-slate-900 text-amber-300 hover:bg-slate-800"
                  }`}
                >
                  {promo.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* Gerador Gemini IA */}
          <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/30 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="h-4 w-4" />
                Personalizar com IA (Gemini)
              </div>
              {!isBulk && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGerarComIA}
                  disabled={gerandoIA || enviando}
                  className="h-8 gap-1.5 rounded-lg bg-indigo-600 text-xs text-white hover:bg-indigo-700"
                >
                  {gerandoIA ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3.5 w-3.5" />
                      Gerar / Variar Texto
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ESTILOS_IA.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEstiloIA(e.id)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                    estiloIA === e.id
                      ? "bg-indigo-600 text-white"
                      : "bg-white/80 text-indigo-700 hover:bg-white dark:bg-slate-800 dark:text-indigo-300"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>

            {isBulk && (
              <label className="flex items-center gap-2 text-xs text-indigo-800 dark:text-indigo-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={variarComIAEmLote}
                  onChange={(e) => setVariarComIAEmLote(e.target.checked)}
                  className="h-4 w-4 rounded border-indigo-300 text-indigo-600"
                />
                Variar o texto automaticamente com Gemini para cada cliente (anti-bloqueio)
              </label>
            )}
          </div>

          {/* Editor de Mensagem */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isBulk
                ? "Modelo base do disparo (as variáveis {cliente}, {app}, {valor}, {link} serão preenchidas por cliente):"
                : "Prévia da mensagem (edite livremente antes de enviar):"}
            </Label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 min-h-[130px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={mensagemTexto}
              onChange={(e) => setMensagemTexto(e.target.value)}
              disabled={enviando}
            />
          </div>

          {progressoLote && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando {progressoLote.atual} de {progressoLote.total} (intervalo seguro de 2,5s)...
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  cancelRef.current = true;
                }}
                className="h-7 text-rose-600 hover:text-rose-700"
              >
                Parar
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onFechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            onClick={handleEnviar}
            disabled={enviando || gerandoIA || !mensagemTexto.trim()}
            className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {isBulk
                  ? `Disparar para ${itens.length} via Z-API`
                  : temZapi
                    ? "Enviar via Z-API"
                    : "Abrir no WhatsApp"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
