import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { calcularValorPlano, calcularResumoCombo, getValorAcordoAcesso } from "@/lib/constants";

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

    // 1. Buscar acessos
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
          app: String(data.app || "IPTV"),
          valor: Number(data.valor) || 0,
          valorCombo: Number(data.valorCombo) || 0,
          dispositivos: Number(data.dispositivos) >= 3 ? 3 : Number(data.dispositivos) === 2 ? 2 : 1,
          acordoAtivo: Boolean(data.acordoAtivo),
          acordoValor: Number(data.acordoValor) || 0,
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
    const { cliente, userId } = primeiroAcesso;
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

    const resumoCombo = calcularResumoCombo(acessosEncontrados);
    const { meses, valor: valorPlano } = calcularValorPlano(
      Number(mesesInput || 1),
      resumoCombo.valorComboTotal,
      new Date(),
      listaIds.length,
      primeiroAcesso.dispositivos,
      configData?.blackFridayPrecos || null
    );
    const acordoTotal = Number(
      acessosEncontrados.reduce((acc, a) => acc + getValorAcordoAcesso(a), 0).toFixed(2)
    );
    const valorNumerico = Number((valorPlano + acordoTotal).toFixed(2));
    const fator = resumoCombo.valorComboTotal > 0 ? valorPlano / resumoCombo.valorComboTotal : meses;
    const itensCombo = acessosEncontrados.map((a, idx) => ({
      acessoId: a.id,
      usuario: a.usuario,
      cliente: a.cliente,
      app: a.app,
      valor: Number((resumoCombo.valoresPorAcesso[idx] * fator + getValorAcordoAcesso(a)).toFixed(2)),
    }));

    // 4. Criar Preferência de Pagamento no Mercado Pago (Checkout Pro com Cartão de Crédito)
    const preferencePayload = {
      items: [
        {
          id: acessoIdPrincipal,
          title: `Renovação ${meses} ${meses === 1 ? "mês" : "meses"}${acordoTotal > 0 ? " + Acordo" : ""} - ${descricaoUsuarios} (${cliente})`,
          description: `Renovação de ${listaIds.length} acesso(s) IPTV/P2P por ${meses} ${meses === 1 ? "mês" : "meses"}${acordoTotal > 0 ? " + quitação de acordo pendente" : ""}`,
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
        success: `${origin}/consulta?status=approved&acessoId=${acessoIdPrincipal}`,
        failure: `${origin}/consulta?status=failure&acessoId=${acessoIdPrincipal}`,
        pending: `${origin}/consulta?status=pending&acessoId=${acessoIdPrincipal}`,
      },
      auto_return: "approved",
      external_reference: acessoIdPrincipal,
      notification_url: notificationUrl,
      statement_descriptor: "ESA GESTOR",
      metadata: {
        acesso_id: acessoIdPrincipal,
        acesso_ids: listaIds.join(","),
        user_id: finalUserId,
        usuario: descricaoUsuarios,
        cliente,
        valor: valorNumerico,
        meses,
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
      acessoId: acessoIdPrincipal,
      acessoIds: listaIds,
      itensCombo,
      userId: finalUserId,
      usuario: descricaoUsuarios,
      cliente,
      valor: valorNumerico,
      meses,
      app: primeiroAcesso.app || "IPTV",
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
