"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Acesso } from "@/lib/types";
import { formatPhone } from "@/lib/utils";
import { Calendar, MessageCircle, Pencil, Trash2 } from "lucide-react";

interface ClienteCardProps {
  item: Acesso;
  mensagemCobranca: string;
  onEditar: (acesso: Acesso) => void;
  onRemover: (id: string) => Promise<void>;
}

export function ClienteCard({ item, mensagemCobranca, onEditar, onRemover }: ClienteCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  const dias = Math.ceil((new Date(item.vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const status =
    dias <= 0
      ? { texto: "Vencido", style: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" }
      : dias <= 3
        ? { texto: "Vence logo", style: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300" }
        : { texto: "Ativo", style: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300" };

  function cobrar() {
    const phone = item.telefone.replace(/\D/g, "");
    const mensagem = mensagemCobranca
      .replace("{cliente}", item.cliente)
      .replace("{app}", item.app)
      .replace("{valor}", Number(item.valor).toFixed(2));
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  async function handleRemover() {
    setRemovendo(true);
    await onRemover(item.id);
    setRemovendo(false);
    setConfirmOpen(false);
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 transition-colors">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.cliente}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{item.app} • R$ {Number(item.valor).toFixed(2)}</div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatPhone(item.telefone)}</div>
          </div>
          <div className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${status.style}`}>
            {status.texto}
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar className="h-4 w-4" />
          {dias <= 0 ? "Renovar agora" : `${dias} dia${dias !== 1 ? "s" : ""} restantes`}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={cobrar}>
            <MessageCircle className="mr-1 h-3 w-3" /> Cobrar
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEditar(item)}>
            <Pencil className="mr-1 h-3 w-3" /> Editar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-1 h-3 w-3" /> Excluir
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir "${item.cliente}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleRemover}
        onCancel={() => setConfirmOpen(false)}
        loading={removendo}
      />
    </>
  );
}
