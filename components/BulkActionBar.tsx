"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Calendar,
  DollarSign,
  Smartphone,
  Trash2,
  X,
  Loader2,
  CheckSquare,
} from "lucide-react";

interface BulkActionBarProps {
  selecionadosCount: number;
  onLimparSelecao: () => void;
  onRenovarEmLote: () => Promise<void>;
  onExcluirEmLote: () => Promise<void>;
  onAlterarValorEmLote: (valor: number) => Promise<void>;
  onAlterarAppEmLote: (app: string) => Promise<void>;
  appOptions: string[];
}

export function BulkActionBar({
  selecionadosCount,
  onLimparSelecao,
  onRenovarEmLote,
  onExcluirEmLote,
  onAlterarValorEmLote,
  onAlterarAppEmLote,
  appOptions,
}: BulkActionBarProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRenewOpen, setConfirmRenewOpen] = useState(false);
  const [valorDialogOpen, setValorDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);

  const [novoValor, setNovoValor] = useState("");
  const [novoApp, setNovoApp] = useState("");
  
  const [processando, setProcessando] = useState(false);

  async function handleRenovar() {
    setProcessando(true);
    await onRenovarEmLote();
    setProcessando(false);
    setConfirmRenewOpen(false);
    onLimparSelecao();
  }

  async function handleExcluir() {
    setProcessando(true);
    await onExcluirEmLote();
    setProcessando(false);
    setConfirmDeleteOpen(false);
    onLimparSelecao();
  }

  async function handleAlterarValor() {
    const val = Number(novoValor);
    if (Number.isNaN(val) || val <= 0) return;
    setProcessando(true);
    await onAlterarValorEmLote(val);
    setProcessando(false);
    setValorDialogOpen(false);
    setNovoValor("");
    onLimparSelecao();
  }

  async function handleAlterarApp() {
    if (!novoApp) return;
    setProcessando(true);
    await onAlterarAppEmLote(novoApp);
    setProcessando(false);
    setAppDialogOpen(false);
    setNovoApp("");
    onLimparSelecao();
  }

  if (selecionadosCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 w-[95%] max-w-3xl -translate-x-1/2 animate-slide-up">
        <Card className="border border-slate-200/80 bg-white/90 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 rounded-2xl">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                <strong>{selecionadosCount}</strong> selecionado{selecionadosCount !== 1 ? "s" : ""}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLimparSelecao}
                className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
                onClick={() => setConfirmRenewOpen(true)}
                disabled={processando}
              >
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                Renovar
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
                onClick={() => setValorDialogOpen(true)}
                disabled={processando}
              >
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                Alterar Valor
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
                onClick={() => setAppDialogOpen(true)}
                disabled={processando}
              >
                <Smartphone className="h-3.5 w-3.5 text-indigo-500" />
                Alterar App
              </Button>

              <Button
                size="sm"
                variant="destructive"
                className="h-9 gap-1 text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={processando}
              >
                {processando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Excluir
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal Confirmar Exclusão em Lote */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Excluir em Lote"
        message={`Tem certeza que deseja excluir os ${selecionadosCount} clientes selecionados? Esta ação é irreversível.`}
        onConfirm={handleExcluir}
        onCancel={() => setConfirmDeleteOpen(false)}
        loading={processando}
        confirmLabel="Excluir"
        confirmVariant="destructive"
      />

      {/* Modal Confirmar Renovação em Lote */}
      <ConfirmDialog
        open={confirmRenewOpen}
        title="Renovar em Lote"
        message={`Deseja renovar todos os ${selecionadosCount} acessos selecionados por mais 30 dias? Isso criará registros de pagamentos para cada um deles.`}
        onConfirm={handleRenovar}
        onCancel={() => setConfirmRenewOpen(false)}
        loading={processando}
        confirmLabel="Renovar"
        confirmVariant="default"
      />

      {/* Modal Alterar Valor em Lote */}
      <ConfirmDialog
        open={valorDialogOpen}
        title="Alterar Valor em Lote"
        message={
          <div className="space-y-3 pt-2">
            <p className="text-sm text-slate-500">Defina o novo valor de mensalidade (R$) para os {selecionadosCount} clientes:</p>
            <Input
              type="number"
              placeholder="Ex: 35.00"
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
              className="mt-2"
            />
          </div>
        }
        onConfirm={handleAlterarValor}
        onCancel={() => {
          setValorDialogOpen(false);
          setNovoValor("");
        }}
        loading={processando}
        confirmLabel="Salvar"
        confirmVariant="default"
      />

      {/* Modal Alterar App em Lote */}
      <ConfirmDialog
        open={appDialogOpen}
        title="Alterar App em Lote"
        message={
          <div className="space-y-3 pt-2">
            <p className="text-sm text-slate-500">Selecione o novo aplicativo para os {selecionadosCount} clientes:</p>
            <select
              value={novoApp}
              onChange={(e) => setNovoApp(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 dark:border-slate-800 dark:bg-slate-900 text-sm"
            >
              <option value="">Selecione um aplicativo...</option>
              {appOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        }
        onConfirm={handleAlterarApp}
        onCancel={() => {
          setAppDialogOpen(false);
          setNovoApp("");
        }}
        loading={processando}
        confirmLabel="Salvar"
        confirmVariant="default"
      />
    </>
  );
}
