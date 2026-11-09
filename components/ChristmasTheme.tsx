"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, X, Gift, Trees } from "lucide-react";

/**
 * Gorrinho de Papai Noel SVG vetorial ajustável
 */
export function SantaHat({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Corpo principal do gorro vermelho */}
      <path
        d="M20 72 C 18 42, 48 16, 76 26 C 84 29, 87 45, 76 52 C 68 57, 58 42, 45 46 C 30 52, 26 66, 20 72 Z"
        fill="#DC2626"
      />
      {/* Sombra / Profundidade no tecido vermelho */}
      <path
        d="M34 50 C 48 44, 64 54, 76 52 C 70 60, 52 60, 34 50 Z"
        fill="#991B1B"
        opacity="0.5"
      />
      {/* Faixa felpuda branca da base */}
      <rect
        x="12"
        y="68"
        width="60"
        height="18"
        rx="9"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      {/* Textura fofa na faixa branca */}
      <circle cx="22" cy="77" r="2" fill="#E2E8F0" opacity="0.6" />
      <circle cx="42" cy="77" r="2" fill="#E2E8F0" opacity="0.6" />
      <circle cx="62" cy="77" r="2" fill="#E2E8F0" opacity="0.6" />
      {/* Pompom branco felpudo na ponta */}
      <circle
        cx="78"
        cy="32"
        r="11"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      <circle cx="78" cy="32" r="7" fill="#F8FAFC" />
    </svg>
  );
}

/**
 * Cordão de Luzinhas de Natal (Pisca-Pisca Decorativo)
 */
export function ChristmasLights() {
  const bulbs = [
    { color: "bg-red-500 shadow-red-500/80", anim: "animate-pulse" },
    { color: "bg-emerald-400 shadow-emerald-400/80", anim: "animate-bounce" },
    { color: "bg-amber-300 shadow-amber-300/80", anim: "animate-pulse" },
    { color: "bg-blue-400 shadow-blue-400/80", anim: "animate-bounce" },
    { color: "bg-rose-500 shadow-rose-500/80", anim: "animate-pulse" },
    { color: "bg-green-400 shadow-green-400/80", anim: "animate-bounce" },
    { color: "bg-yellow-300 shadow-yellow-300/80", anim: "animate-pulse" },
    { color: "bg-purple-400 shadow-purple-400/80", anim: "animate-pulse" },
  ];

  return (
    <div className="relative w-full h-3 flex items-center justify-between px-2 overflow-hidden pointer-events-none select-none">
      {/* Linha/Fio verde escuro */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-emerald-950/40 dark:bg-emerald-600/30" />
      {bulbs.map((b, i) => (
        <span
          key={i}
          className={`relative z-10 block w-2 h-2 rounded-full shadow-[0_0_8px] transition-all duration-700 ${b.color} ${b.anim}`}
          style={{ animationDelay: `${i * 220}ms`, animationDuration: "1.8s" }}
        />
      ))}
    </div>
  );
}

/**
 * Efeito de Queda de Neve Suave (CSS puro, ultraleve)
 */
interface Flake {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function SnowEffect() {
  const [flakes, setFlakes] = useState<Flake[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Gera 26 flocos com posições e tempos distribuídos
    const generated: Flake[] = Array.from({ length: 26 }, (_, i) => ({
      id: i,
      left: Math.floor(Math.random() * 98) + 1,
      size: Math.floor(Math.random() * 5) + 3, // 3px a 7px
      duration: Math.floor(Math.random() * 8) + 8, // 8s a 16s
      delay: -(Math.random() * 12), // inicia já espalhado na tela
      opacity: Math.random() * 0.5 + 0.35, // 0.35 a 0.85
    }));
    setFlakes(generated);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none"
      aria-hidden="true"
    >
      {flakes.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white dark:bg-blue-100 shadow-[0_0_4px_rgba(255,255,255,0.8)] will-change-transform"
          style={{
            left: `${f.left}%`,
            top: "-15px",
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: f.opacity,
            animation: `snowfall ${f.duration}s linear infinite`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Banner de Boas Festas & Final de Ano para o Dashboard
 */
export function ChristmasDashboardBanner({
  onDismiss,
}: {
  onDismiss?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-600/10 via-amber-500/10 to-emerald-600/10 p-4 sm:p-5 shadow-sm backdrop-blur-sm dark:border-red-500/30 dark:from-red-950/40 dark:via-amber-950/20 dark:to-emerald-950/30">
      {/* Decorações sutis de fundo */}
      <div className="absolute -top-4 -right-4 w-28 h-28 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-4 -left-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-xl shadow-sm">
            🎄
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Clima de Fim de Ano no ESA Gestor!
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-300">
                <Sparkles size={11} /> Edição Natalina
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Desejamos a você um final de ano repleto de sucesso, grandes renovações e prosperidade no seu negócio! 🎅✨
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            title="Fechar aviso natalino"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
