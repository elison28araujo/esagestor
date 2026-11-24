"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Acesso } from "@/lib/types";
import { formatPhone } from "@/lib/utils";
import { abrirWhatsappComEscolha } from "@/lib/whatsapp";
import { Calendar, Copy, Check, MessageCircle, Briefcase, Users, AlertTriangle } from "lucide-react";

export { abrirWhatsappComEscolha };

interface EnviarVencimentoDialogProps {
  acessos: Acesso[];
  onFechar: () => void;
}

function formatarDataPtBr(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function calcularDetalheDias(isoDate: string): { dias: number; texto: string } {
  const dias = Math.ceil((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (dias <= 0) {
    const abs = Math.abs(dias);
    return { dias, texto: `venceu há ${abs} dia${abs === 1 ? "" : "s"}` };
  }
  if (dias === 1) {
    return { dias, texto: "vence amanhã" };
  }
  return { dias, texto: `faltam ${dias} dias` };
}

export function montarMensagemVencimento(acesso: Acesso, origin = ""): string {
  const vencimentoFormatado = formatarDataPtBr(acesso.vencimento);
  const { dias } = calcularDetalheDias(acesso.vencimento);
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

export function montarMensagemVencimentoMultiplos(acessos: Acesso[], origin = ""): string {
  if (acessos.length === 0) return "";
  if (acessos.length === 1) return montarMensagemVencimento(acessos[0], origin);

  const primeiro = acessos[0];
  const phone = primeiro.telefone.replace(/\D/g, "");
  const baseUrl = origin || "https://esaplay.site";
  const linkPortal = `${baseUrl}/consulta?telefone=${phone}`;
  const usuariosLista = acessos.map((a) => a.usuario).filter(Boolean).join(", ");
  const datasUnicas = Array.from(new Set(acessos.map((a) => formatarDataPtBr(a.vencimento))));

  if (datasUnicas.length === 1) {
    const dataUnica = datasUnicas[0];
    const { texto } = calcularDetalheDias(primeiro.vencimento);
    return (
      `Olá ${primeiro.cliente}! 👋\n\n` +
      `Sua assinatura foi renovada! ✅\n` +
      `👥 Seus usuários são: *${usuariosLista}*\n` +
      `📅 Sua assinatura vence em *${dataUnica}* (${texto}).\n\n` +
      `Caso queira consultar seus acessos, acesse:\n${linkPortal}`
    );
  }

  const linhasUsuarios = acessos
    .map((a) => `• *${a.usuario}* — vence em *${formatarDataPtBr(a.vencimento)}*`)
    .join("\n");

  return (
    `Olá ${primeiro.cliente}! 👋\n\n` +
    `Segue o resumo dos seus usuários e vencimentos:\n` +
    `${linhasUsuarios}\n\n` +
    `Caso queira consultar ou renovar seus acessos, acesse:\n${linkPortal}`
  );
}

export function EnviarVencimentoDialog({ acessos, onFechar }: EnviarVencimentoDialogProps) {
  const [mensagem, setMensagem] = useState("");
  const [copiado, setCopiado] = useState(false);

  const primeiro = acessos[0] ?? null;
  const telefonesDistintos = new Set(
    acessos.map((a) => (a.telefone || "").replace(/\D/g, "").replace(/^55(?=\d{10,})/, "")).filter(Boolean)
  );
  const temTelefonesDiferentes = telefonesDistintos.size > 1;

  useEffect(() => {
    if (acessos.length > 0) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setMensagem(montarMensagemVencimentoMultiplos(acessos, origin));
      setCopiado(false);
    }
  }, [acessos]);

  function handleEnviar(tipo: "normal" | "business") {
    if (!primeiro) return;
    abrirWhatsappComEscolha(primeiro.telefone, mensagem, tipo);
    onFechar();
  }

  function handleCopiar() {
    navigator.clipboard.writeText(mensagem);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Dialog open={acessos.length > 0} onOpenChange={(open) => !open && onFechar()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {acessos.length > 1 ? (
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
            {acessos.length > 1
              ? `Enviar Vencimento (${acessos.length} usuários) — ${primeiro?.cliente}`
              : `Enviar Vencimento — ${primeiro?.cliente}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {temTelefonesDiferentes && primeiro && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Os itens selecionados possuem telefones diferentes. A mensagem será enviada para{" "}
                <strong>{primeiro.cliente}</strong> ({formatPhone(primeiro.telefone)}).
              </span>
            </div>
          )}
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
