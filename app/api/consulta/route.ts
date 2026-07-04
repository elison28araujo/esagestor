import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { usuario, telefone } = await req.json();

    if (!usuario || !telefone) {
      return NextResponse.json(
        { error: "Usuário e telefone são obrigatórios." },
        { status: 400 }
      );
    }

    // Normalizar telefone digitado (remover caracteres não numéricos)
    const normalizedPhone = telefone.replace(/\D/g, "");

    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Telefone inválido." },
        { status: 400 }
      );
    }

    // Buscar acessos que combinem com o usuário (busca exata)
    const querySnapshot = await adminDb
      .collection("acessos")
      .where("usuario", "==", usuario.trim())
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "Nenhum usuário encontrado com essas credenciais." },
        { status: 404 }
      );
    }

    const acessosEncontrados: any[] = [];
    let gestorId = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const docPhoneNormalized = (data.telefone || "").replace(/\D/g, "");

      // Verifica se o telefone confere (aceita comparações parciais se terminar igual para acomodar DDI 55)
      const match =
        docPhoneNormalized === normalizedPhone ||
        (docPhoneNormalized.length >= 8 && normalizedPhone.endsWith(docPhoneNormalized)) ||
        (normalizedPhone.length >= 8 && docPhoneNormalized.endsWith(normalizedPhone));

      if (match) {
        acessosEncontrados.push({
          id: doc.id,
          cliente: data.cliente,
          usuario: data.usuario,
          vencimento: data.vencimento,
          valor: Number(data.valor) || 0,
          app: data.app,
        });
        gestorId = data.userId;
      }
    });

    if (acessosEncontrados.length === 0) {
      return NextResponse.json(
        { error: "Telefone não confere com o cadastrado." },
        { status: 404 }
      );
    }

    // Buscar configurações do gestor correspondente
    let useMp = false;
    let pixManual = null;
    let whatsappGestor = "";

    if (gestorId) {
      const configDoc = await adminDb.collection("configuracoes").doc(gestorId).get();
      if (configDoc.exists) {
        const configData = configDoc.data();
        if (configData) {
          useMp = !!configData.mpAccessToken;
          whatsappGestor = configData.whatsappGestor || "";
          pixManual = {
            pixKey: configData.pixKey || "",
            pixNome: configData.pixNome || "",
            pixCidade: configData.pixCidade || "",
          };
        }
      }
    }

    return NextResponse.json({
      acessos: acessosEncontrados,
      useMp,
      pixManual,
      whatsappGestor,
    });
  } catch (error: any) {
    console.error("Erro na consulta do cliente:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
