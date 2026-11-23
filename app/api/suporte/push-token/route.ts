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
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token é obrigatório." }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Firebase Admin não configurado." }, { status: 503 });
    }

    const userId = decoded.uid;
    const email = decoded.email || "";
    const isAdmin = email === ADMIN_EMAIL;

    await adminDb
      .collection("suporte_push_tokens")
      .doc(userId)
      .set(
        {
          userId,
          email,
          isAdmin,
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
