"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Dispara uma aparição temporária do Papai Noel animado (fundo transparente)
 * sempre que o número de mensagens aumenta após o carregamento inicial.
 */
export function usePapaiNoelMensagem(quantidadeMensagens: number, ativo = true, duracaoMs = 3800) {
  const [visivel, setVisivel] = useState(false);
  const inicializadoRef = useRef(false);
  const anteriorRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ativo) {
      setVisivel(false);
      return;
    }

    if (!inicializadoRef.current) {
      if (quantidadeMensagens > 0) {
        inicializadoRef.current = true;
        anteriorRef.current = quantidadeMensagens;
      }
      return;
    }

    if (quantidadeMensagens > anteriorRef.current) {
      setVisivel(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisivel(false);
      }, duracaoMs);
    }

    anteriorRef.current = quantidadeMensagens;
  }, [quantidadeMensagens, ativo, duracaoMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return visivel;
}

export function PapaiNoelChatOverlay({ visivel }: { visivel: boolean }) {
  if (!visivel) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-2 right-2 z-20 select-none animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <img
        src="/papai-noel.gif"
        alt="Papai Noel"
        className="h-28 w-auto object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
}
