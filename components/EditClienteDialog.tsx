"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Acesso } from "@/lib/types";
import { formatPhone, toDateInput, isValidPhone, normalizePhone, fromDateInput } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface EditClienteDialogProps {
  acesso: Acesso | null;
  appOptions: string[];
  onSalvar: (id: string, data: Partial<Acesso>) => Promise<void>;
  onFechar: () => void;
}

export function EditClienteDialog({ acesso, appOptions, onSalvar, onFechar }: EditClienteDialogProps) {
  const [form, setForm] = useState({ usuario: "", cliente: "", telefone: "", valor: "", app: "P2P", vencimento: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (acesso) {
      setForm({
        usuario: acesso.usuario,
        cliente: acesso.cliente,
        telefone: formatPhone(acesso.telefone),
        valor: String(acesso.valor ?? ""),
        app: acesso.app,
        vencimento: toDateInput(acesso.vencimento),
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
      vencimento: fromDateInput(form.vencimento),
    });
    setSalvando(false);
    onFechar();
  }

  return (
    <Dialog open={!!acesso} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {["usuario", "cliente"].map((field) => (
            <div key={field} className="grid gap-1">
              <Label className="capitalize">{field}</Label>
              <Input value={form[field as "usuario" | "cliente"]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} />
            </div>
          ))}
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
