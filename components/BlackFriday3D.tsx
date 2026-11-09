"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Sparkles, Tv, Flame, ShieldCheck, Zap } from "lucide-react";

/**
 * Componente que adiciona efeito 3D Tilt interativo ao mover o mouse
 */
export function Card3DTilt({
  children,
  className = "",
  maxTilt = 12,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTilt({ x: rotateX, y: rotateY });
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`perspective-1000 transition-transform duration-200 ease-out ${className}`}
      style={{
        transform: isHovered
          ? `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
          : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Mockup de Smart TV 3D em perspectiva isométrica com cena de transmissão
 */
export function MockupTV3D() {
  return (
    <div className="relative w-full max-w-lg mx-auto perspective-2000 py-6 select-none">
      {/* Sombra 3D projetada no piso */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/5 h-6 bg-black/80 rounded-full blur-lg pointer-events-none" />

      {/* Caixa 3D da TV */}
      <div className="relative animate-float-3d preserve-3d">
        {/* Moldura da TV em acabamento Titânio / Carbono */}
        <div className="relative rounded-[28px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-900 to-black shadow-[0_30px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.15)] border border-slate-700/80">
          
          {/* Luz LED traseira ambiente (Ambilight) */}
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-red-600/20 to-amber-500/20 rounded-[30px] blur-xl -z-10" />

          {/* Tela OLED */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-inner group">
            {/* Imagem em exibição na TV */}
            <img
              src="/filmes.jpg"
              alt="Transmissão ESA Play"
              className="w-full h-full object-cover brightness-95 contrast-105 group-hover:scale-105 transition duration-700"
            />

            {/* Reflexo de vidro na tela */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Interface Simulada de Smart TV */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-md bg-red-600/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                AO VIVO
              </span>
              <span className="rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                4K ULTRA HD
              </span>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-1">
              <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950 shadow-md">
                60 FPS
              </span>
            </div>

            {/* Barra de controle inferior */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <Play size={11} fill="currentColor" className="ml-0.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold leading-tight">ESA Play • Cinema & Futebol</p>
                  <p className="text-[9px] text-slate-400">Servidor VIP Ultra Estável</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={12} /> Sem Travamentos
              </span>
            </div>
          </div>

          {/* Logo discreto da TV na moldura inferior */}
          <div className="mt-1 flex items-center justify-center">
            <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
              ESA PLAY VISION 4K
            </span>
          </div>
        </div>

        {/* Base metálica da TV */}
        <div className="mx-auto w-28 h-3.5 bg-gradient-to-b from-slate-600 via-slate-800 to-black rounded-b-md shadow-md" />
        <div className="mx-auto w-44 h-1.5 bg-gradient-to-r from-transparent via-slate-500 to-transparent rounded-full shadow-sm" />

        {/* Badges Flutuantes em Relevo 3D ao redor da TV */}
        <div className="absolute -top-4 -left-4 sm:-left-8 bg-slate-900/90 backdrop-blur-md border border-amber-500/40 rounded-2xl p-2.5 shadow-2xl animate-float-slow flex items-center gap-2 text-xs">
          <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base font-bold">
            🔥
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-amber-500">Black Friday</p>
            <p className="text-xs font-bold text-white">Até 60% OFF</p>
          </div>
        </div>

        <div className="absolute -bottom-4 -right-2 sm:-right-6 bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-2.5 shadow-2xl animate-float-slow flex items-center gap-2 text-xs" style={{ animationDelay: "1.5s" }}>
          <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base font-bold">
            ⚡
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-wider text-emerald-400">Ativação Imediata</p>
            <p className="text-xs font-bold text-white">Teste 4h Grátis</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Contador Regressivo 3D para o fim da Black Friday
 */
export function Countdown3D() {
  const [timeLeft, setTimeLeft] = useState({
    dias: "02",
    horas: "14",
    minutos: "35",
    segundos: "50",
  });

  useEffect(() => {
    // Alvo: Fim do mês de novembro (ou contagem regressiva dinâmica de 3 dias recorrente)
    const now = new Date();
    const target = new Date();
    target.setDate(now.getDate() + 3);
    target.setHours(23, 59, 59, 0);

    const timer = setInterval(() => {
      const current = new Date();
      const diff = Math.max(0, target.getTime() - current.getTime());

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        dias: String(d).padStart(2, "0"),
        horas: String(h).padStart(2, "0"),
        minutos: String(m).padStart(2, "0"),
        segundos: String(s).padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const blocks = [
    { label: "DIAS", val: timeLeft.dias },
    { label: "HORAS", val: timeLeft.horas },
    { label: "MINUTOS", val: timeLeft.minutos },
    { label: "SEGUNDOS", val: timeLeft.segundos },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
      {blocks.map((b, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-amber-500/30 shadow-[0_10px_25px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            {/* Linha de reflexo central estilo visor digital 3D */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/80" />
            <span className="font-heading text-xl sm:text-2xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
              {b.val}
            </span>
          </div>
          <span className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Selo 3D de Black Friday em relevo
 */
export function BlackFridayBadge3D({ text = "BLACK FRIDAY 2026" }: { text?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-red-500/20 to-amber-500/20 p-1 border border-amber-500/40 shadow-lg shadow-amber-500/10 backdrop-blur-md">
      <div className="flex h-6 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-sm">
        <Flame size={13} fill="currentColor" />
        <span>{text}</span>
      </div>
      <span className="pr-2 text-[11px] font-bold text-amber-300">OFERTA LIMITADA</span>
    </div>
  );
}
