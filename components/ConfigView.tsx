"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_COBRANCA_MSG,
  DEFAULT_RENOVACAO_MSG,
  DEFAULT_REATIVACAO_MSG,
  REATIVACAO_TEMPLATES,
} from "@/lib/constants";
import { MessageSquare, Smartphone, CreditCard, Bell, Sparkles, Save } from "lucide-react";

interface ConfigViewProps {
  mensagem: string;
  mensagemRenovacao: string;
  mensagemReativacao?: string;
  pixKey: string;
  pixNome: string;
  pixCidade: string;
  mpAccessToken: string;
  whatsappGestor: string;
  zapiInstanceId: string;
  zapiToken: string;
  geminiApiKey?: string;
  onSalvar: (data: {
    mensagemCobranca: string;
    mensagemRenovacao: string;
    mensagemReativacao: string;
    pixKey: string;
    pixNome: string;
    pixCidade: string;
    mpAccessToken: string;
    whatsappGestor: string;
    zapiInstanceId: string;
    zapiToken: string;
    geminiApiKey: string;
  }) => void;
}

type TabConfig = "mensagens" | "whatsapp" | "pagamentos" | "ia" | "alertas";

export function ConfigView({
  mensagem,
  mensagemRenovacao,
  mensagemReativacao = DEFAULT_REATIVACAO_MSG,
  pixKey,
  pixNome,
  pixCidade,
  mpAccessToken,
  whatsappGestor,
  zapiInstanceId,
  zapiToken,
  geminiApiKey = "",
  onSalvar,
}: ConfigViewProps) {
  const [activeTab, setActiveTab] = useState<TabConfig>("mensagens");
  const [msgCobranca, setMsgCobranca] = useState(mensagem);
  const [msgRenovacaoState, setMsgRenovacaoState] = useState(mensagemRenovacao);
  const [msgReativacaoState, setMsgReativacaoState] = useState(mensagemReativacao);
  const [pixKeyState, setPixKeyState] = useState(pixKey);
  const [pixNomeState, setPixNomeState] = useState(pixNome);
  const [pixCidadeState, setPixCidadeState] = useState(pixCidade);
  const [mpAccessTokenState, setMpAccessTokenState] = useState(mpAccessToken);
  const [whatsappGestorState, setWhatsappGestorState] = useState(whatsappGestor);
  const [zapiInstanceIdState, setZapiInstanceIdState] = useState(zapiInstanceId);
  const [zapiTokenState, setZapiTokenState] = useState(zapiToken);
  const [geminiApiKeyState, setGeminiApiKeyState] = useState(geminiApiKey);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("esa_email_alerts");
    setEmailAlerts(saved !== "0");
  }, []);

  useEffect(() => {
    setMsgCobranca(mensagem);
    setMsgRenovacaoState(mensagemRenovacao);
    setMsgReativacaoState(mensagemReativacao || DEFAULT_REATIVACAO_MSG);
    setPixKeyState(pixKey);
    setPixNomeState(pixNome);
    setPixCidadeState(pixCidade);
    setMpAccessTokenState(mpAccessToken);
    setWhatsappGestorState(whatsappGestor);
    setZapiInstanceIdState(zapiInstanceId);
    setZapiTokenState(zapiToken);
    setGeminiApiKeyState(geminiApiKey || "");
  }, [
    mensagem,
    mensagemRenovacao,
    mensagemReativacao,
    pixKey,
    pixNome,
    pixCidade,
    mpAccessToken,
    whatsappGestor,
    zapiInstanceId,
    zapiToken,
    geminiApiKey,
  ]);

  function handleSalvar() {
    onSalvar({
      mensagemCobranca: msgCobranca.trim() || DEFAULT_COBRANCA_MSG,
      mensagemRenovacao: msgRenovacaoState.trim() || DEFAULT_RENOVACAO_MSG,
      mensagemReativacao: msgReativacaoState.trim() || DEFAULT_REATIVACAO_MSG,
      pixKey: pixKeyState.trim(),
      pixNome: pixNomeState.trim(),
      pixCidade: pixCidadeState.trim(),
      mpAccessToken: mpAccessTokenState.trim(),
      whatsappGestor: whatsappGestorState.trim(),
      zapiInstanceId: zapiInstanceIdState.trim(),
      zapiToken: zapiTokenState.trim(),
      geminiApiKey: geminiApiKeyState.trim(),
    });
    localStorage.setItem("esa_email_alerts", emailAlerts ? "1" : "0");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-heading font-bold tracking-tight text-slate-800 dark:text-slate-100">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Configurações do Gestor
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Personalize mensagens automáticas, WhatsApp/Z-API, pagamentos e alertas.
          </p>
        </div>

        <Button
          onClick={handleSalvar}
          className="gap-2 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700 self-start sm:self-auto"
        >
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      {/* Sub-abas */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("mensagens")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "mensagens"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Mensagens
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "whatsapp"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Smartphone className="h-4 w-4" />
          WhatsApp & Z-API
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pagamentos")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "pagamentos"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Mercado Pago & Pix
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ia")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "ia"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          IA (Gemini)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("alertas")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "alertas"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Bell className="h-4 w-4" />
          Alertas
        </button>
      </div>

      {/* ABA: MENSAGENS */}
      {activeTab === "mensagens" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70">
            <CardContent className="space-y-3 p-5">
              <Label className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                Mensagem de Cobrança (WhatsApp)
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Variáveis: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{cliente}"}</code>,{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{app}"}</code>,{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{valor}"}</code> e{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{link}"}</code>
              </p>
              <textarea
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] transition-all"
                value={msgCobranca}
                onChange={(e) => setMsgCobranca(e.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMsgCobranca(DEFAULT_COBRANCA_MSG)}
                className="text-xs text-slate-500"
              >
                Restaurar padrão
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70">
            <CardContent className="space-y-3 p-5">
              <Label className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                Mensagem de Renovação Confirmada
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Variáveis: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{cliente}"}</code>,{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{app}"}</code>,{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{usuario}"}</code> e{" "}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{"{vencimento}"}</code>
              </p>
              <textarea
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[120px] transition-all"
                value={msgRenovacaoState}
                onChange={(e) => setMsgRenovacaoState(e.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMsgRenovacaoState(DEFAULT_RENOVACAO_MSG)}
                className="text-xs text-slate-500"
              >
                Restaurar padrão
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70 lg:col-span-2">
            <CardContent className="space-y-3 p-5">
              <Label className="text-purple-600 dark:text-purple-400 font-bold text-sm">
                Mensagem de Reativação (Clientes que não renovam)
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clique em um modelo pronto ou personalize abaixo:
              </p>
              <div className="flex flex-wrap gap-2">
                {REATIVACAO_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setMsgReativacaoState(tpl.texto)}
                    className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800/60 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/40 transition"
                  >
                    {tpl.titulo}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[110px] transition-all"
                value={msgReativacaoState}
                onChange={(e) => setMsgReativacaoState(e.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMsgReativacaoState(DEFAULT_REATIVACAO_MSG)}
                className="text-xs text-slate-500"
              >
                Restaurar padrão
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ABA: WHATSAPP & Z-API */}
      {activeTab === "whatsapp" && (
        <Card className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70">
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-2">
              <Label className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                WhatsApp do Gestor (Receber Comprovantes)
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Número para onde os clientes enviarão os comprovantes (com DDD, ex: 5511999999999).
              </p>
              <input
                type="text"
                className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                placeholder="Ex: 5511999999999"
                value={whatsappGestorState}
                onChange={(e) => setWhatsappGestorState(e.target.value)}
              />
            </div>

            <div className="grid gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              <Label className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                Disparo Automático via Z-API
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Credenciais da Z-API para envio de mensagens sem precisar abrir guias externas. Deixe em branco para usar o WhatsApp Web padrão.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-slate-500">ID da Instância</Label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                    placeholder="Ex: 3F711A..."
                    value={zapiInstanceIdState}
                    onChange={(e) => setZapiInstanceIdState(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-slate-500">Token da Instância</Label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                    placeholder="Ex: B07898..."
                    value={zapiTokenState}
                    onChange={(e) => setZapiTokenState(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ABA: PAGAMENTOS & PIX */}
      {activeTab === "pagamentos" && (
        <Card className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70">
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-2">
              <Label className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                Mercado Pago (Pix e Cartão Automáticos)
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access Token de produção do Mercado Pago para gerar pagamentos com baixa e renovação automática.
              </p>
              <input
                type="password"
                className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all font-mono"
                placeholder="APP_USR-..."
                value={mpAccessTokenState}
                onChange={(e) => setMpAccessTokenState(e.target.value)}
              />
            </div>

            <div className="grid gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              <Label className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                Chave Pix Manual (Fallback)
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Utilizado se o Mercado Pago não estiver configurado.
              </p>
              <div className="grid gap-3 max-w-2xl">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-slate-500">Chave Pix</Label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                    placeholder="E-mail, CPF, Telefone ou Chave Aleatória"
                    value={pixKeyState}
                    onChange={(e) => setPixKeyState(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-slate-500">Nome do Beneficiário</Label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                      placeholder="Ex: Joao da Silva"
                      value={pixNomeState}
                      onChange={(e) => setPixNomeState(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-slate-500">Cidade</Label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all"
                      placeholder="Ex: Sao Paulo"
                      value={pixCidadeState}
                      onChange={(e) => setPixCidadeState(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ABA: IA (GEMINI) */}
      {activeTab === "ia" && (
        <Card className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70">
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-2 max-w-xl">
              <Label className="text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Chave de API do Google Gemini
              </Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cole sua chave do Google AI Studio (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">aistudio.google.com/apikey</code>). Ela fica salva com segurança e é usada apenas no servidor para gerar e variar suas mensagens de cobrança/reativação.
              </p>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono"
                placeholder="Cole sua API Key do Gemini aqui..."
                value={geminiApiKeyState}
                onChange={(e) => setGeminiApiKeyState(e.target.value)}
              />
              <p className="text-[11px] text-slate-400">
                Opcional: você também pode configurar a variável <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">GEMINI_API_KEY</code> diretamente nas Environment Variables da Vercel.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ABA: ALERTAS */}
      {activeTab === "alertas" && (
        <Card className="border-slate-200/80 dark:border-slate-800 dark:bg-slate-900/70">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 max-w-2xl">
              <input
                id="email-alerts-toggle-view"
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="mt-1 h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
              />
              <div>
                <Label
                  htmlFor="email-alerts-toggle-view"
                  className="cursor-pointer font-bold text-slate-800 dark:text-slate-200 text-sm"
                >
                  Receber alertas diários por e-mail
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Envia um relatório matinal de vencimentos e clientes atrasados diretamente para o e-mail cadastrado na conta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
