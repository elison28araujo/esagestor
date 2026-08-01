"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Acesso } from "@/lib/types";
import { Calendar, Loader2 } from "lucide-react";

interface RenovarAcessoDialogProps {
  acesso: Acesso | null;
  open: boolean;
  onFechar: () => void;
  onConfirmar: (id: string, meses: number, valor: number) => Promise<void>;
}

export function RenovarAcessoDialog({
  acesso,
  open,
  onFechar,
  onConfirmar,
}: RenovarAcessoDialogProps) {
  const [meses, setMeses] = useState<number>(1);
  const [valorCobrado, setValorCobrado] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customMeses, setCustomMeses] = useState<string>("4");
  const [loading, setLoading] = useState<boolean>(false);

  // Inicializar valores quando abrir
  useEffect(() => {
    if (open && acesso) {
      setMeses(1);
      setValorCobrado(Number(acesso.valor || 0).toFixed(2));
      setIsCustom(false);
      setCustomMeses("4");
    }
  }, [open, acesso]);

  // Recalcular valor cobrado quando mudar o pacote de meses
  useEffect(() => {
    if (!acesso) return;
    const baseValor = Number(acesso.valor || 0);
    
    if (!isCustom) {
      setValorCobrado((baseValor * meses).toFixed(2));
    } else {
      const numMeses = parseInt(customMeses) || 1;
      setValorCobrado((baseValor * numMeses).toFixed(2));
    }
  }, [meses, isCustom, customMeses, acesso]);

  if (!acesso) return null;

  async function handleConfirmar() {
    if (!acesso) return;
    const finalMeses = isCustom ? parseInt(customMeses) || 1 : meses;
    const finalValor = parseFloat(valorCobrado) || 0;
    
    setLoading(true);
    try {
      await onConfirmar(acesso.id, finalMeses, finalValor);
      onFechar();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const baseValor = Number(acesso.valor || 0);
  const pacotes = [
    { label: "1 Mês", value: 1, calculated: baseValor },
    { label: "2 Meses", value: 2, calculated: baseValor * 2 },
    { label: "3 Meses", value: 3, calculated: baseValor * 3 },
    { label: "6 Meses", value: 6, calculated: baseValor * 6 },
    { label: "12 Meses", value: 12, calculated: baseValor * 12 },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onFechar()}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            Renovar Acesso - {acesso.cliente}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Info do Cliente */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex justify-between items-center text-sm">
            <div>
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Aplicativo</span>
              <div className="font-bold text-slate-700 dark:text-slate-200 text-base">{acesso.app}</div>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Valor Mensal Base</span>
              <div className="font-bold text-slate-700 dark:text-slate-200 text-base">R$ {baseValor.toFixed(2)}</div>
            </div>
          </div>

          {/* Selecionar Período */}
          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold tracking-wider text-slate-400">Selecionar Período</Label>
            <div className="grid grid-cols-3 gap-2">
              {pacotes.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setMeses(p.value);
                    setIsCustom(false);
                  }}
                  className={`p-3 rounded-2xl border text-center flex flex-col justify-center items-center gap-1 transition active:scale-95 ${
                    !isCustom && meses === p.value
                      ? "bg-blue-600 hover:bg-blue-700 border-none text-white shadow-lg shadow-blue-500/25"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-355"
                  }`}
                >
                  <span className="text-sm font-bold">{p.label}</span>
                  <span className={`text-[10px] ${!isCustom && meses === p.value ? "text-blue-100" : "text-slate-400"}`}>
                    R$ {p.calculated.toFixed(2)}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`p-3 rounded-2xl border text-center flex flex-col justify-center items-center gap-1 transition active:scale-95 ${
                  isCustom
                    ? "bg-blue-600 hover:bg-blue-700 border-none text-white shadow-lg shadow-blue-500/25"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-355"
                }`}
              >
                <span className="text-sm font-bold">Outro</span>
                <span className={`text-[10px] ${isCustom ? "text-blue-100" : "text-slate-400"}`}>
                  Personalizado
                </span>
              </button>
            </div>
          </div>

          {/* Campo de meses personalizados se selecionado Outro */}
          {isCustom && (
            <div className="grid gap-1.5 transition-all">
              <Label htmlFor="custom-months" className="text-xs uppercase font-bold tracking-wider text-slate-400">Quantidade de Meses</Label>
              <Input
                id="custom-months"
                type="number"
                min="1"
                className="h-11 rounded-2xl dark:border-slate-800 dark:bg-slate-950/50"
                placeholder="Digite o número de meses"
                value={customMeses}
                onChange={(e) => setCustomMeses(e.target.value)}
              />
            </div>
          )}

          {/* Campo de Valor Final Cobrado */}
          <div className="grid gap-1.5">
            <Label htmlFor="final-value" className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Valor Final Cobrado (R$)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">R$</span>
              <Input
                id="final-value"
                type="text"
                className="h-11 pl-9 rounded-2xl font-semibold text-base dark:border-slate-800 dark:bg-slate-950/50 text-blue-600 dark:text-blue-400"
                placeholder="0.00"
                value={valorCobrado}
                onChange={(e) => setValorCobrado(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              O sistema calcula o valor baseado no período, mas você pode digitar qualquer valor promocional ou com desconto se desejar.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="outline" className="rounded-2xl flex-1 h-11" onClick={onFechar} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            className="rounded-2xl flex-1 bg-blue-600 hover:bg-blue-700 h-11 text-white font-bold" 
            onClick={handleConfirmar}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
