import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId é obrigatório." }, { status: 400 });
    }

    const docRef = adminDb.collection("pagamentos_pendentes").doc(paymentId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
    }

    const data = docSnap.data();
    return NextResponse.json({ status: data?.status || "pending" });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno no servidor.", details: error.message }, { status: 500 });
  }
}
