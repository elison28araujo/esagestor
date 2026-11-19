import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calcularValorPlano, calcularResumoCombo } from "@/lib/constants";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "O servidor do banco de dados (Firebase Admin) não está configurado." },
        { status: 500 }
      );
    }
    const { acessoId, acessoIds: acessoIdsInput, meses: mesesInput } = await req.json();

    const listaIds: string[] = Array.isArray(acessoIdsInput) && acessoIdsInput.length > 0
      ? Array.from(new Set(acessoIdsInput.map((id: unknown) => String(id).trim()).filter(Boolean)))
      : acessoId
        ? [String(acessoId).trim()]
        : [];

    if (listaIds.length === 0) {
      return NextResponse.json(
        { error: "acessoId ou acessoIds é obrigatório." },
        { status: 400 }
      );
    }

    const acessosDocs = await Promise.all(
      listaIds.map((id) => adminDb!.collection("acessos").doc(id).get())
    );

    const acessosEncontrados = acessosDocs
      .filter((d) => d.exists && d.data())
      .map((d) => {
        const data = d.data()!;
        return {
          id: d.id,
          usuario: String(data.usuario || ""),
          cliente: String(data.cliente || ""),
          app: String(data.app || ""),
          valor: Number(data.valor) || 0,
          valorCombo: Number(data.valorCombo) || 0,
          userId: data.userId as string | undefined,
        };
      });

    if (acessosEncontrados.length !== listaIds.length) {
      return NextResponse.json(
        { error: "Um ou mais acessos não foram encontrados." },
        { status: 404 }
      );
    }

    const primeiroAcesso = acessosEncontrados[0];
    const { usuario, cliente, userId } = primeiroAcesso;
    const resumoCombo = calcularResumoCombo(acessosEncontrados);
    const { meses, valor: valorFinal } = calcularValorPlano(Number(mesesInput || 1), resumoCombo.valorComboTotal);
    const fator = resumoCombo.valorComboTotal > 0 ? valorFinal / resumoCombo.valorComboTotal : meses;
    const itensCombo = acessosEncontrados.map((a, idx) => ({
      acessoId: a.id,
      usuario: a.usuario,
      cliente: a.cliente,
      app: a.app,
      valor: Number((resumoCombo.valoresPorAcesso[idx] * fator).toFixed(2)),
    }));
    const acessoIdPrincipal = primeiroAcesso.id;
    const descricaoUsuarios = acessosEncontrados.map((a) => a.usuario).join(", ");

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

    // Buscar token do gestor
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
        transaction_amount: valorFinal,
        description: `Renovação ${meses} ${meses === 1 ? "mês" : "meses"} - ${descricaoUsuarios} (${cliente})`,
        payment_method_id: "pix",
        payer: {
          email: "pagamento-cliente@esagestor.com",
          first_name: (cliente && typeof cliente === "string") ? cliente.substring(0, 20) : "Cliente",
          last_name: "IPTV",
        },
        notification_url: notificationUrl,
        external_reference: acessoIdPrincipal,
        metadata: {
          acesso_id: acessoIdPrincipal,
          acesso_ids: listaIds.join(","),
          user_id: finalUserId,
          meses,
        },
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
      acessoId: acessoIdPrincipal,
      acessoIds: listaIds,
      itensCombo,
      userId: finalUserId,
      usuario: descricaoUsuarios,
      cliente,
      valor: valorFinal,
      meses,
      app: primeiroAcesso.app,
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
