"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
} from "firebase/firestore";
import {
  Headphones,
  Search,
  MessageSquare,
  Send,
  User,
  Phone,
  Clock,
  CheckCheck,
  Sparkles,
  Inbox,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConversaSuporte, MensagemSuporte } from "@/lib/types";

interface AdminSuporteViewProps {
  adminEmail: string;
}

export function AdminSuporteView({ adminEmail }: AdminSuporteViewProps) {
  const [conversas, setConversas] = useState<ConversaSuporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [conversaAtiva, setConversaAtiva] = useState<ConversaSuporte | null>(null);
  const [mensagens, setMensagens] = useState<MensagemSuporte[]>([]);
  const [textoResposta, setTextoResposta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escutar todas as conversas de suporte em tempo real
  useEffect(() => {
    if (!db) return;

    const conversasCol = collection(db, "suporte_conversas");
    const q = query(conversasCol, orderBy("updatedAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const lista: ConversaSuporte[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          let tsStr = new Date().toISOString();
          if (d.ultimaMensagemTimestamp instanceof Timestamp) {
            tsStr = d.ultimaMensagemTimestamp.toDate().toISOString();
          } else if (d.ultimaMensagemTimestamp?.toDate) {
            tsStr = d.ultimaMensagemTimestamp.toDate().toISOString();
          } else if (typeof d.ultimaMensagemTimestamp === "string") {
            tsStr = d.ultimaMensagemTimestamp;
          }

          return {
            id: docSnap.id,
            userId: d.userId || docSnap.id,
            userEmail: d.userEmail || "Sem email",
            userWhatsapp: d.userWhatsapp || "",
            ultimaMensagem: d.ultimaMensagem || "",
            ultimaMensagemTimestamp: tsStr,
            remetenteUltima: d.remetenteUltima || "user",
            naoLidasAdmin: d.naoLidasAdmin || 0,
            naoLidasUser: d.naoLidasUser || 0,
            updatedAt: d.updatedAt || "",
          };
        });

        setConversas(lista);
        setLoading(false);

        // Atualizar referência da conversa ativa se já estiver aberta
        setConversaAtiva((prev) => {
          if (!prev) return null;
          return lista.find((c) => c.id === prev.id) || prev;
        });
      },
      (err) => {
        console.error("Erro ao carregar conversas de suporte:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Escutar mensagens da conversa ativa
  const activeId = conversaAtiva?.id;
  const activeNaoLidas = conversaAtiva?.naoLidasAdmin;

  useEffect(() => {
    if (!db || !activeId) {
      setMensagens([]);
      return;
    }

    const mensagensCol = collection(db, "suporte_conversas", activeId, "mensagens");
    const q = query(mensagensCol, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
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

    // Ao abrir conversa, zerar mensagens não lidas pelo admin
    if (activeNaoLidas && activeNaoLidas > 0) {
      const conversaRef = doc(db, "suporte_conversas", activeId);
      updateDoc(conversaRef, { naoLidasAdmin: 0 }).catch(() => {});
    }

    return () => unsub();
  }, [activeId, activeNaoLidas]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function handleEnviarResposta() {
    const textoFinal = textoResposta.trim();
    if (!textoFinal || !db || !conversaAtiva || enviando) return;

    setEnviando(true);
    try {
      const conversaRef = doc(db, "suporte_conversas", conversaAtiva.id);
      const mensagensCol = collection(db, "suporte_conversas", conversaAtiva.id, "mensagens");

      await addDoc(mensagensCol, {
        texto: textoFinal,
        remetente: "admin",
        remetenteEmail: adminEmail,
        timestamp: serverTimestamp(),
        lida: false,
      });

      await updateDoc(conversaRef, {
        ultimaMensagem: textoFinal,
        ultimaMensagemTimestamp: serverTimestamp(),
        remetenteUltima: "admin",
        naoLidasAdmin: 0,
        naoLidasUser: increment(1),
        updatedAt: new Date().toISOString(),
      });

      setTextoResposta("");
    } catch (err) {
      console.error("Erro ao enviar resposta do suporte:", err);
    } finally {
      setEnviando(false);
    }
  }

  function formatarDataHora(isoString: string) {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      const hoje = new Date();
      const mesmoDia = d.toDateString() === hoje.toDateString();
      if (mesmoDia) {
        return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      }
      return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return "";
    }
  }

  const conversasFiltradas = conversas.filter((c) =>
    c.userEmail.toLowerCase().includes(busca.toLowerCase()) ||
    c.ultimaMensagem.toLowerCase().includes(busca.toLowerCase())
  );

  const totalNaoLidas = conversas.reduce((acc, c) => acc + (c.naoLidasAdmin || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header da Central */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-heading font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Central de Atendimento ao Vivo
            </h2>
            {totalNaoLidas > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                {totalNaoLidas} pendente{totalNaoLidas > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comunicação direta em tempo real com todos os revendedores do ESA Gestor.
          </p>
        </div>
      </div>

      {/* Grid Principal: Lista à esquerda + Chat à direita */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[650px] max-h-[80vh]">
        {/* Coluna da Esquerda: Lista de Conversas (4 colunas) */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#0c101b] overflow-hidden">
          {/* Campo de Busca */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar usuário ou mensagem..."
                className="h-8 pl-8 text-xs rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          </div>

          {/* Lista de Usuários */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Carregando conversas...</div>
            ) : conversasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">Nenhum chamado aberto</p>
                <p className="text-[11px] text-slate-400">Quando os revendedores mandarem mensagem no chat, elas aparecerão aqui.</p>
              </div>
            ) : (
              conversasFiltradas.map((conv) => {
                const isSelected = conversaAtiva?.id === conv.id;
                const temNaoLida = conv.naoLidasAdmin > 0;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setConversaAtiva(conv)}
                    className={`flex w-full items-start gap-3 p-3.5 text-left transition-colors ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600"
                        : "hover:bg-slate-50/70 dark:hover:bg-slate-900/40"
                    }`}
                  >
                    {/* Avatar com inicial */}
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {conv.userEmail.charAt(0).toUpperCase()}
                      {temNaoLida && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-[#0c101b]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`truncate text-xs ${temNaoLida ? "font-bold text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-300"}`}>
                          {conv.userEmail}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatarDataHora(conv.ultimaMensagemTimestamp)}
                        </span>
                      </div>

                      <p className={`truncate text-[11px] ${temNaoLida ? "font-medium text-slate-800 dark:text-slate-200" : "text-slate-400"}`}>
                        {conv.remetenteUltima === "admin" && (
                          <span className="text-blue-600 dark:text-blue-400 mr-1">Você:</span>
                        )}
                        {conv.ultimaMensagem || "Conversa iniciada"}
                      </p>

                      {temNaoLida && (
                        <div className="mt-1 flex items-center justify-end">
                          <span className="rounded-full bg-red-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                            {conv.naoLidasAdmin} nova{conv.naoLidasAdmin > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna da Direita: Área do Chat Ativo (8 colunas) */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#0c101b] overflow-hidden">
          {conversaAtiva ? (
            <>
              {/* Header do Chat Selecionado */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm">
                    {conversaAtiva.userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                      {conversaAtiva.userEmail}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">UID: {conversaAtiva.userId}</p>
                  </div>
                </div>

                {conversaAtiva.userWhatsapp && (
                  <a
                    href={`https://wa.me/55${conversaAtiva.userWhatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 transition"
                  >
                    <Phone size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Corpo de Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-[#070a12]/50 text-xs">
                {mensagens.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    Aguardando mensagem do revendedor...
                  </div>
                ) : (
                  mensagens.map((m) => {
                    const souEu = m.remetente === "admin";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${souEu ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 shadow-sm leading-relaxed ${
                            souEu
                              ? "rounded-tr-sm bg-blue-600 text-white dark:bg-blue-600"
                              : "rounded-tl-sm bg-white border border-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap">{m.texto}</p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${
                              souEu ? "text-blue-100" : "text-slate-400"
                            }`}
                          >
                            <span>{formatarDataHora(m.timestamp)}</span>
                            {souEu && <CheckCheck size={12} />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Campo de Resposta */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEnviarResposta();
                }}
                className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-[#0c101b]"
              >
                <Input
                  value={textoResposta}
                  onChange={(e) => setTextoResposta(e.target.value)}
                  placeholder={`Responder para ${conversaAtiva.userEmail}...`}
                  className="h-10 flex-1 text-xs rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 focus-visible:ring-1 focus-visible:ring-blue-500"
                  disabled={enviando}
                />
                <Button
                  type="submit"
                  disabled={!textoResposta.trim() || enviando}
                  className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1.5 transition active:scale-95"
                >
                  <Send size={15} />
                  <span>Enviar</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <MessageSquare size={26} />
              </div>
              <h4 className="font-heading font-bold text-slate-700 dark:text-slate-300">
                Selecione uma conversa ao lado
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Clique em qualquer revendedor na lista para ver o histórico e responder às dúvidas em tempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
