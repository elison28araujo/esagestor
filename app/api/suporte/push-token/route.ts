import { NextResponse } from "next/server";
import { adminDb, admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, token, email = "", isAdmin = false } = body;

    if (!userId || !token) {
      return NextResponse.json({ error: "userId e token são obrigatórios." }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin não configurado." }, { status: 503 });
    }

    await adminDb
      .collection("suporte_push_tokens")
      .doc(userId)
      .set(
        {
          userId,
          email,
          isAdmin: Boolean(isAdmin),
          tokens: admin.firestore.FieldValue.arrayUnion(token),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao salvar token push.";
    console.error("Erro em /api/suporte/push-token:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
