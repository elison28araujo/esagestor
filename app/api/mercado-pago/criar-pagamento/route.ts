import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { acessoId } = await req.json();

    if (!acessoId) {
      return NextResponse.json(
        { error: "acessoId é obrigatório." },
        { status: 400 }
      );
    }

    // Buscar acesso individual
    const acessoDoc = await adminDb.collection("acessos").doc(acessoId).get();
    if (!acessoDoc.exists) {
      return NextResponse.json(
        { error: "Acesso não encontrado." },
        { status: 404 }
      );
    }

    const acessoData = acessoDoc.data();
    if (!acessoData) {
      return NextResponse.json(
        { error: "Dados do acesso corrompidos." },
        { status: 500 }
      );
    }

    const { usuario, cliente, valor, userId } = acessoData;

    // Buscar token do gestor
    const configDoc = await adminDb.collection("configuracoes").doc(userId).get();
    if (!configDoc.exists) {
      return NextResponse.json(
        { error: "Configurações de pagamento do gestor não encontradas." },
        { status: 400 }
      );
    }

    const configData = configDoc.data();
    const mpAccessToken = configData?.mpAccessToken;

    if (!mpAccessToken) {
      return NextResponse.json(
        { error: "O gestor ainda não configurou o token do Mercado Pago." },
        { status: 400 }
      );
    }

    // Identificar host para montar notification_url dinamicamente
    const host = req.headers.get("host") || "esagestor.vercel.app";
    const protocol = host.includes("localhost") ? "http" : "https";
    const notificationUrl = `${protocol}://${host}/api/mercado-pago/webhook`;

    // Gerar chave de idempotência para evitar transações duplicadas no Mercado Pago
    const idempotencyKey = crypto.randomUUID();

    // Requisitar pagamento Pix ao Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mpAccessToken}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: `Mensalidade IPTV - ${usuario} (${cliente})`,
        payment_method_id: "pix",
        payer: {
          email: "pagamento-cliente@esagestor.com",
          first_name: cliente.substring(0, 20) || "Cliente",
          last_name: "IPTV",
        },
        notification_url: notificationUrl,
        external_reference: acessoId,
      }),
    });

    if (!mpResponse.ok) {
      const errorDetails = await mpResponse.json();
      console.error("Erro da API do Mercado Pago:", errorDetails);
      return NextResponse.json(
        { error: "Falha ao gerar pagamento no Mercado Pago.", details: errorDetails.message },
        { status: mpResponse.status }
      );
    }

    const mpData = await mpResponse.json();
    const paymentId = mpData.id;
    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode || !qrCodeBase64) {
      return NextResponse.json(
        { error: "Mercado Pago não retornou dados de Pix válidos." },
        { status: 500 }
      );
    }

    // Registrar o pagamento pendente na coleção 'pagamentos_pendentes'
    await adminDb.collection("pagamentos_pendentes").doc(String(paymentId)).set({
      paymentId: String(paymentId),
      acessoId,
      userId,
      usuario,
      cliente,
      valor: Number(valor),
      app: acessoData.app,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      paymentId: String(paymentId),
      qrCode,
      qrCodeBase64,
    });
  } catch (error: any) {
    console.error("Erro ao criar pagamento Pix:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
