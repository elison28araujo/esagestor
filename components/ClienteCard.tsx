"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Acesso } from "@/lib/types";
import { formatPhone } from "@/lib/utils";
import { Calendar, MessageCircle, Pencil, Trash2, Loader2 } from "lucide-react";

interface ClienteCardProps {
  item: Acesso;
  mensagemCobranca: string;
  mensagemRenovacao: string;
  onEditar: (acesso: Acesso) => void;
  onRemover: (id: string) => Promise<void>;
  onRenovar: (id: string) => void;
  selecionado: boolean;
  onToggleSelecao: (id: string) => void;
}

export function ClienteCard({
  item,
  mensagemCobranca,
  mensagemRenovacao,
  onEditar,
  onRemover,
  onRenovar,
  selecionado,
  onToggleSelecao,
}: ClienteCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removendo, setRemovendo] = useState(false);

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
    const linkPortal = `${window.location.origin}/consulta`;
    let mensagem = mensagemCobranca
      .replace("{cliente}", item.cliente)
      .replace("{app}", item.app)
      .replace("{valor}", Number(item.valor).toFixed(2));
      
    if (mensagem.includes("{link}")) {
      mensagem = mensagem.replace("{link}", linkPortal);
    } else {
      mensagem = `${mensagem}\n\nEfetue o pagamento pelo link: ${linkPortal}`;
    }
    
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  async function handleRemover() {
    setRemovendo(true);
    await onRemover(item.id);
    setRemovendo(false);
  }

  return (
    <>
      <div className={`group relative overflow-hidden rounded-3xl border bg-white/70 backdrop-blur-md dark:bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${status.cardStyle}`}>
        {/* Glow de fundo */}
        <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.08] blur-3xl transition-all duration-500 group-hover:opacity-20 ${status.style.split(' ')[0]}`} />

        <div className="relative z-10 mb-5 flex items-start justify-between gap-3">
          <div className="flex gap-2.5">
            <input
              type="checkbox"
              checked={selecionado}
              onChange={() => onToggleSelecao(item.id)}
              className="mt-1.5 h-4.5 w-4.5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <div>
              <div className="text-xl font-heading font-bold tracking-tight text-slate-900 dark:text-slate-100">{item.cliente}</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{item.app}</span>
                R$ {Number(item.valor).toFixed(2)}
              </div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{formatPhone(item.telefone)}</div>
              {item.enderecoMac && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">MAC:</span> {item.enderecoMac}
                </div>
              )}
              {item.chaveKey && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Key:</span> {item.chaveKey}
                </div>
              )}
            </div>
          </div>
          <div className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${status.style}`}>
            {status.texto}
          </div>
        </div>

        <div className="relative z-10 mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="h-4 w-4 text-blue-500" />
          {dias <= 0 ? (
            <span className="text-red-500 font-bold">Vencido</span>
          ) : (
            <span>Vence em {dias} dia{dias !== 1 ? "s" : ""}</span>
          )}
          <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-slate-400/70">
            {new Date(item.vencimento).toLocaleDateString("pt-BR")}
          </span>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2">
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold" 
            onClick={() => onRenovar(item.id)}
          >
            <Calendar className="mr-1 h-3 w-3" />
            Renovar Agora
          </Button>
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
