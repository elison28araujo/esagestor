"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Acesso, ImportFeedback } from "@/lib/types";
import { formatPhone, isValidPhone, normalizePhone } from "@/lib/utils";
import { Download, Loader2, Plus, Upload, User, Phone, DollarSign } from "lucide-react";

interface NovoClienteFormProps {
  acessos: Acesso[];
  appOptions: string[];
  importFeedback: ImportFeedback | null;
  importando: boolean;
  onAddCliente: (data: { nomeUser: string; cliente: string; telefone: string; valor: string; app: string }) => Promise<void>;
  onExportarCsv: () => void;
  onImportarCsv: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onImportarGoogleSheet: (url: string) => Promise<void>;
}

export function NovoClienteForm({
  appOptions,
  importFeedback,
  importando,
  onAddCliente,
  onExportarCsv,
  onImportarCsv,
  onImportarGoogleSheet,
}: NovoClienteFormProps) {
  const [nomeUser, setNomeUser] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [valor, setValor] = useState("");
  const [app, setApp] = useState("P2P");
  const [sheetUrl, setSheetUrl] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [erro, setErro] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleAdd() {
    if (!nomeUser.trim() || !cliente.trim()) { setErro("Preencha usuário e cliente"); return; }
    if (!isValidPhone(telefone)) { setErro("Digite um telefone válido com DDD"); return; }
    setErro("");
    setAdicionando(true);
    await onAddCliente({ nomeUser, cliente, telefone, valor, app });
    setNomeUser(""); setCliente(""); setTelefone(""); setValor(""); setApp("P2P");
    setAdicionando(false);
  }

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Plus className="h-4 w-4 text-blue-600" /> Novo acesso
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onExportarCsv}>
              <Download className="mr-1 h-4 w-4" /> Exportar CSV
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importando}>
              {importando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              Importar CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onImportarCsv} />
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Importar CSV com colunas: <code>usuario</code>, <code>cliente</code>, <code>whatsapp</code>, <code>valor</code>, <code>app</code>, <code>vencimento</code>, <code>data</code>.
        </p>

        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Input
            placeholder="Cole aqui o link do Google Sheets"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={() => { onImportarGoogleSheet(sheetUrl); setSheetUrl(""); }} disabled={importando}>
            {importando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
            Importar link
          </Button>
        </div>

        {importFeedback && (
          <div className={`rounded-xl border px-3 py-2 text-sm ${
            importFeedback.type === "error" ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
            : importFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300"
            : "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
          }`}>
            {importFeedback.message}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" placeholder="Usuário / Login" value={nomeUser} onChange={(e) => setNomeUser(e.target.value)} />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" placeholder="Nome do cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" placeholder="WhatsApp com DDD" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} />
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" placeholder="Valor (R$)" type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
        </div>

        <Input list="app-options-new" placeholder="Aplicativo (ex: P2P, OTT)" value={app} onChange={(e) => setApp(e.target.value.toUpperCase())} />
        <datalist id="app-options-new">
          {appOptions.map((o) => <option key={o} value={o} />)}
        </datalist>

        {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 dark:bg-red-950 dark:text-red-300">{erro}</p>}

        <Button onClick={handleAdd} disabled={adicionando} className="h-11">
          {adicionando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Adicionar cliente
        </Button>
      </CardContent>
    </Card>
  );
}
