"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Acesso } from "@/lib/types";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface AcordoDialogProps {
  acesso: Acesso | null;
  onClose: () => void;
  onSalvarAcordo: (
    acesso: Acesso,
    dados: {
      valor: number;
      dataCombinada: string;
      observacao: string;
      avancarVencimento: boolean;
    }
  ) => Promise<void>;
  onQuitarAcordo: (acesso: Acesso, valorRecebido: number) => Promise<void>;
  onCancelarAcordo: (acesso: Acesso) => Promise<void>;
}

function defaultDataCombinada(acesso: Acesso | null): string {
  if (acesso?.acordoData) {
    const parsed = new Date(acesso.acordoData);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function AcordoDialog({
  acesso,
  onClose,
  onSalvarAcordo,
  onQuitarAcordo,
  onCancelarAcordo,
}: AcordoDialogProps) {
  const [valor, setValor] = useState("");
  const [dataCombinada, setDataCombinada] = useState("");
  const [observacao, setObservacao] = useState("");
  const [avancarVencimento, setAvancarVencimento] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!acesso) return;
    const valorInicial =
      acesso.acordoAtivo && Number(acesso.acordoValor || 0) > 0
        ? Number(acesso.acordoValor)
        : Number(acesso.valor || 0);
    setValor(valorInicial > 0 ? valorInicial.toFixed(2) : "");
    setDataCombinada(defaultDataCombinada(acesso));
    setObservacao(acesso.acordoObs || "");
    setAvancarVencimento(!acesso.acordoAtivo);
  }, [acesso]);

  if (!acesso) return null;

  const temAcordoAtivo = Boolean(acesso.acordoAtivo && Number(acesso.acordoValor || 0) > 0);
  const valorNumerico = Number(valor.replace(",", ".")) || 0;

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!acesso || valorNumerico <= 0) return;
    setSalvando(true);
    try {
      await onSalvarAcordo(acesso, {
        valor: Number(valorNumerico.toFixed(2)),
        dataCombinada: dataCombinada
          ? new Date(`${dataCombinada}T12:00:00-03:00`).toISOString()
          : new Date().toISOString(),
        observacao: observacao.trim(),
        avancarVencimento,
      });
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  async function handleQuitar() {
    if (!acesso) return;
    setSalvando(true);
    try {
      await onQuitarAcordo(acesso, valorNumerico > 0 ? valorNumerico : Number(acesso.acordoValor || acesso.valor || 0));
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  async function handleCancelar() {
    if (!acesso) return;
    setSalvando(true);
    try {
      await onCancelarAcordo(acesso);
      onClose();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={!!acesso} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {temAcordoAtivo ? "Gerenciar Acordo Pendente" : "Registrar Acordo / Pagamento Depois"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSalvar} className="space-y-4">
        <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>
              {acesso.cliente} ({acesso.usuario})
            </span>
          </div>
          <p className="text-[11px] opacity-90">
            O acordo marca o card em <strong>AMARELO (atenção)</strong> sem lançar dinheiro no caixa agora. No portal de consulta/checkout, esse valor pendente será somado automaticamente ao plano escolhido (sem desconto Black Friday).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="acordo-valor">Valor pendente (R$)</Label>
            <Input
              id="acordo-valor"
              type="number"
              step="0.01"
              min="1"
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="30.00"
            />
          </div>
          <div>
            <Label htmlFor="acordo-data">Data combinada</Label>
            <Input
              id="acordo-data"
              type="date"
              required
              value={dataCombinada}
              onChange={(e) => setDataCombinada(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="acordo-obs">Observação (opcional)</Label>
          <Input
            id="acordo-obs"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: Combinado pagar mês que vem junto com a renovação"
          />
        </div>

        <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={avancarVencimento}
            onChange={(e) => setAvancarVencimento(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>Avançar vencimento</strong> para a data combinada (mantém o cliente usando sem lançar pagamento no financeiro hoje).
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {temAcordoAtivo && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={salvando}
                onClick={handleCancelar}
                className="gap-1.5 text-xs border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar Acordo
              </Button>
              <Button
                type="button"
                disabled={salvando}
                onClick={handleQuitar}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Quitar (Recebi)
              </Button>
            </>
          )}
          <Button
            type="submit"
            disabled={salvando || valorNumerico <= 0}
            className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
          >
            {salvando ? "Salvando..." : temAcordoAtivo ? "Atualizar Acordo" : "Salvar Acordo"}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
