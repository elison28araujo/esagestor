import { NextResponse } from "next/server";
import { adminDb, admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userEmail, texto, remetente = "user", remetenteEmail } = body;

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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro na API de suporte:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno ao processar mensagem de suporte." },
      { status: 500 }
    );
  }
}
