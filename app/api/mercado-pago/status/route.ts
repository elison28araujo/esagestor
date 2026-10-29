import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Banco de dados não configurado." }, { status: 500 });
    }
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
    const currentStatus = data?.status || "pending";

    // Se já aprovado no banco, retorna imediatamente
    if (currentStatus === "approved") {
      return NextResponse.json({ status: "approved" });
    }

    // Fallback: se ainda pendente há mais de 20s, consulta a API do Mercado Pago diretamente
    const createdAt = data?.createdAt ? new Date(data.createdAt).getTime() : 0;
    const ageSeconds = (Date.now() - createdAt) / 1000;

    if (ageSeconds > 20 && data?.userId) {
      try {
        const configDoc = await adminDb.collection("configuracoes").doc(data.userId).get();
        const mpAccessToken = configDoc.data()?.mpAccessToken;

        if (mpAccessToken) {
          const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${mpAccessToken}` },
          });

          if (mpResponse.ok) {
            const mpData = await mpResponse.json();
            const mpStatus = mpData.status;

            if (mpStatus === "approved" && currentStatus !== "approved") {
              const hoje = new Date();
              const hojeStr = hoje.toISOString();

              // Atualiza status local
              await docRef.update({
                status: "approved",
                approvedAt: hojeStr,
                source: "mp_api_fallback",
              });

              // Atualiza vencimento do acesso (+30 dias)
              const { acessoId, usuario, cliente, app, valor } = data;
              if (acessoId) {
                const acessoRef = adminDb.collection("acessos").doc(acessoId);
                const acessoDoc = await acessoRef.get();
                if (acessoDoc.exists) {
                  const acessoData = acessoDoc.data();
                  if (acessoData) {
                    const vencAtual = new Date(acessoData.vencimento);
                    const novaData = vencAtual > hoje ? new Date(vencAtual) : new Date(hoje);
                    novaData.setDate(novaData.getDate() + 30);

                    await acessoRef.update({
                      vencimento: novaData.toISOString(),
                      data: hojeStr,
                    });

                    // Registra pagamento
                    await adminDb.collection("pagamentos").add({
                      acessoId,
                      usuario,
                      cliente,
                      app,
                      valor: Number(valor || 0),
                      data: hojeStr,
                      userId: data.userId,
                    });
                  }
                }
              }

              return NextResponse.json({ status: "approved", source: "mp_api_fallback" });
            }

            if (mpStatus !== "pending") {
              await docRef.update({ status: mpStatus });
            }

            return NextResponse.json({ status: mpStatus });
          }
        }
      } catch (fallbackErr: any) {
        console.error("Erro no fallback de polling do Mercado Pago:", fallbackErr.message);
      }
    }

    return NextResponse.json({ status: currentStatus });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno no servidor.", details: error.message }, { status: 500 });
  }
}
