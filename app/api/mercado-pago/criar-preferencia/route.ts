import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "O servidor do banco de dados (Firebase Admin) não está configurado." },
        { status: 500 }
      );
    }

    const { acessoId } = await req.json();

    if (!acessoId) {
      return NextResponse.json(
        { error: "acessoId é obrigatório." },
        { status: 400 }
      );
    }

    // 1. Buscar acesso individual
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

    let finalUserId = userId;
    if (!finalUserId) {
      const configsSnap = await adminDb.collection("configuracoes").limit(1).get();
      if (!configsSnap.empty) {
        finalUserId = configsSnap.docs[0].id;
      }
    }

    if (!finalUserId) {
      return NextResponse.json(
        { error: "ID do gestor não encontrado para este acesso." },
        { status: 400 }
      );
    }

    // 2. Buscar token do gestor no Firestore
    const configDoc = await adminDb.collection("configuracoes").doc(finalUserId).get();
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

    // 3. Identificar host para montar URLs de retorno e webhook
    const host = req.headers.get("host") || "www.esaplay.site";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;
    const notificationUrl = `${origin}/api/mercado-pago/webhook`;

    const valorNumerico = Number(valor) > 0 ? Number(valor) : 35.0;

    // 4. Criar Preferência de Pagamento no Mercado Pago (Checkout Pro com Cartão de Crédito)
    const preferencePayload = {
      items: [
        {
          id: acessoId,
          title: `Mensalidade IPTV - ${usuario} (${cliente})`,
          description: "Renovação de acesso IPTV/P2P por 30 dias",
          quantity: 1,
          currency_id: "BRL",
          unit_price: valorNumerico,
        },
      ],
      payer: {
        name: typeof cliente === "string" ? cliente.substring(0, 30) : "Cliente",
        email: "cliente@esaplay.site",
      },
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" }, // Exclui boleto bancário (evita atraso de compensação de 3 dias)
        ],
        installments: 12, // Permite parcelamento no cartão de crédito em até 12x
      },
      back_urls: {
        success: `${origin}/consulta?status=approved&acessoId=${acessoId}`,
        failure: `${origin}/consulta?status=failure&acessoId=${acessoId}`,
        pending: `${origin}/consulta?status=pending&acessoId=${acessoId}`,
      },
      auto_return: "approved",
      external_reference: acessoId,
      notification_url: notificationUrl,
      statement_descriptor: "ESA GESTOR",
      metadata: {
        acesso_id: acessoId,
        user_id: finalUserId,
        usuario,
        cliente,
        valor: valorNumerico,
      },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preferencePayload),
    });

    if (!mpResponse.ok) {
      const errorDetails = await mpResponse.json();
      console.error("Erro ao criar preferência no Mercado Pago:", errorDetails);
      return NextResponse.json(
        { error: "Falha ao gerar checkout no Mercado Pago.", details: errorDetails.message },
        { status: mpResponse.status }
      );
    }

    const mpData = await mpResponse.json();
    const preferenceId = mpData.id;
    const initPoint = mpData.init_point;
    const sandboxInitPoint = mpData.sandbox_init_point;

    // 5. Registrar intenção de pagamento na coleção 'pagamentos_pendentes'
    await adminDb.collection("pagamentos_pendentes").doc(String(preferenceId)).set({
      preferenceId: String(preferenceId),
      acessoId,
      userId: finalUserId,
      usuario,
      cliente,
      valor: valorNumerico,
      app: acessoData.app || "IPTV",
      tipo: "cartao_credito",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      preferenceId: String(preferenceId),
      initPoint,
      sandboxInitPoint,
    });
  } catch (error: any) {
    console.error("Erro interno ao criar preferência de pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
