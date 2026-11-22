"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Acesso, ImportFeedback, ServidorNome, TelaDispositivo } from "@/lib/types";
import { SERVIDOR_OPTIONS, SERVIDORES } from "@/lib/constants";
import { formatPhone, isValidPhone, resumirTelasParaAcesso } from "@/lib/utils";
import { TelasDispositivosFields } from "@/components/TelasDispositivosFields";
import { Download, Loader2, Plus, Upload, User, Phone, DollarSign, Server, Trash2 } from "lucide-react";

interface UsuarioFormItem {
  nomeUser: string;
  servidor: ServidorNome;
  valor: string;
  valorCombo: string;
  dispositivos: 1 | 2 | 3;
  telas: TelaDispositivo[];
}

function criarUsuarioVazio(usuario = "", servidor: ServidorNome = "Warez"): UsuarioFormItem {
  return {
    nomeUser: usuario,
    servidor,
    valor: "",
    valorCombo: "",
    dispositivos: 1,
    telas: [{ app: "P2P", enderecoMac: "", chaveKey: "" }],
  };
}

interface NovoClienteFormProps {
  acessos: Acesso[];
  appOptions: string[];
  importFeedback: ImportFeedback | null;
  importando: boolean;
  usuarioPredefinido?: string;
  servidorPredefinido?: ServidorNome | string;
  onAddCliente: (data: {
    nomeUser: string;
    cliente: string;
    telefone: string;
    valor: string;
    valorCombo?: string;
    dispositivos?: number;
    dispositivosP2P?: number;
    dispositivosIPTV?: number;
    telas?: TelaDispositivo[];
    app: string;
    enderecoMac?: string;
    chaveKey?: string;
    servidor?: ServidorNome | string;
  }) => Promise<boolean>;
  onExportarCsv: () => void;
  onImportarCsv: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onImportarGoogleSheet: (url: string) => Promise<void>;
}

