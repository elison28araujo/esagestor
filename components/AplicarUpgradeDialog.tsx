"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Acesso, TelaDispositivo } from "@/lib/types";
import { Cpu, Key, Loader2, Sparkles, Tv } from "lucide-react";

interface AplicarUpgradeDialogProps {
  acesso: Acesso | null;
  appOptions: string[];
  onConfirmar: (acesso: Acesso, novaTela: TelaDispositivo, acrescimo: number) => Promise<void>;
  onFechar: () => void;
}

/**
 * Modal rápido para ativar +1 dispositivo (tela IPTV) no acesso do cliente,
 * somando o acréscimo na próxima mensalidade sem alterar o vencimento atual.
 */
export function AplicarUpgradeDialog({
  acesso,
  appOptions,
  onConfirmar,
  onFechar,
}: AplicarUpgradeDialogProps) {
  const [app, setApp] = useState("OTT PLAYER");
  const [enderecoMac, setEnderecoMac] = useState("");
  const [chaveKey, setChaveKey] = useState("");
  const [acrescimo, setAcrescimo] = useState("10");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (acesso) {
      setApp("OTT PLAYER");
      setEnderecoMac("");
      setChaveKey("");
      setAcrescimo("10");
    }
  }, [acesso]);

  if (!acesso) return null;

  const qtdAtual = Math.max(1, Number(acesso.dispositivos) || 1);
  const novaQtd = Math.min(3, qtdAtual + 1);
  const valorAtual = Number(acesso.valor) || 0;
  const acrescimoNum = Math.max(0, Number(acrescimo) || 0);
  const novoValor = valorAtual + acrescimoNum;

  async function handleConfirmar() {
    if (!acesso) return;
    setSalvando(true);
    await onConfirmar(
      acesso,
      {
        app: app.trim().toUpperCase() || "OTT PLAYER",
        enderecoMac: enderecoMac.trim(),
        chaveKey: chaveKey.trim(),
      },
      acrescimoNum
    );
    setSalvando(false);
    onFechar();
  }

  return (
    <Dialog open={!!acesso} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Ativar +{novaQtd - qtdAtual} Tela ({novaQtd}º Dispositivo)
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
            <div className="font-bold text-slate-800 dark:text-slate-100">
              {acesso.cliente} <span className="font-mono text-slate-500">({acesso.usuario})</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
              <span>Telas: <strong>{qtdAtual} → {novaQtd}</strong></span>
              <span>•</span>
              <span>
                Mensalidade: <strong>R$ {valorAtual.toFixed(2)}</strong> →{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">R$ {novoValor.toFixed(2)}</strong>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              O vencimento atual ({new Date(acesso.vencimento).toLocaleDateString("pt-BR")}) será mantido; a diferença passa a valer na próxima mensalidade.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1.5">
              <Tv className="h-3.5 w-3.5 text-blue-500" /> App da nova tela
            </Label>
            <Input
              list="app-options-upgrade"
              value={app}
              onChange={(e) => setApp(e.target.value.toUpperCase())}
              placeholder="Ex: OTT PLAYER, MAX PLAYER"
            />
            <datalist id="app-options-upgrade">
              {appOptions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs">MAC (opcional)</Label>
              <div className="relative">
                <Cpu className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-8"
                  value={enderecoMac}
                  onChange={(e) => setEnderecoMac(e.target.value)}
                  placeholder="00:11:22..."
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Key (opcional)</Label>
              <div className="relative">
                <Key className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-8"
                  value={chaveKey}
                  onChange={(e) => setChaveKey(e.target.value)}
                  placeholder="Chave"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">Acréscimo na mensalidade (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={acrescimo}
              onChange={(e) => setAcrescimo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={salvando}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ativar +1 Tela (R$ {novoValor.toFixed(2)}/mês)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
