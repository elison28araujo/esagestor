"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Acesso, UsuarioAgrupado } from "@/lib/types";
import { extrairLoginUsuario, formatarMensagemUpgrade, formatPhone } from "@/lib/utils";
import { WhatsappChoiceDialog, WhatsappEnvioPendente } from "@/components/WhatsappChoiceDialog";
import { CheckCircle2, Loader2, MessageCircle, Send, Sparkles, Tv } from "lucide-react";

const MENSAGEM_PADRAO_UPGRADE =
  "Olá {cliente}! 🎉 Como você já é nosso cliente, liberamos uma oferta exclusiva: quer adicionar *mais 1 dispositivo (outra TV ou celular)* no seu acesso por apenas *+R$ {acrescimo}/mês*? A gente já ativa hoje e você *só paga na sua próxima mensalidade* (passando de R$ {valor_atual} para R$ {valor_novo}). Quer que eu libere agora?";

interface CampanhaUpgradeDialogProps {
  open: boolean;
  acessos: Acesso[];
  usuariosAgrupados: UsuarioAgrupado[];
  zapiInstanceId?: string;
  zapiToken?: string;
  onFechar: () => void;
  onAbrirUpgradeCliente: (acesso: Acesso) => void;
  onToast?: (toast: { type: "success" | "error" | "info"; message: string }) => void;
}

/**
 * Campanha comercial para oferecer +1 tela IPTV aos clientes ativos de 1 dispositivo,
 * aproveitando vagas ociosas sem custo adicional de crédito.
 */