export function NovoClienteForm({
  appOptions,
  importFeedback,
  importando,
  usuarioPredefinido,
  servidorPredefinido,
  onAddCliente,
  onExportarCsv,
  onImportarCsv,
  onImportarGoogleSheet,
}: NovoClienteFormProps) {
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [usuarios, setUsuarios] = useState<UsuarioFormItem[]>([criarUsuarioVazio()]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [erro, setErro] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (usuarioPredefinido || servidorPredefinido) {
      const srvValido =
        servidorPredefinido && (SERVIDOR_OPTIONS as string[]).includes(servidorPredefinido)
          ? (servidorPredefinido as ServidorNome)
          : undefined;
      setUsuarios((prev) => {
        const primeiro = prev[0] || criarUsuarioVazio();
        return [
          {
            ...primeiro,
            ...(usuarioPredefinido ? { nomeUser: usuarioPredefinido } : {}),
            ...(srvValido ? { servidor: srvValido } : {}),
          },
          ...prev.slice(1),
        ];
      });
    }
  }, [usuarioPredefinido, servidorPredefinido]);

  function atualizarUsuario(index: number, patch: Partial<UsuarioFormItem>) {
    setUsuarios((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  }

  function adicionarBlocoUsuario() {
    setUsuarios((prev) => [...prev, criarUsuarioVazio()]);
  }

  function removerBlocoUsuario(index: number) {
    setUsuarios((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleAdd() {
    if (!cliente.trim()) {
      setErro("Preencha o nome do cliente");
      return;
    }
    if (!isValidPhone(telefone)) {
      setErro("Digite um telefone válido com DDD");
      return;
    }
    for (let i = 0; i < usuarios.length; i++) {
      const u = usuarios[i];
      if (!u.nomeUser.trim()) {
        setErro(`Preencha o Usuário / Login do item ${i + 1}`);
        return;
      }
      if (u.telas.some((t) => !t.app.trim())) {
        setErro(`Preencha o aplicativo de todas as telas do Usuário ${i + 1}`);
        return;
      }
    }

    setErro("");
    setAdicionando(true);
    let todosOk = true;
    for (const u of usuarios) {
      const resumo = resumirTelasParaAcesso(u.telas);
      const ok = await onAddCliente({
        nomeUser: u.nomeUser,
        cliente,
        telefone,
        valor: u.valor,
        valorCombo: u.valorCombo,
        dispositivos: u.dispositivos,
        dispositivosP2P: resumo.dispositivosP2P,
        dispositivosIPTV: resumo.dispositivosIPTV,
        telas: resumo.telas,
        app: resumo.app,
        enderecoMac: resumo.enderecoMac,
        chaveKey: resumo.chaveKey,
        servidor: u.servidor,
      });
      if (!ok) {
        todosOk = false;
      }
    }
    if (todosOk) {
      setCliente("");
      setTelefone("");
      setUsuarios([criarUsuarioVazio()]);
    }
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
          Importar CSV com colunas: <code>usuario</code>, <code>cliente</code>, <code>whatsapp</code>, <code>valor</code>, <code>app</code>, <code>vencimento</code>, <code>data</code>, <code>servidor</code> (opcional), <code>mac</code> (opcional), <code>key</code> (opcional).
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

        {/* Dados compartilhados do cliente */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" placeholder="Nome do cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" placeholder="WhatsApp com DDD" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} />
          </div>
        </div>

        {/* Blocos de Usuários / Acessos */}
        <div className="grid gap-4">
          {usuarios.map((u, idx) => (
            <div
              key={idx}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Usuário / Acesso {usuarios.length > 1 ? `#${idx + 1}` : ""}
                </span>
                {usuarios.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removerBlocoUsuario(idx)}
                    className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
                  </Button>
                )}
              </div>

              {/* Seleção do Servidor */}
              <div className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <Server className="h-3.5 w-3.5 text-blue-500" /> Servidor / Linha
                  </span>
                  <span className="text-xs text-slate-500">
                    {SERVIDORES[u.servidor].descricao}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SERVIDOR_OPTIONS.map((srv) => {
                    const info = SERVIDORES[srv];
                    const isSelected = u.servidor === srv;
                    return (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => atualizarUsuario(idx, { servidor: srv })}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300 font-bold ring-2 ring-blue-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                        }`}
                      >
                        <span className="text-sm font-bold">{srv}</span>
                        <span className="text-[11px] opacity-80">R$ {info.custoCredito.toFixed(2)}/créd.</span>
                        <span className="text-[10px] opacity-70">Até {info.capacidadeTotal} clientes</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-10"
                    placeholder="Usuário / Login"
                    value={u.nomeUser}
                    onChange={(e) => atualizarUsuario(idx, { nomeUser: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-10"
                    placeholder="Valor (R$)"
                    type="number"
                    step="0.01"
                    value={u.valor}
                    onChange={(e) => atualizarUsuario(idx, { valor: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  <Input
                    className="pl-10"
                    placeholder="Valor no Combo (opcional)"
                    type="number"
                    step="0.01"
                    value={u.valorCombo}
                    onChange={(e) => atualizarUsuario(idx, { valorCombo: e.target.value })}
                    title="Valor deste acesso quando o cliente renovar 2 ou mais acessos juntos"
                  />
                </div>
              </div>

              <TelasDispositivosFields
                dispositivos={u.dispositivos}
                telas={u.telas}
                appOptions={appOptions}
                datalistId={`app-options-new-${idx}`}
                onChangeDispositivos={(qtd, novasTelas) =>
                  atualizarUsuario(idx, { dispositivos: qtd, telas: novasTelas })
                }
                onChangeTelas={(novasTelas) => atualizarUsuario(idx, { telas: novasTelas })}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={adicionarBlocoUsuario}
            className="border-dashed"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Adicionar outro usuário para este cliente
          </Button>
        </div>

        {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 dark:bg-red-950 dark:text-red-300">{erro}</p>}

        <Button onClick={handleAdd} disabled={adicionando} className="h-11">
          {adicionando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {usuarios.length > 1 ? `Adicionar ${usuarios.length} usuários` : "Adicionar cliente"}
        </Button>
      </CardContent>
    </Card>
  );
}
