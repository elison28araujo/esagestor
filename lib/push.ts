"use client";

import { getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

/**
 * Toca um bip discreto de notificação usando Web Audio API (sem arquivo externo).
 */
export function tocarSomNotificacao() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // Ignora caso o navegador bloqueie áudio antes de interação
  }
}

export async function registrarPushSuporte(params: {
  userId: string;
  email?: string | null;
  isAdmin?: boolean;
  solicitarPermissao?: boolean;
}): Promise<{ ok: boolean; permission: NotificationPermission | "unsupported"; reason?: string }> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return { ok: false, permission: "unsupported", reason: "Navegador sem suporte a notificações." };
  }

  let permission = Notification.permission;
  if (permission === "default" && params.solicitarPermissao) {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return { ok: false, permission, reason: "Permissão de notificação não concedida." };
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return { ok: false, permission, reason: "NEXT_PUBLIC_FIREBASE_VAPID_KEY não configurada." };
  }

  const supported = await isSupported().catch(() => false);
  const app = getApps()[0];
  if (!supported || !app) {
    return { ok: false, permission, reason: "Firebase Messaging não suportado neste navegador." };
  }

  try {
    const query = new URLSearchParams({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    });

    const swReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query.toString()}`, {
      scope: "/firebase-cloud-messaging-push-scope",
    });

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });

    if (!token) {
      return { ok: false, permission, reason: "Não foi possível obter token FCM." };
    }

    await fetch("/api/suporte/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: params.userId,
        email: params.email || "",
        isAdmin: Boolean(params.isAdmin),
        token,
      }),
    });

    return { ok: true, permission };
  } catch (err) {
    console.warn("Erro ao registrar Web Push:", err);
    return { ok: false, permission, reason: "Erro ao registrar token push." };
  }
}

export async function escutarPushEmPrimeiroPlano(
  onReceber: (payload: { title: string; body: string }) => void
): Promise<() => void> {
  if (typeof window === "undefined") return () => {};
  const supported = await isSupported().catch(() => false);
  const app = getApps()[0];
  if (!supported || !app) return () => {};

  const messaging = getMessaging(app);
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title || "Nova mensagem no suporte";
    const body = payload.notification?.body || "";
    onReceber({ title, body });
  });
}
