"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  Check,
  CheckCheck,
  Sparkles,
  ExternalLink,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SantaHat } from "@/components/ChristmasTheme";
import { MensagemSuporte, ConversaSuporte } from "@/lib/types";

interface SuporteChatWidgetProps {
  user: FirebaseUser | null;
  christmasMode?: boolean;
}

export function SuporteChatWidget({ user, christmasMode = false }: SuporteChatWidgetProps) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemSuporte[]>([]);
  const [conversa, setConversa] = useState<ConversaSuporte | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [temNaoLida, setTemNaoLida] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escutar metadados da conversa do usuário atual
  useEffect(() => {
    if (!user || !db) return;

    const conversaRef = doc(db, "suporte_conversas", user.uid);
    const unsubConversa = onSnapshot(conversaRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConversa({
          id: snapshot.id,
          userId: data.userId || user.uid,
          userEmail: data.userEmail || user.email || "",
          userWhatsapp: data.userWhatsapp || "",
          ultimaMensagem: data.ultimaMensagem || "",
          ultimaMensagemTimestamp: data.ultimaMensagemTimestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          remetenteUltima: data.remetenteUltima || "user",
          naoLidasAdmin: data.naoLidasAdmin || 0,
          naoLidasUser: data.naoLidasUser || 0,
          updatedAt: data.updatedAt || "",
        });
        setTemNaoLida(data.naoLidasUser || 0);
      }
    });

    return () => unsubConversa();
  }, [user]);

  // Escutar lista de mensagens em tempo real quando o chat existir
  useEffect(() => {
    if (!user || !db) return;

    const mensagensRef = collection(db, "suporte_conversas", user.uid, "mensagens");
    const q = query(mensagensRef, orderBy("timestamp", "asc"));

    const unsubMensagens = onSnapshot(q, (snapshot) => {
      const msgs: MensagemSuporte[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        let tsStr = new Date().toISOString();
        if (d.timestamp instanceof Timestamp) {
          tsStr = d.timestamp.toDate().toISOString();
        } else if (d.timestamp?.toDate) {
          tsStr = d.timestamp.toDate().toISOString();
        } else if (typeof d.timestamp === "string") {
          tsStr = d.timestamp;
        }

        return {
          id: docSnap.id,
          texto: d.texto || "",
          remetente: d.remetente || "user",
          remetenteEmail: d.remetenteEmail || "",
          timestamp: tsStr,
          lida: !!d.lida,
        };
      });

      setMensagens(msgs);
    });

    return () => unsubMensagens();
  }, [user]);

  // Rolar para a última mensagem automaticamente
  useEffect(() => {
    if (aberto) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens, aberto]);

  // Quando o usuário abre o chat, zerar o contador de mensagens não lidas dele
  useEffect(() => {
    if (!aberto || !user || !db || temNaoLida === 0) return;

    const conversaRef = doc(db, "suporte_conversas", user.uid);
    updateDoc(conversaRef, {
      naoLidasUser: 0,
    }).catch(() => {
      // silencioso se o documento ainda não existir
    });
    setTemNaoLida(0);
  }, [aberto, user, temNaoLida]);

  if (!user) return null;

  async function handleEnviar(msgTexto?: string) {
    const textoFinal = (msgTexto || texto).trim();
    if (!textoFinal || !user || !db || enviando) return;

    setEnviando(true);
    try {
      const conversaRef = doc(db, "suporte_conversas", user.uid);
      const mensagensCol = collection(db, "suporte_conversas", user.uid, "mensagens");

      // Adicionar mensagem
      await addDoc(mensagensCol, {
        texto: textoFinal,
        remetente: "user",
        remetenteEmail: user.email || "",
        timestamp: serverTimestamp(),
        lida: false,
      });

      // Atualizar / Criar conversa master
      const atualizacao: any = {
        userId: user.uid,
        userEmail: user.email || "",
        ultimaMensagem: textoFinal,
        ultimaMensagemTimestamp: serverTimestamp(),
        remetenteUltima: "user",
        updatedAt: new Date().toISOString(),
        naoLidasAdmin: (conversa?.naoLidasAdmin || 0) + 1,
      };

      await setDoc(conversaRef, atualizacao, { merge: true });
      setTexto("");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setEnviando(false);
    }
  }

  function formatarHora(isoString: string) {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  const sugestoes = [
    "Preciso de ajuda com renovação",
    "Como cadastrar cliente?",
    "Dúvida sobre servidor",
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Janela de Chat Aberta */}
      {aberto && (
        <div className="mb-3 flex h-[490px] w-[92vw] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-[#0c101b] sm:w-[380px] animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Cabeçalho do Chat */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 py-3 text-white dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                {christmasMode && (
                  <div className="absolute -top-2.5 -left-2 pointer-events-none select-none">
                    <SantaHat className="w-5 h-5 -rotate-12 drop-shadow" />
                  </div>
                )}
                <Headphones size={18} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading text-sm font-bold tracking-tight">Suporte ADM</h3>
                  {christmasMode && <span className="text-xs">🎄</span>}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-blue-100/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Atendimento ao Revendedor</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href="https://wa.me/5591985066711?text=Olá!%20Sou%20usuário%20do%20ESA%20Gestor%20e%20preciso%20de%20suporte."
                target="_blank"
                rel="noreferrer"
                title="Falar no WhatsApp Oficial"
                className="rounded-lg p-1.5 text-blue-100 transition hover:bg-white/10 hover:text-white"
              >
                <Phone size={16} />
              </a>
              <button
                onClick={() => setAberto(false)}
                className="rounded-lg p-1.5 text-blue-100 transition hover:bg-white/10 hover:text-white"
                title="Minimizar chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/70 dark:bg-[#070a12]/70 text-xs">
            {/* Mensagem de Boas-vindas inicial */}
            <div className="flex gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-[10px]">
                E
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm border border-slate-100 dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                <p className="font-semibold text-[11px] text-blue-600 dark:text-blue-400 mb-1">
                  Suporte ESA Gestor
                </p>
                <p className="leading-relaxed">
                  Olá! Como podemos ajudar você hoje? Mande sua dúvida ou solicitação abaixo e o suporte ADM responderá diretamente aqui.
                </p>
                <span className="mt-1 block text-[10px] text-slate-400 text-right">Online</span>
              </div>
            </div>

            {/* Mensagens trocadas */}
            {mensagens.map((m) => {
              const souEu = m.remetente === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${souEu ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm leading-relaxed ${
                      souEu
                        ? "rounded-tr-sm bg-blue-600 text-white dark:bg-blue-600"
                        : "rounded-tl-sm bg-white border border-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    {!souEu && (
                      <p className="font-bold text-[10px] text-blue-600 dark:text-blue-400 mb-0.5">
                        ADM Suporte
                      </p>
                    )}
                    <p className="break-words whitespace-pre-wrap">{m.texto}</p>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                        souEu ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      <span>{formatarHora(m.timestamp)}</span>
                      {souEu && <CheckCheck size={12} />}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas (quando poucas mensagens) */}
          {mensagens.length < 2 && (
            <div className="flex gap-1.5 overflow-x-auto px-3 py-1.5 bg-white dark:bg-[#0c101b] border-t border-slate-100 dark:border-slate-800/80">
              {sugestoes.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleEnviar(sug)}
                  className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Campo de Envio */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEnviar();
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-[#0c101b]"
          >
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Digite sua mensagem para o suporte..."
              className="h-9 flex-1 text-xs rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 focus-visible:ring-1 focus-visible:ring-blue-500"
              disabled={enviando}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!texto.trim() || enviando}
              className="h-9 w-9 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95"
              title="Enviar mensagem"
            >
              <Send size={15} />
            </Button>
          </form>
        </div>
      )}

      {/* Botão Flutuante (Disparador do Chat) */}
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="group relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
        title={aberto ? "Fechar Chat de Suporte" : "Falar com Suporte ADM"}
      >
        {/* Gorrinho no botão se modo natalino ativo */}
        {christmasMode && (
          <div className="absolute -top-3.5 -left-2.5 pointer-events-none select-none">
            <SantaHat className="w-7 h-7 -rotate-12 drop-shadow-md" />
          </div>
        )}

        {aberto ? (
          <X size={24} className="transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <MessageCircle size={24} className="transition-transform group-hover:scale-110 duration-200" />
        )}

        {/* Badge de Mensagens Não Lidas */}
        {temNaoLida > 0 && !aberto && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
            {temNaoLida}
          </span>
        )}
      </button>
    </div>
  );
}
