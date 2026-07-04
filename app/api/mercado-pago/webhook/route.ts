import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 500 });
    }
    let paymentId: string | null = null;
    let topic: string | null = null;

    // 1. Tentar ler os parâmetros via Query String (IPN legado)
    const { searchParams } = new URL(req.url);
    paymentId = searchParams.get("id") || searchParams.get("data.id");
    topic = searchParams.get("topic") || searchParams.get("type");

    // 2. Tentar ler do corpo JSON (Webhook moderno)
    try {
      const body = await req.json();
      if (body?.data?.id) {
        paymentId = String(body.data.id);
      }
      if (body?.type) {
        topic = body.type;
      }
    } catch (_) {
      // Ignora falha de parse se não for JSON
    }

    // Se for notificação de teste ou sem ID, retornar OK de qualquer forma
    // (O Mercado Pago exige retorno 200/201 em todas as requisições para evitar retentativas)
    if (!paymentId || (topic && topic !== "payment")) {
      return NextResponse.json({ received: true });
    }

    // 3. Buscar transação na coleção 'pagamentos_pendentes'
    const pendenteDocRef = adminDb.collection("pagamentos_pendentes").doc(paymentId);
    const pendenteDoc = await pendenteDocRef.get();

    if (!pendenteDoc.exists) {
      console.warn(`Webhook recebido para pagamento ${paymentId}, mas não foi encontrado localmente.`);
      return NextResponse.json({ error: "Pagamento não rastreado." }, { status: 200 }); // Retorna 200 para cessar webhooks do MP
    }

    const pendenteData = pendenteDoc.data();
    if (!pendenteData) {
      return NextResponse.json({ error: "Dados do pagamento corrompidos." }, { status: 200 });
    }

    if (pendenteData.status !== "pending") {
      // Pagamento já processado (ex: "approved")
      return NextResponse.json({ success: true, alreadyProcessed: true });
    }

    const { acessoId, userId, usuario, cliente, valor, app } = pendenteData;

    // 4. Buscar token do gestor correspondente
    const configDoc = await adminDb.collection("configuracoes").doc(userId).get();
    if (!configDoc.exists) {
      return NextResponse.json({ error: "Configuração do gestor não encontrada." }, { status: 400 });
    }

    const configData = configDoc.data();
    const mpAccessToken = configData?.mpAccessToken;

    if (!mpAccessToken) {
      return NextResponse.json({ error: "Token do Mercado Pago ausente." }, { status: 400 });
    }

    // 5. Consultar a API oficial do Mercado Pago para checar o status
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
      },
    });

    if (!mpResponse.ok) {
      console.error(`Erro ao consultar pagamento ${paymentId} na API do Mercado Pago.`);
      return NextResponse.json({ error: "Erro ao consultar API do Mercado Pago." }, { status: 500 });
    }

    const paymentDetails = await mpResponse.json();
    const status = paymentDetails.status; // ex: "approved", "pending", "rejected", "cancelled"

    if (status === "approved") {
      // 6. Atualizar a data de vencimento do ACESSO específico (+30 dias)
      const acessoDocRef = adminDb.collection("acessos").doc(acessoId);
      const acessoDoc = await acessoDocRef.get();

      if (acessoDoc.exists) {
        const acessoData = acessoDoc.data();
        const hoje = new Date();
        if (acessoData) {
          const dataVencimentoAtual = new Date(acessoData.vencimento);
          // Se o vencimento já passou, soma 30 dias a partir de hoje. Caso contrário, soma 30 dias ao vencimento atual.
          const novaData = dataVencimentoAtual > hoje ? dataVencimentoAtual : hoje;
          novaData.setDate(novaData.getDate() + 30);

          await acessoDocRef.update({
            vencimento: novaData.toISOString(),
            data: hoje.toISOString(),
          });
        }
      }

      // 7. Criar histórico de pagamento na coleção 'pagamentos'
      const hojeStr = new Date().toISOString();
      await adminDb.collection("pagamentos").add({
        acessoId,
        usuario,
        cliente,
        app,
        valor: Number(valor),
        data: hojeStr,
        userId,
      });

      // 8. Atualizar status na coleção de controle local
      await pendenteDocRef.update({
        status: "approved",
        approvedAt: hojeStr,
      });

      return NextResponse.json({ success: true, status: "approved" });
    } else {
      if (status !== "pending") {
        // Atualiza status se foi rejeitado, cancelado, etc.
        await pendenteDocRef.update({ status });
      }
      return NextResponse.json({ success: true, status });
    }
  } catch (error: any) {
    console.error("Erro ao processar webhook do Mercado Pago:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
