"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TelaDispositivo } from "@/lib/types";
import { ajustarTelasParaQuantidade } from "@/lib/utils";
import { Cpu, Key, Tv } from "lucide-react";

interface TelasDispositivosFieldsProps {
  dispositivos: 1 | 2 | 3;
  telas: TelaDispositivo[];
  appOptions: string[];
  datalistId: string;
  onChangeDispositivos: (qtd: 1 | 2 | 3, novasTelas: TelaDispositivo[]) => void;
  onChangeTelas: (novasTelas: TelaDispositivo[]) => void;
}

/**
 * Seletor de quantidade de dispositivos (1..3) com campos individuais de App, MAC e Key por tela.
 */
export function TelasDispositivosFields({
  dispositivos,
  telas,
  appOptions,
  datalistId,
  onChangeDispositivos,
  onChangeTelas,
}: TelasDispositivosFieldsProps) {
  function handleSelecionarQtd(qtd: 1 | 2 | 3) {
    const ajustadas = ajustarTelasParaQuantidade(telas, qtd);
    onChangeDispositivos(qtd, ajustadas);
  }

  function handleCampoTela(index: number, campo: keyof TelaDispositivo, valor: string) {
    const proximas = telas.map((tela, idx) =>
      idx === index
        ? { ...tela, [campo]: campo === "app" ? valor.toUpperCase() : valor }
        : tela
    );
    onChangeTelas(proximas);
  }

  return (
    <div className="grid gap-2.5">
      <div className="grid gap-1.5">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Dispositivos / Telas neste acesso
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((qtd) => (
            <button
              key={qtd}
              type="button"
              onClick={() => handleSelecionarQtd(qtd)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                dispositivos === qtd
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              {qtd} {qtd === 1 ? "Dispositivo" : "Dispositivos"}
            </button>
          ))}
        </div>
      </div>

      <datalist id={datalistId}>
        {appOptions.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>

      <div className="grid gap-2">
        {telas.slice(0, dispositivos).map((tela, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40"
          >
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Tv className="h-3.5 w-3.5 text-blue-500" />
              Tela {idx + 1}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                list={datalistId}
                placeholder="App (ex: P2P, OTT)"
                value={tela.app}
                onChange={(e) => handleCampoTela(idx, "app", e.target.value)}
              />
              <div className="relative">
                <Cpu className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="MAC (opcional)"
                  value={tela.enderecoMac || ""}
                  onChange={(e) => handleCampoTela(idx, "enderecoMac", e.target.value)}
                />
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  placeholder="Key (opcional)"
                  value={tela.chaveKey || ""}
                  onChange={(e) => handleCampoTela(idx, "chaveKey", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
