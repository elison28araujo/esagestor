"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Acesso } from "@/lib/types";
import { formatPhone } from "@/lib/utils";
import { Calendar, MessageCircle, Pencil, Trash2, Smartphone, Cpu, Key } from "lucide-react";

interface ClienteCardProps {
  item: Acesso;
  mensagemCobranca: string;
  mensagemRenovacao: string;
  onEditar: (acesso: Acesso) => void;
  onRemover: (id: string) => Promise<void>;
  onRenovar: (id: string) => void;
  onRenovarRapido?: (id: string) => void;
  onCobrar?: (item: Acesso) => void;
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
  onRenovarRapido,
  onCobrar,
  selecionado,
  onToggleSelecao,
}: ClienteCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  const dias = Math.ceil((new Date(item.vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const statusConfig =
    dias <= 0
      ? {
          texto: "Vencido",
          badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          dot: "bg-rose-500",
          cardBorder: "border-rose-300/80 dark:border-rose-900/60 bg-rose-500/[0.02]",
        }
      : dias <= 3
      ? {
          texto: `Vence em ${dias}d`,
          badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          dot: "bg-amber-500",
          cardBorder: "border-amber-300/80 dark:border-amber-900/60 bg-amber-500/[0.02]",
        }
      : {
          texto: "Ativo",
          badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          dot: "bg-emerald-500",
          cardBorder: "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700",
        };

  function cobrar() {
    if (onCobrar) {
      onCobrar(item);
    } else {
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
  }

  async function handleRemover() {
    setRemovendo(true);
    await onRemover(item.id);
    setRemovendo(false);
  }

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between rounded-xl border bg-white p-4 transition-colors shadow-sm dark:bg-[#111622] ${statusConfig.cardBorder} ${
          selecionado ? "ring-2 ring-blue-600/60 dark:ring-blue-500/60" : ""
        }`}
      >
        <div>
          {/* Header do Card */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={selecionado}
                onChange={() => onToggleSelecao(item.id)}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="truncate font-heading text-base font-bold text-slate-900 dark:text-slate-100">
                    {item.cliente}
                  </h4>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {item.app}
                  </span>
                  {item.servidor && (
                    <span className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">
                      {item.servidor}
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums ml-0.5">
                    R$ {Number(item.valor).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Badge de Status */}
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.texto}
            </span>
          </div>

          {/* Dados de Contato e Vencimento */}
          <div className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-slate-800/80">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                {formatPhone(item.telefone)}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-mono tabular-nums">
                  {new Date(item.vencimento).toLocaleDateString("pt-BR")}
                </span>
              </span>
            </div>

            {(item.enderecoMac || item.chaveKey) && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {item.enderecoMac && (
                  <span className="truncate">
                    <span className="text-slate-400 font-sans">MAC:</span> {item.enderecoMac}
                  </span>
                )}
                {item.chaveKey && (
                  <span className="truncate">
                    <span className="text-slate-400 font-sans">Key:</span> {item.chaveKey}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Barra de Ações Rápidas */}
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
          {onRenovarRapido && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px] font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
              onClick={() => onRenovarRapido(item.id)}
              title="Renovar +30 dias imediatamente"
            >
              ⚡ +30d
            </Button>
          )}

          <Button
            size="sm"
            className="h-7 px-2.5 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
            onClick={() => onRenovar(item.id)}
          >
            Renovar
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px] font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={cobrar}
          >
            <MessageCircle className="mr-1 h-3 w-3 text-emerald-500" />
            Cobrar
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => onEditar(item)}
            title="Editar cliente"
          >
            <Pencil className="h-3 w-3" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-auto"
            onClick={() => setConfirmOpen(true)}
            title="Excluir cliente"
          >
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