export function CampanhaUpgradeDialog({
  open,
  acessos,
  usuariosAgrupados,
  zapiInstanceId,
  zapiToken,
  onFechar,
  onAbrirUpgradeCliente,
  onToast,
}: CampanhaUpgradeDialogProps) {
  const [acrescimo, setAcrescimo] = useState("10");
  const [somenteComVagaNaLinha, setSomenteComVagaNaLinha] = useState(true);
  const [mensagem, setMensagem] = useState(MENSAGEM_PADRAO_UPGRADE);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [enviandoLote, setEnviandoLote] = useState(false);
  const [enviados, setEnviados] = useState<string[]>([]);
  const [whatsappPendente, setWhatsappPendente] = useState<(WhatsappEnvioPendente & { acessoId: string }) | null>(null);

  const vagasIptvPorLogin = useMemo(() => {
    const map = new Map<string, number>();
    usuariosAgrupados.forEach((u) => {
      map.set(extrairLoginUsuario(u.nome).toLowerCase(), u.vagas.iptv);
    });
    return map;
  }, [usuariosAgrupados]);

  const totalVagasIptv = useMemo(
    () => usuariosAgrupados.reduce((acc, u) => acc + (u.disponivel ? u.vagas.iptv : 0), 0),
    [usuariosAgrupados]
  );

  const elegiveis = useMemo(() => {
    const agora = Date.now();
    return acessos
      .filter((a) => {
        const ativo = new Date(a.vencimento).getTime() > agora;
        const disp = Number(a.dispositivos) || 1;
        const temTelefone = a.telefone.replace(/\D/g, "").length >= 10;
        if (!ativo || disp !== 1 || !temTelefone) return false;
        if (somenteComVagaNaLinha) {
          const vagasLinha = vagasIptvPorLogin.get(extrairLoginUsuario(a.usuario).toLowerCase()) || 0;
          return vagasLinha > 0;
        }
        return true;
      })
      .sort((a, b) => a.cliente.localeCompare(b.cliente));
  }, [acessos, somenteComVagaNaLinha, vagasIptvPorLogin]);

  const acrescimoNum = Math.max(0, Number(acrescimo) || 0);
  const zapiAtiva = Boolean(zapiInstanceId && zapiToken);

  function toggleSelecao(id: string) {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function selecionarTodos() {
    if (selecionados.length === elegiveis.length) {
      setSelecionados([]);
    } else {
      setSelecionados(elegiveis.map((e) => e.id));
    }
  }

  function gerarTexto(a: Acesso) {
    return formatarMensagemUpgrade(mensagem, {
      cliente: a.cliente,
      usuario: extrairLoginUsuario(a.usuario) || a.usuario,
      valorAtual: Number(a.valor) || 0,
      acrescimo: acrescimoNum,
    });
  }

  async function enviarIndividual(a: Acesso) {
    const phone = a.telefone.replace(/\D/g, "");
    const texto = gerarTexto(a);
    if (zapiAtiva) {
      try {
        const phoneFormatted = phone.startsWith("55") ? phone : `55${phone}`;
        const res = await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneFormatted, message: texto }),
        });
        if (!res.ok) throw new Error("Falha Z-API");
        setEnviados((prev) => [...new Set([...prev, a.id])]);
        onToast?.({ type: "success", message: `Oferta enviada para ${a.cliente}!` });
      } catch {
        setWhatsappPendente({
          acessoId: a.id,
          telefone: phone,
          mensagem: texto,
          titulo: a.cliente,
        });
      }
    } else {
      setWhatsappPendente({
        acessoId: a.id,
        telefone: phone,
        mensagem: texto,
        titulo: a.cliente,
      });
    }
  }

  async function enviarEmLote() {
    if (!zapiAtiva || selecionados.length === 0) return;
    setEnviandoLote(true);
    let ok = 0;
    for (const id of selecionados) {
      const item = elegiveis.find((e) => e.id === id);
      if (!item) continue;
      const phone = item.telefone.replace(/\D/g, "");
      const phoneFormatted = phone.startsWith("55") ? phone : `55${phone}`;
      try {
        const res = await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneFormatted, message: gerarTexto(item) }),
        });
        if (res.ok) {
          ok++;
          setEnviados((prev) => [...new Set([...prev, item.id])]);
        }
      } catch {
        // segue para o próximo
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
    setEnviandoLote(false);
    onToast?.({ type: "success", message: `Campanha enviada para ${ok} de ${selecionados.length} clientes!` });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Campanha +1 Tela IPTV (+R$ {acrescimoNum.toFixed(2)}/mês)
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 px-3.5 py-2.5 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
              <Tv className="h-4 w-4 text-violet-500" />
              <strong>{totalVagasIptv}</strong> vagas IPTV livres nas suas linhas •{" "}
              <strong>{elegiveis.length}</strong> clientes elegíveis (1 tela, ativos)
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={somenteComVagaNaLinha}
                onChange={(e) => setSomenteComVagaNaLinha(e.target.checked)}
              />
              Só linhas com vaga IPTV na própria conta
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <div className="grid gap-1">
              <Label className="text-xs">Acréscimo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={acrescimo}
                onChange={(e) => setAcrescimo(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">
                Mensagem da oferta ({"{cliente}"}, {"{valor_atual}"}, {"{valor_novo}"}, {"{acrescimo}"})
              </Label>
              <textarea
                rows={3}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={selecionarTodos}>
              {selecionados.length === elegiveis.length && elegiveis.length > 0
                ? "Desmarcar todos"
                : `Selecionar todos (${elegiveis.length})`}
            </Button>
            {zapiAtiva && (
              <Button
                type="button"
                size="sm"
                onClick={enviarEmLote}
                disabled={enviandoLote || selecionados.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {enviandoLote ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                Disparar Z-API ({selecionados.length})
              </Button>
            )}
          </div>

          <div className="grid max-h-[340px] gap-2 overflow-y-auto pr-1">
            {elegiveis.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Nenhum cliente ativo de 1 dispositivo encontrado com esse filtro.
              </p>
            ) : (
              elegiveis.map((item) => {
                const valorAtual = Number(item.valor) || 0;
                const valorNovo = valorAtual + acrescimoNum;
                const jaEnviado = enviados.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={selecionados.includes(item.id)}
                        onChange={() => toggleSelecao(item.id)}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                          <span className="truncate">{item.cliente}</span>
                          {jaEnviado && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {extrairLoginUsuario(item.usuario)} • {formatPhone(item.telefone)} •{" "}
                          <span>R$ {valorAtual.toFixed(2)}</span> →{" "}
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            R$ {valorNovo.toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => enviarIndividual(item)}
                      >
                        <MessageCircle className="mr-1 h-3 w-3 text-emerald-500" />
                        Enviar Oferta
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-[11px] bg-violet-600 hover:bg-violet-700 text-white"
                        onClick={() => onAbrirUpgradeCliente(item)}
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        Ativar +1 Tela
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <WhatsappChoiceDialog
      alvo={whatsappPendente}
      onFechar={() => setWhatsappPendente(null)}
      onEnviado={() => {
        if (whatsappPendente) {
          setEnviados((prev) => [...new Set([...prev, whatsappPendente.acessoId])]);
        }
      }}
    />
    </>
  );
}
