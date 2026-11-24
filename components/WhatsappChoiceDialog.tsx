"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { abrirWhatsappComEscolha, WhatsappTipo } from "@/lib/whatsapp";
import { MessageCircle, Briefcase } from "lucide-react";

export interface WhatsappEnvioPendente {
  telefone: string;
  mensagem: string;
  titulo?: string;
}

interface WhatsappChoiceDialogProps {
  alvo: WhatsappEnvioPendente | null;
  onFechar: () => void;
  onEnviado?: (tipo: WhatsappTipo) => void;
}

export function WhatsappChoiceDialog({ alvo, onFechar, onEnviado }: WhatsappChoiceDialogProps) {
  function handleEscolher(tipo: WhatsappTipo) {
    if (!alvo) return;
    abrirWhatsappComEscolha(alvo.telefone, alvo.mensagem, tipo);
    onEnviado?.(tipo);
    onFechar();
  }

  return (
    <Dialog open={!!alvo} onOpenChange={(open) => !open && onFechar()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            {alvo?.titulo ? `Enviar para ${alvo.titulo}` : "Enviar via WhatsApp"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
            Por qual WhatsApp deseja enviar?
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              onClick={() => handleEscolher("normal")}
              className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Normal
            </Button>
            <Button
              type="button"
              onClick={() => handleEscolher("business")}
              className="h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5"
            >
              <Briefcase className="h-4 w-4" />
              WhatsApp Business
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
