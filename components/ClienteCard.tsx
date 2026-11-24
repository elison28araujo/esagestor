"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { WhatsappChoiceDialog, WhatsappEnvioPendente } from "@/components/WhatsappChoiceDialog";
import { Acesso } from "@/lib/types";
import { formatPhone } from "@/lib/utils";
import { Calendar, MessageCircle, Pencil, Trash2, Smartphone, Cpu, Key, UserPlus, Sparkles, Handshake, AlertTriangle, Users } from "lucide-react";

interface ClienteCardProps {
  item: Acesso;
  mensagemCobranca: string;
  mensagemRenovacao: string;
  onEditar: (acesso: Acesso) => void;
  onRemover: (id: string) => Promise<void>;
  onRenovar: (id: string) => void;
  onRenovarRapido?: (id: string) => void;
  onCobrar?: (item: Acesso) => void;
  onAdicionarUsuario?: (item: Acesso) => void;
  onEnviarVencimento?: (item: Acesso) => void;
  onEnviarVencimentoTodos?: (item: Acesso) => void;
  qtdUsuariosCliente?: number;
  onAplicarUpgrade?: (item: Acesso) => void;
  onAcordo?: (item: Acesso) => void;
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
  onAdicionarUsuario,
  onEnviarVencimento,
  onEnviarVencimentoTodos,
  qtdUsuariosCliente = 1,
  onAplicarUpgrade,
  onAcordo,
  selecionado,
  onToggleSelecao,
}: ClienteCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [whatsappPendente, setWhatsappPendente] = useState<WhatsappEnvioPendente | null>(null);

  const dias = Math.ceil((new Date(item.vencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isAcordo = Boolean(item.acordoAtivo && Number(item.acordoValor || 0) > 0);

  const statusConfig = isAcordo
    ? {
        texto: `Acordo • R$ ${Number(item.acordoValor).toFixed(2)}`,
        badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
        dot: "bg-amber-500",
        cardBorder: "border-amber-400 dark:border-amber-500/70 bg-amber-500/[0.04]",
      }
    : dias <= 0
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
      const linkPortal = `${window.location.origin}/consulta?telefone=${phone}`;
      let mensagem = mensagemCobranca
        .replace("{cliente}", item.cliente)
        .replace("{app}", item.app)
        .replace("{valor}", Number(item.valor).toFixed(2));

      if (mensagem.includes("{link}")) {
        mensagem = mensagem.replace("{link}", linkPortal);
      } else {
        mensagem = `${mensagem}\n\nEfetue o pagamento pelo link: ${linkPortal}`;
      }

      setWhatsappPendente({
        telefone: phone,
        mensagem,
        titulo: item.cliente,
      });
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
        className={`group relative flex flex-col justify-between rounded-xl border bg-white p-4 transition-colors shadow-sm dark:bg-[#111622] ${statusConfig.cardBorder} ${selecionado ? "ring-2 ring-blue-600/60 dark:ring-blue-500/60" : ""
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
                  {item.dispositivos && item.dispositivos > 1 && (
                    <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.dispositivos} disp.
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

            {isAcordo && (
              <div className="mt-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                <div className="flex items-center gap-1 font-semibold">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  <span>
                    Pendente: R$ {Number(item.acordoValor).toFixed(2)}
                    {item.acordoData ? ` • Combinado p/ ${new Date(item.acordoData).toLocaleDateString("pt-BR")}` : ""}
                  </span>
                </div>
                {item.acordoObs && (
                  <p className="text-[10px] opacity-90 truncate" title={item.acordoObs}>
                    {item.acordoObs}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Barra de Ações Rápidas */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
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

          {onAdicionarUsuario && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px] font-semibold border-blue-500/30 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
              onClick={() => onAdicionarUsuario(item)}
              title="Adicionar novo usuário/login para este cliente"
            >
              <UserPlus className="mr-1 h-3 w-3" />
              + Usuário
            </Button>
          )}

          {onAplicarUpgrade && (Number(item.dispositivos) || 1) < 3 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px] font-semibold border-violet-500/30 text-violet-600 hover:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20"
              onClick={() => onAplicarUpgrade(item)}
              title="Ativar +1 tela (+R$ 10 na próxima mensalidade)"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              +1 Tela
            </Button>
          )}

          {onEnviarVencimento && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px] font-semibold border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20"
              onClick={() => onEnviarVencimento(item)}
              title="Enviar data de vencimento via WhatsApp"
            >
              <Calendar className="mr-1 h-3 w-3" />
              Vencimento
            </Button>
          )}

          {onEnviarVencimentoTodos && qtdUsuariosCliente > 1 && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-[11px] font-semibold border-sky-500/30 bg-sky-500/5 text-sky-700 hover:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30"
              onClick={() => onEnviarVencimentoTodos(item)}
              title={`Enviar vencimento com todos os ${qtdUsuariosCliente} usuários deste cliente`}
            >
              <Users className="mr-1 h-3 w-3" />
              Venc. Todos ({qtdUsuariosCliente})
            </Button>
          )}

          {onAcordo && (
            <Button
              size="sm"
              variant="outline"
              className={`h-7 px-2 text-[11px] font-semibold ${
                isAcordo
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300"
                  : "border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
              }`}
              onClick={() => onAcordo(item)}
              title="Registrar ou gerenciar acordo de pagamento pendente"
            >
              <Handshake className="mr-1 h-3 w-3" />
              Acordo
            </Button>
          )}

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

      <WhatsappChoiceDialog
        alvo={whatsappPendente}
        onFechar={() => setWhatsappPendente(null)}
      />
    </>
  );
}
