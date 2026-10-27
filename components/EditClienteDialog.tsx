"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Acesso, ServidorNome } from "@/lib/types";
import { SERVIDOR_OPTIONS, SERVIDORES } from "@/lib/constants";
import { formatPhone, toDateInput, isValidPhone, normalizePhone, fromDateInput, detectarServidor } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface EditClienteDialogProps {
  acesso: Acesso | null;
  appOptions: string[];
  onSalvar: (id: string, data: Partial<Acesso>) => Promise<void>;
  onFechar: () => void;
}

export function EditClienteDialog({ acesso, appOptions, onSalvar, onFechar }: EditClienteDialogProps) {
  const [form, setForm] = useState({
    usuario: "",
    cliente: "",
    telefone: "",
    valor: "",
    app: "P2P",
    servidor: "Warez" as ServidorNome,
    vencimento: "",
    enderecoMac: "",
    chaveKey: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (acesso) {
      const servidorInicial = (acesso.servidor as ServidorNome) || detectarServidor(acesso);
      setForm({
        usuario: acesso.usuario,
        cliente: acesso.cliente,
        telefone: formatPhone(acesso.telefone),
        valor: String(acesso.valor ?? ""),
        app: acesso.app,
        servidor: servidorInicial,
        vencimento: toDateInput(acesso.vencimento),
        enderecoMac: acesso.enderecoMac || "",
        chaveKey: acesso.chaveKey || "",
      });
      setErro("");
    }
  }, [acesso]);

  async function handleSalvar() {
    if (!acesso) return;
    if (!form.usuario.trim() || !form.cliente.trim()) { setErro("Preencha usuário e cliente"); return; }
    if (!isValidPhone(form.telefone)) { setErro("Digite um telefone válido com DDD"); return; }
    setSalvando(true);
    setErro("");
    await onSalvar(acesso.id, {
      usuario: form.usuario.trim(),
      cliente: form.cliente.trim(),
      telefone: normalizePhone(form.telefone),
      valor: Number(form.valor) || 0,
      app: form.app,
      servidor: form.servidor,
      vencimento: fromDateInput(form.vencimento),
      enderecoMac: form.enderecoMac.trim(),
      chaveKey: form.chaveKey.trim(),
    });
    setSalvando(false);
    onFechar();
  }

  return (
    <Dialog open={!!acesso} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {["usuario", "cliente"].map((field) => (
            <div key={field} className="grid gap-1">
              <Label className="capitalize">{field === "usuario" ? "Usuário / Login" : "Nome do Cliente"}</Label>
              <Input value={form[field as "usuario" | "cliente"]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} />
            </div>
          ))}

          {/* Seletor de Servidor */}
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <Label>Servidor</Label>
              <span className="text-[11px] text-slate-500">
                {SERVIDORES[form.servidor]?.descricao}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SERVIDOR_OPTIONS.map((srv) => (
                <button
                  key={srv}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, servidor: srv }))}
                  className={`rounded-xl border p-2 text-center text-xs font-bold transition-all ${
                    form.servidor === srv
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  <div>{srv}</div>
                  <div className="text-[10px] font-normal opacity-75">R$ {SERVIDORES[srv].custoCredito.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1">
            <Label>Telefone / WhatsApp</Label>
            <Input value={form.telefone} onChange={(e) => setForm((p) => ({ ...p, telefone: formatPhone(e.target.value) }))} />
          </div>
          <div className="grid gap-1">
            <Label>Valor (R$)</Label>
            <Input type="number" value={form.valor} onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))} />
          </div>
          <div className="grid gap-1">
            <Label>App</Label>
            <Input list="app-options-edit" value={form.app} onChange={(e) => setForm((p) => ({ ...p, app: e.target.value.toUpperCase() }))} />
            <datalist id="app-options-edit">
              {appOptions.map((o) => <option key={o} value={o} />)}
            </datalist>
          </div>
          <div className="grid gap-1">
            <Label>Vencimento</Label>
            <Input type="date" value={form.vencimento} onChange={(e) => setForm((p) => ({ ...p, vencimento: e.target.value }))} />
          </div>
          <div className="grid gap-1">
            <Label>Endereço MAC (opcional)</Label>
            <Input value={form.enderecoMac} onChange={(e) => setForm((p) => ({ ...p, enderecoMac: e.target.value }))} />
          </div>
          <div className="grid gap-1">
            <Label>Chave Key (opcional)</Label>
            <Input value={form.chaveKey} onChange={(e) => setForm((p) => ({ ...p, chaveKey: e.target.value }))} />
          </div>
          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onFechar} disabled={salvando}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
