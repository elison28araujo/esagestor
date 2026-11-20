"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Acesso } from "@/lib/types";
import { Calendar, Copy, Check, MessageCircle, Briefcase } from "lucide-react";

interface EnviarVencimentoDialogProps {
  acesso: Acesso | null;
  onFechar: () => void;
}

export function montarMensagemVencimento(acesso: Acesso, origin = ""): string {
  const vencimentoDate = new Date(acesso.vencimento);
  const vencimentoFormatado = vencimentoDate.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  const dias = Math.ceil((vencimentoDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const phone = acesso.telefone.replace(/\D/g, "");
  const baseUrl = origin || "https://esaplay.site";
  const linkPortal = `${baseUrl}/consulta?telefone=${phone}`;
  const dispositivosTxt =
    acesso.dispositivos && acesso.dispositivos > 1
      ? ` • ${acesso.dispositivos} Dispositivos`
      : "";

  const statusLinha =
    dias <= 0
      ? `Sua assinatura venceu em *${vencimentoFormatado}* (há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}).`
      : dias === 1
        ? `Sua assinatura vence *amanhã (${vencimentoFormatado})*.`
        : `Sua assinatura vence em *${vencimentoFormatado}* (faltam ${dias} dias).`;

  return (
    `Olá ${acesso.cliente}! 👋\n\n` +
    `${statusLinha}\n` +
    `📺 Plano: ${acesso.app}${dispositivosTxt} • Usuário: *${acesso.usuario}*\n\n` +
    `Caso queira renovar ou consultar seus acessos, acesse:\n${linkPortal}`
  );
}

export function abrirWhatsappComEscolha(
  telefone: string,
  mensagem: string,
  tipo: "normal" | "business"
) {
  const digits = telefone.replace(/\D/g, "");
  const phoneWithCountry = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  const encoded = encodeURIComponent(mensagem);
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    const pkg = tipo === "business" ? "com.whatsapp.w4b" : "com.whatsapp";
    window.location.href = `intent://send?phone=${phoneWithCountry}&text=${encoded}#Intent;scheme=whatsapp;package=${pkg};end`;
    return;
  }

  window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, "_blank");
}

export function EnviarVencimentoDialog({ acesso, onFechar }: EnviarVencimentoDialogProps) {
  const [mensagem, setMensagem] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (acesso) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setMensagem(montarMensagemVencimento(acesso, origin));
      setCopiado(false);
    }
  }, [acesso]);

  function handleEnviar(tipo: "normal" | "business") {
    if (!acesso) return;
    abrirWhatsappComEscolha(acesso.telefone, mensagem, tipo);
    onFechar();
  }

  function handleCopiar() {
    navigator.clipboard.writeText(mensagem);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Dialog open={!!acesso} onOpenChange={(open) => !open && onFechar()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Enviar Vencimento — {acesso?.cliente}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Prévia da mensagem (editável):
              </span>
              <button
                type="button"
                onClick={handleCopiar}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                {copiado ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? "Copiado!" : "Copiar texto"}
              </button>
            </div>
            <textarea
              rows={6}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
              Por qual WhatsApp deseja enviar?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                onClick={() => handleEnviar("normal")}
                className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp Normal
              </Button>
              <Button
                type="button"
                onClick={() => handleEnviar("business")}
                className="h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5"
              >
                <Briefcase className="h-4 w-4" />
                WhatsApp Business
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
