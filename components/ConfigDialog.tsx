"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEFAULT_COBRANCA_MSG, DEFAULT_RENOVACAO_MSG } from "@/lib/constants";
import { MessageSquare, Smartphone, CreditCard, Bell, Sparkles } from "lucide-react";

interface ConfigDialogProps {
  open: boolean;
  onFechar: () => void;
  mensagem: string;
  mensagemRenovacao: string;
  pixKey: string;
  pixNome: string;
  pixCidade: string;
  mpAccessToken: string;
  whatsappGestor: string;
  zapiInstanceId: string;
  zapiToken: string;
  onSalvar: (data: {
    mensagemCobranca: string;
    mensagemRenovacao: string;
    pixKey: string;
    pixNome: string;
    pixCidade: string;
    mpAccessToken: string;
    whatsappGestor: string;
    zapiInstanceId: string;
    zapiToken: string;
  }) => void;
}

type TabConfig = "mensagens" | "whatsapp" | "pagamentos" | "alertas";

export function ConfigDialog({
  open,
  onFechar,
  mensagem,
  mensagemRenovacao,
  pixKey,
  pixNome,
  pixCidade,
  mpAccessToken,
  whatsappGestor,
  zapiInstanceId,
  zapiToken,
  onSalvar,
}: ConfigDialogProps) {
  const [activeTab, setActiveTab] = useState<TabConfig>("mensagens");
  const [msgCobranca, setMsgCobranca] = useState(mensagem);
  const [msgRenovacaoState, setMsgRenovacaoState] = useState(mensagemRenovacao);
  const [pixKeyState, setPixKeyState] = useState(pixKey);
  const [pixNomeState, setPixNomeState] = useState(pixNome);
  const [pixCidadeState, setPixCidadeState] = useState(pixCidade);
  const [mpAccessTokenState, setMpAccessTokenState] = useState(mpAccessToken);
  const [whatsappGestorState, setWhatsappGestorState] = useState(whatsappGestor);
  const [zapiInstanceIdState, setZapiInstanceIdState] = useState(zapiInstanceId);
  const [zapiTokenState, setZapiTokenState] = useState(zapiToken);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem("esa_email_alerts");
      setEmailAlerts(saved !== "0");
      setMsgCobranca(mensagem);
      setMsgRenovacaoState(mensagemRenovacao);
      setPixKeyState(pixKey);
      setPixNomeState(pixNome);
      setPixCidadeState(pixCidade);
      setMpAccessTokenState(mpAccessToken);
      setWhatsappGestorState(whatsappGestor);
      setZapiInstanceIdState(zapiInstanceId);
      setZapiTokenState(zapiToken);
    }
  }, [open, mensagem, mensagemRenovacao, pixKey, pixNome, pixCidade, mpAccessToken, whatsappGestor, zapiInstanceId, zapiToken]);

  function handleSalvar() {
    onSalvar({
      mensagemCobranca: msgCobranca.trim() || DEFAULT_COBRANCA_MSG,
      mensagemRenovacao: msgRenovacaoState.trim() || DEFAULT_RENOVACAO_MSG,
      pixKey: pixKeyState.trim(),
      pixNome: pixNomeState.trim(),
      pixCidade: pixCidadeState.trim(),
      mpAccessToken: mpAccessTokenState.trim(),
      whatsappGestor: whatsappGestorState.trim(),
      zapiInstanceId: zapiInstanceIdState.trim(),
      zapiToken: zapiTokenState.trim(),
    });
    localStorage.setItem("esa_email_alerts", emailAlerts ? "1" : "0");
    onFechar();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Configurações do Gestor
          </DialogTitle>
        </DialogHeader>

        {/* Abas Superiores */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("mensagens")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "mensagens"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Mensagens
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "whatsapp"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            WhatsApp & Z-API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pagamentos")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "pagamentos"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Mercado Pago & Pix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("alertas")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "alertas"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            Alertas
          </button>
        </div>

        {/* ABA: MENSAGENS */}
        {activeTab === "mensagens" && (
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label className="text-blue-600 font-bold text-sm">Mensagem de Cobrança (WhatsApp)</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Variáveis: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{cliente}"}</code>,{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{app}"}</code>,{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{valor}"}</code> e{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{link}"}</code>
              </p>
              <textarea
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[90px] transition-all"
                value={msgCobranca}
                onChange={(e) => setMsgCobranca(e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={() => setMsgCobranca(DEFAULT_COBRANCA_MSG)} className="self-start text-xs text-slate-500">
                Restaurar padrão
              </Button>
            </div>

            <div className="grid gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Label className="text-emerald-600 font-bold text-sm">Mensagem de Renovação Confirmada</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Variáveis: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{cliente}"}</code>,{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{app}"}</code>,{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{usuario}"}</code> e{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{vencimento}"}</code>
              </p>
              <textarea
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[90px] transition-all"
                value={msgRenovacaoState}
                onChange={(e) => setMsgRenovacaoState(e.target.value)}
              />
              <Button variant="ghost" size="sm" onClick={() => setMsgRenovacaoState(DEFAULT_RENOVACAO_MSG)} className="self-start text-xs text-slate-500">
                Restaurar padrão
              </Button>
            </div>
          </div>
        )}

        {/* ABA: WHATSAPP & Z-API */}
        {activeTab === "whatsapp" && (
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label className="text-blue-600 font-bold text-sm">WhatsApp do Gestor (Receber Comprovantes)</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Número para onde os clientes enviarão os comprovantes (com DDD, ex: 5511999999999).
              </p>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                placeholder="Ex: 5511999999999"
                value={whatsappGestorState}
                onChange={(e) => setWhatsappGestorState(e.target.value)}
              />
            </div>

            <div className="grid gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Label className="text-blue-600 font-bold text-sm">Disparo Automático via Z-API</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Credenciais da Z-API para envio de mensagens sem precisar abrir guias externas. Deixe em branco para usar o WhatsApp Web padrão.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs text-slate-500">ID da Instância</Label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                    placeholder="Ex: 3F711A..."
                    value={zapiInstanceIdState}
                    onChange={(e) => setZapiInstanceIdState(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-slate-500">Token da Instância</Label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                    placeholder="Ex: B07898..."
                    value={zapiTokenState}
                    onChange={(e) => setZapiTokenState(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: PAGAMENTOS & PIX */}
        {activeTab === "pagamentos" && (
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label className="text-blue-600 font-bold text-sm">Mercado Pago (Pix Automático)</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access Token de produção do Mercado Pago para gerar QR Codes dinâmicos com baixa e renovação automática.
              </p>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-mono"
                placeholder="APP_USR-..."
                value={mpAccessTokenState}
                onChange={(e) => setMpAccessTokenState(e.target.value)}
              />
            </div>

            <div className="grid gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Label className="text-blue-600 font-bold text-sm">Chave Pix Manual (Fallback)</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Utilizado se o Mercado Pago não estiver configurado.
              </p>
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Label className="text-xs text-slate-500">Chave Pix</Label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                    placeholder="E-mail, CPF, Telefone ou Chave Aleatória"
                    value={pixKeyState}
                    onChange={(e) => setPixKeyState(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1">
                    <Label className="text-xs text-slate-500">Nome do Beneficiário</Label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                      placeholder="Ex: Joao da Silva"
                      value={pixNomeState}
                      onChange={(e) => setPixNomeState(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-slate-500">Cidade</Label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                      placeholder="Ex: Sao Paulo"
                      value={pixCidadeState}
                      onChange={(e) => setPixCidadeState(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: ALERTAS */}
        {activeTab === "alertas" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <input
                id="email-alerts-toggle"
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="mt-1 h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <div>
                <Label htmlFor="email-alerts-toggle" className="cursor-pointer font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Receber alertas diários por e-mail
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Envia um relatório matinal de vencimentos e clientes atrasados diretamente para o e-mail cadastrado na conta.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" className="rounded-xl" onClick={onFechar}>Cancelar</Button>
          <Button className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={handleSalvar}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
