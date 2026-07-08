"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Copy, Check, LogOut, MessageSquare } from "lucide-react";

interface TelaLicencaBloqueadaProps {
  email: string;
  codigo: string;
  status: "pending" | "active" | "blocked";
  vencimentoLicenca?: string;
  onLogout: () => void;
}

export function TelaLicencaBloqueada({
  email,
  codigo,
  status,
  vencimentoLicenca,
  onLogout,
}: TelaLicencaBloqueadaProps) {
  const [copied, setCopied] = useState(false);

  function handleCopiar() {
    navigator.clipboard.writeText(codigo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Obter título e descrição baseados no status e expiração
  const isVencido = status === "active" && vencimentoLicenca && new Date(vencimentoLicenca) < new Date();
  
  let titulo = "Aguardando Ativação";
  let descricao = "Sua conta foi criada com sucesso! Para começar a usar o painel, envie o código de ativação abaixo para o administrador liberar seu acesso.";
  let alertStyle = "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
  
  if (status === "blocked") {
    titulo = "Acesso Bloqueado";
    descricao = "O seu acesso a este painel administrativo foi suspenso. Entre em contato com o suporte para entender o motivo e reativar sua conta.";
    alertStyle = "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400";
  } else if (isVencido) {
    titulo = "Assinatura Vencida";
    descricao = `Sua licença mensal venceu em ${new Date(vencimentoLicenca!).toLocaleDateString("pt-BR")}. Efetue o pagamento e forneça seu código de ativação para renovar o acesso por mais 30 dias.`;
    alertStyle = "bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400";
  }

  const telefoneSuporte = "5591985066711"; // WhatsApp do Administrador Master
  
  function handleEnviarWhatsApp() {
    let msg = `Olá! Criei minha conta no ESA Gestor (Email: ${email}). Meu código de ativação é: *${codigo}*. Pode fazer a liberação?`;
    if (status === "blocked") {
      msg = `Olá! Meu acesso ao ESA Gestor foi bloqueado. Código: *${codigo}* (Email: ${email}). Gostaria de entender o motivo e reativar.`;
    } else if (isVencido) {
      msg = `Olá! Gostaria de renovar minha assinatura mensal do ESA Gestor. Código: *${codigo}* (Email: ${email}).`;
    }
    window.open(`https://wa.me/${telefoneSuporte}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <Card className="w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          
          {/* Ícone Animado de Cadeado */}
          <div className="flex justify-center">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center shadow-inner ${alertStyle}`}>
              <Lock className="h-7 w-7 animate-bounce" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{titulo}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{descricao}</p>
          </div>

          {/* Cartão de Código de Ativação */}
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col items-center justify-center gap-2 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Seu Código de Ativação</span>
            <div className="flex items-center gap-3">
              <span className="text-xl font-mono font-black text-blue-600 dark:text-blue-400 tracking-wider">{codigo}</span>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleCopiar} 
                className={`h-9 w-9 rounded-xl transition ${copied ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" : "text-slate-400"}`}
              >
                {copied ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <Button 
              onClick={handleEnviarWhatsApp}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.01]"
            >
              <MessageSquare className="h-5 w-5" />
              {status === "pending" ? "Enviar Código no WhatsApp" : "Falar com Suporte"}
            </Button>

            <Button 
              variant="outline" 
              onClick={onLogout}
              className="w-full h-11 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </Button>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-400">Logado como: {email}</span>
          </div>

        </CardContent>
      </Card>
    </main>
  );
}
