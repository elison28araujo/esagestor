import { NextResponse } from "next/server";
import { adminDb, admin } from "@/lib/firebase-admin";

const ADMIN_EMAIL = "elison28araujo@gmail.com";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1]?.trim();
    if (!idToken) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    let decoded: { uid: string; email?: string };
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Sessão expirada ou token inválido." }, { status: 401 });
    }

    const body = await req.json();
    const { userId: bodyUserId, userEmail, texto, remetente: bodyRemetente = "user" } = body;

    const isAdmin = decoded.email === ADMIN_EMAIL;
    const remetente: "user" | "admin" = isAdmin && bodyRemetente === "admin" ? "admin" : "user";
    const userId = remetente === "admin" ? String(bodyUserId || "").trim() : decoded.uid;
    const remetenteEmail = decoded.email || "";

    if (!userId || !texto?.trim()) {
      return NextResponse.json(
        { error: "userId e texto são obrigatórios." },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin não configurado no servidor. Por favor, atualize as regras de segurança no Firebase Console." },
        { status: 503 }
      );
    }

    const textoFinal = texto.trim();
    const conversaRef = adminDb.collection("suporte_conversas").doc(userId);

    // 1. Atualizar ou criar metadados da conversa
    const updateData: any = {
      userId,
      userEmail: userEmail || "",
      ultimaMensagem: textoFinal,
      ultimaMensagemTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      remetenteUltima: remetente,
      updatedAt: new Date().toISOString(),
    };

    if (remetente === "admin") {
      updateData.naoLidasUser = admin.firestore.FieldValue.increment(1);
      updateData.naoLidasAdmin = 0;
    } else {
      updateData.naoLidasAdmin = admin.firestore.FieldValue.increment(1);
    }

    await conversaRef.set(updateData, { merge: true });

    // 2. Adicionar mensagem na subcoleção
    await conversaRef.collection("mensagens").add({
      texto: textoFinal,
      remetente,
      remetenteEmail: remetenteEmail || userEmail || "",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      lida: false,
    });

    // 3. Enviar notificação Web Push (FCM) para o destinatário
    try {
      const targetDocs: FirebaseFirestore.DocumentSnapshot[] = [];
      if (remetente === "admin") {
        const snap = await adminDb.collection("suporte_push_tokens").doc(userId).get();
        if (snap.exists) targetDocs.push(snap);
      } else {
        const adminsSnap = await adminDb
          .collection("suporte_push_tokens")
          .where("isAdmin", "==", true)
          .get();
        adminsSnap.forEach((d) => targetDocs.push(d));
      }

      const title =
        remetente === "admin"
          ? "Suporte ESAGESTOR"
          : `Nova mensagem de ${userEmail || "Revendedor"}`;

      for (const targetDoc of targetDocs) {
        const tokens = (targetDoc.data()?.tokens as string[] | undefined) || [];
        if (tokens.length === 0) continue;

        const resp = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title,
            body: textoFinal.slice(0, 180),
          },
          data: {
            link: "/admin",
            userId,
          },
          webpush: {
            fcmOptions: { link: "/admin" },
            notification: {
              icon: "/icon-192x192.png",
              badge: "/icon-192x192.png",
            },
          },
        });

        // Limpa tokens expirados/inválidos
        const invalidTokens: string[] = [];
        resp.responses.forEach((r, idx) => {
          if (
            !r.success &&
            (r.error?.code === "messaging/registration-token-not-registered" ||
              r.error?.code === "messaging/invalid-registration-token")
          ) {
            invalidTokens.push(tokens[idx]);
          }
        });
        if (invalidTokens.length > 0) {
          await targetDoc.ref.update({
            tokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
          });
        }
      }
    } catch (pushErr) {
      console.warn("Aviso ao enviar Web Push do suporte:", pushErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro na API de suporte:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno ao processar mensagem de suporte." },
      { status: 500 }
    );
  }
}
