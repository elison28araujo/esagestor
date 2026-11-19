"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Acesso, ServidorNome } from "@/lib/types";
import { SERVIDOR_OPTIONS, SERVIDORES } from "@/lib/constants";
import { formatPhone, isValidPhone, detectarServidor } from "@/lib/utils";
import { Loader2, UserPlus } from "lucide-react";

interface AdicionarUsuarioDialogProps {
  acesso: Acesso | null;
  appOptions: string[];
  onAdicionar: (data: {
    nomeUser: string;
    cliente: string;
    telefone: string;
    valor: string;
    valorCombo?: string;
    app: string;
    enderecoMac?: string;
    chaveKey?: string;
    servidor?: ServidorNome | string;
    lancarDespesaCredito?: boolean;
  }) => Promise<boolean>;
  onFechar: () => void;
}

export function AdicionarUsuarioDialog({
  acesso,
  appOptions,
  onAdicionar,
  onFechar,
}: AdicionarUsuarioDialogProps) {
  const [nomeUser, setNomeUser] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [valor, setValor] = useState("");
  const [valorCombo, setValorCombo] = useState("");
  const [app, setApp] = useState("P2P");
  const [servidor, setServidor] = useState<ServidorNome>("Warez");
  const [enderecoMac, setEnderecoMac] = useState("");
  const [chaveKey, setChaveKey] = useState("");
  const [lancarDespesaCredito, setLancarDespesaCredito] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (acesso) {
      const servidorInicial = (acesso.servidor as ServidorNome) || detectarServidor(acesso);
      setNomeUser("");
      setCliente(acesso.cliente);
      setTelefone(formatPhone(acesso.telefone));
      setValor(String(acesso.valor ?? ""));
      setValorCombo(acesso.valorCombo && acesso.valorCombo > 0 ? String(acesso.valorCombo) : "");
      setApp(acesso.app || "P2P");
      setServidor((SERVIDOR_OPTIONS as string[]).includes(servidorInicial) ? servidorInicial : "Warez");
      setEnderecoMac("");
      setChaveKey("");
      setLancarDespesaCredito(false);
      setErro("");
    }
  }, [acesso]);

  const valorNumerico = Number(valor) || 0;
  const custoCredito = SERVIDORES[servidor]?.custoCredito ?? 0;
  const lucroEstimado = valorNumerico - custoCredito;

  async function handleConfirmar() {
    if (!acesso) return;
    if (!nomeUser.trim()) {
      setErro("Digite o novo usuário / login");
      return;
    }
    if (!cliente.trim()) {
      setErro("Preencha o nome do cliente");
      return;
    }
    if (!isValidPhone(telefone)) {
      setErro("Digite um telefone válido com DDD");
      return;
    }

    setSalvando(true);
    setErro("");
    const sucesso = await onAdicionar({
      nomeUser: nomeUser.trim(),
      cliente: cliente.trim(),
      telefone,
      valor,
      valorCombo,
      app: app.trim().toUpperCase() || "P2P",
      enderecoMac,
      chaveKey,
      servidor,
      lancarDespesaCredito,
    });
    setSalvando(false);
    if (sucesso) {
      onFechar();
    }
  }

  return (
    <Dialog open={!!acesso} onOpenChange={(open) => !open && onFechar()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Adicionar novo usuário para {acesso?.cliente}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="novo-usuario-login">Novo Usuário / Login</Label>
            <Input
              id="novo-usuario-login"
              autoFocus
              placeholder="Digite o novo login adquirido pelo cliente"
              value={nomeUser}
              onChange={(e) => setNomeUser(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Servidor / Linha</Label>
            <div className="grid grid-cols-3 gap-2">
              {SERVIDOR_OPTIONS.map((srv) => {
                const isSelected = servidor === srv;
                return (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => setServidor(srv)}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-500/30"
                        : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                    }`}
                  >
                    <div>{srv}</div>
                    <div className="text-[10px] font-normal opacity-75">
                      R$ {SERVIDORES[srv].custoCredito.toFixed(2)}/créd.
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="novo-usuario-cliente">Cliente</Label>
              <Input
                id="novo-usuario-cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="novo-usuario-telefone">WhatsApp</Label>
              <Input
                id="novo-usuario-telefone"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="novo-usuario-valor">Valor (R$)</Label>
              <Input
                id="novo-usuario-valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="novo-usuario-valor-combo">Combo (opc.)</Label>
              <Input
                id="novo-usuario-valor-combo"
                type="number"
                step="0.01"
                placeholder="Ex: 22.50"
                value={valorCombo}
                onChange={(e) => setValorCombo(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="novo-usuario-app">Aplicativo</Label>
              <Input
                id="novo-usuario-app"
                list="app-options-add-user"
                value={app}
                onChange={(e) => setApp(e.target.value.toUpperCase())}
              />
              <datalist id="app-options-add-user">
                {appOptions.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="novo-usuario-mac">Endereço MAC (opcional)</Label>
              <Input
                id="novo-usuario-mac"
                placeholder="Ex: 00:1A:2B..."
                value={enderecoMac}
                onChange={(e) => setEnderecoMac(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="novo-usuario-key">Chave Key (opcional)</Label>
              <Input
                id="novo-usuario-key"
                placeholder="Opcional"
                value={chaveKey}
                onChange={(e) => setChaveKey(e.target.value)}
              />
            </div>
          </div>

          {/* Resumo financeiro automático */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Entrada (Pagamento):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                + R$ {valorNumerico.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Custo crédito ({servidor}):
              </span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                R$ {custoCredito.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Lucro líquido estimado:</span>
              <span
                className={`font-mono font-bold ${
                  lucroEstimado >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                R$ {lucroEstimado.toFixed(2)}
              </span>
            </div>
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={lancarDespesaCredito}
                onChange={(e) => setLancarDespesaCredito(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <span>Lançar custo do crédito (R$ {custoCredito.toFixed(2)}) como despesa</span>
            </label>
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
              {erro}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={salvando}>
            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
