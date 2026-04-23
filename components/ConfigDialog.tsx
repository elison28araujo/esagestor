"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEFAULT_COBRANCA_MSG } from "@/lib/constants";

interface ConfigDialogProps {
  open: boolean;
  onFechar: () => void;
  mensagem: string;
  onSalvar: (msg: string) => void;
}

export function ConfigDialog({ open, onFechar, mensagem, onSalvar }: ConfigDialogProps) {
  const [msg, setMsg] = useState(mensagem);

  function handleSalvar() {
    onSalvar(msg.trim() || DEFAULT_COBRANCA_MSG);
    onFechar();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Label>Mensagem de cobrança (WhatsApp)</Label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{cliente}"}</code>,{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{app}"}</code> e{" "}
            <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{valor}"}</code> para substituição automática.
          </p>
          <textarea
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <Button variant="ghost" size="sm" onClick={() => setMsg(DEFAULT_COBRANCA_MSG)} className="self-start text-xs">
            Restaurar padrão
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={handleSalvar}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
