import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 500 });
    }

    const configsSnap = await adminDb.collection("configuracoes").limit(1).get();
    if (configsSnap.empty) {
      return NextResponse.json({ whatsappGestor: "" });
    }

    const configData = configsSnap.docs[0].data();
    return NextResponse.json({
      whatsappGestor: configData.whatsappGestor || "",
      pixKey: configData.pixKey || "",
      pixNome: configData.pixNome || "",
      pixCidade: configData.pixCidade || "",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
