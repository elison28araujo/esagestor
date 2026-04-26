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
  onRenovar: (id: string) => Promise<void>;
}

export function ClienteCard({ item, mensagemCobranca, onEditar, onRemover, onRenovar }: ClienteCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [renovando, setRenovando] = useState(false);

  const dias = Math.ceil((new Date(item.vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const status =
    dias <= 0
      ? { 
          texto: "Vencido", 
          style: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
          cardStyle: "border-red-200 dark:border-red-900/50 shadow-lg shadow-red-500/10"
        }
      : dias <= 3
        ? { 
            texto: "Vencendo", 
            style: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
            cardStyle: "border-amber-200 dark:border-amber-900/50 shadow-lg shadow-amber-500/10"
          }
        : { 
            texto: "Ativo", 
            style: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
            cardStyle: "border-slate-200 dark:border-slate-700"
          };

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

  async function handleRenovar() {
    setRenovando(true);
    await onRenovar(item.id);
    setRenovando(false);
  }

  return (
    <>
      <div className={`rounded-2xl border p-4 bg-white dark:bg-slate-800 transition-all duration-300 ${status.cardStyle}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.cliente}</div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              {item.app} • R$ {Number(item.valor).toFixed(2)}
            </div>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatPhone(item.telefone)}</div>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${status.style}`}>
            {status.texto}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="h-4 w-4 text-blue-500" />
          {dias <= 0 ? (
            <span className="text-red-500 font-bold">Vencido</span>
          ) : (
            <span>Vence em {dias} dia{dias !== 1 ? "s" : ""}</span>
          )}
          <span className="text-xs text-slate-400 font-normal ml-auto">
            {new Date(item.vencimento).toLocaleDateString("pt-BR")}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {dias <= 3 && (
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold" 
              onClick={handleRenovar}
              disabled={renovando}
            >
              {renovando ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Calendar className="mr-1 h-3 w-3" />}
              Renovar Agora
            </Button>
          )}
          <Button size="sm" variant="outline" className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950" onClick={cobrar}>
            <MessageCircle className="mr-1 h-3 w-3" /> Cobrar
          </Button>
          <Button size="sm" variant="ghost" className="text-slate-500 hover:text-blue-600" onClick={() => onEditar(item)}>
            <Pencil className="mr-1 h-3 w-3" /> Editar
          </Button>
          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-red-600 ml-auto" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-3 w-3" />
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
