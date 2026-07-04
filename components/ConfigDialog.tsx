"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEFAULT_COBRANCA_MSG, DEFAULT_RENOVACAO_MSG } from "@/lib/constants";

interface ConfigDialogProps {
  open: boolean;
  onFechar: () => void;
  mensagem: string;
  mensagemRenovacao: string;
  onSalvar: (msgCobranca: string, msgRenovacao: string) => void;
}

export function ConfigDialog({ open, onFechar, mensagem, mensagemRenovacao, onSalvar }: ConfigDialogProps) {
  const [msgCobranca, setMsgCobranca] = useState(mensagem);
  const [msgRenovacaoState, setMsgRenovacaoState] = useState(mensagemRenovacao);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem("esa_email_alerts");
      setEmailAlerts(saved !== "0");
      setMsgCobranca(mensagem);
      setMsgRenovacaoState(mensagemRenovacao);
    }
  }, [open, mensagem, mensagemRenovacao]);

  function handleSalvar() {
    onSalvar(msgCobranca.trim() || DEFAULT_COBRANCA_MSG, msgRenovacaoState.trim() || DEFAULT_RENOVACAO_MSG);
    localStorage.setItem("esa_email_alerts", emailAlerts ? "1" : "0");
    onFechar();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-3 mb-4">
          <Label className="text-blue-600 font-bold">Mensagem de cobrança (WhatsApp)</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{cliente}"}</code>,{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{app}"}</code> e{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{valor}"}</code> para substituição.
          </p>
          <textarea
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] transition-all"
            value={msgCobranca}
            onChange={(e) => setMsgCobranca(e.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={() => setMsgCobranca(DEFAULT_COBRANCA_MSG)} className="self-start text-xs text-slate-500">
            Restaurar padrão
          </Button>
        </div>

        <div className="grid gap-3">
          <Label className="text-emerald-600 font-bold">Mensagem de renovação (WhatsApp)</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{cliente}"}</code>,{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{app}"}</code>,{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{usuario}"}</code> e{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{vencimento}"}</code> para substituição.
          </p>
          <textarea
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] transition-all"
            value={msgRenovacaoState}
            onChange={(e) => setMsgRenovacaoState(e.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={() => setMsgRenovacaoState(DEFAULT_RENOVACAO_MSG)} className="self-start text-xs text-slate-500">
            Restaurar padrão
          </Button>
        </div>

        <div className="flex items-start gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <input
            id="email-alerts-toggle"
            type="checkbox"
            checked={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.checked)}
            className="mt-1 h-4.5 w-4.5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
          />
          <div>
            <Label htmlFor="email-alerts-toggle" className="cursor-pointer font-bold text-slate-800 dark:text-slate-200">
              Receber alertas por e-mail
            </Label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enviar resumo diário de vencimentos dos clientes direto para seu e-mail cadastrado.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" className="rounded-xl" onClick={onFechar}>Cancelar</Button>
          <Button className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={handleSalvar}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
