import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Régua completa de notificações:
//  3 = 3 dias antes (aviso preventivo - reduz inadimplência)
//  1 = 1 dia antes (vence amanhã)
//  0 = dia do vencimento (vence hoje)
// -1 = 1 dia após vencer (recuperação / aviso de suspensão)
const DIAS_ALERTA = [-1, 0, 1, 3];

export async function GET(req: any) {
  try {
    const reqHeaders = req ? req["headers"] : null;
    const authHeader = reqHeaders ? reqHeaders.get("authorization") : null;
    const isCronSecretValid = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    const reqUrl = req ? req["url"] : "";
    const urlObj = new URL(reqUrl || "https://www.esaplay.site");
    const secret = urlObj.searchParams.get("secret");
    const isQuerySecretValid = process.env.CRON_SECRET && secret === process.env.CRON_SECRET;

    // Se a variável CRON_SECRET estiver definida no ambiente, exige a autenticação
    if (process.env.CRON_SECRET && !isCronSecretValid && !isQuerySecretValid) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Banco de dados não configurado" }, { status: 500 });
    }

    // 1. Obter configurações de todos os gestores (Z-API e mensagens customizadas)
    const configSnap = await adminDb.collection("configuracoes").get();
    const configs: Record<string, any> = {};
    configSnap.forEach((doc) => {
      configs[doc.id] = doc.data();
    });

    // 2. Obter data de hoje no fuso horário de Brasília
    const hoje = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const hojeParts = formatter.formatToParts(hoje);
    const hojeMap: Record<string, string> = {};
    hojeParts.forEach((p) => { hojeMap[p.type] = p.value; });
    const hojeDateOnly = new Date(parseInt(hojeMap.year), parseInt(hojeMap.month) - 1, parseInt(hojeMap.day));
    const hojeStr = hojeDateOnly.toISOString().slice(0, 10);

    // 3. Obter todos os acessos de clientes do banco
    const acessosSnap = await adminDb.collection("acessos").get();
    let enviadosCount = 0;
    let puladosAntiSpam = 0;
    const erros: string[] = [];

    for (const docSnap of acessosSnap.docs) {
      const acesso = docSnap.data();
      const userId = acesso.userId;

      // Se o gestor deste cliente não configurou a Z-API, ignoramos
      const gestorConfig = configs[userId];
      if (!gestorConfig || !gestorConfig.zapiInstanceId || !gestorConfig.zapiToken) {
        continue;
      }

      const { zapiInstanceId, zapiToken, mensagemCobranca } = gestorConfig;

      if (!acesso.vencimento || !acesso.telefone) continue;

      // Obter data de vencimento no fuso horário de Brasília
      const vencDate = new Date(acesso.vencimento);
      const vencParts = formatter.formatToParts(vencDate);
      const vencMap: Record<string, string> = {};
      vencParts.forEach((p) => { vencMap[p.type] = p.value; });
      const vencDateOnly = new Date(parseInt(vencMap.year), parseInt(vencMap.month) - 1, parseInt(vencMap.day));

      // Diferença em dias
      const diffTime = vencDateOnly.getTime() - hojeDateOnly.getTime();
      const dias = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Só dispara se estiver em um dos pontos da régua
      if (!DIAS_ALERTA.includes(dias)) continue;

      // 4. Trava Anti-Spam (evita disparos duplicados para o mesmo cliente no mesmo dia)
      const antiSpamId = `${docSnap.id}_${hojeStr}_dias_${dias}`;
      const notifRef = adminDb.collection("notificacoes_enviadas").doc(antiSpamId);
      const notifDoc = await notifRef.get();
      if (notifDoc.exists) {
        puladosAntiSpam++;
        continue;
      }

      const phone = acesso.telefone.replace(/\D/g, "");
      if (!phone) continue;

      // Construir link de consulta personalizado
      const host = (reqHeaders ? reqHeaders.get("host") : null) || "www.esaplay.site";
      const protocol = (reqHeaders ? reqHeaders.get("x-forwarded-proto") : null) || "https";
      const linkPortal = `${protocol}://${host}/consulta?telefone=${phone}`;

      // Personalizar prefixo com base no momento da régua
      let prefixo = "";
      if (dias === 3) prefixo = "⚠️ [Aviso Antecipado] ";
      else if (dias === 1) prefixo = "🔔 [Vence Amanhã] ";
      else if (dias === 0) prefixo = "🚨 [Vence Hoje] ";
      else if (dias === -1) prefixo = "❌ [Acesso Vencido] ";

      let msg = (mensagemCobranca || "Olá {cliente}, seu acesso {app} está vencendo.")
        .replace("{cliente}", acesso.cliente || "")
        .replace("{app}", acesso.app || "")
        .replace("{valor}", Number(acesso.valor || 0).toFixed(2));

      msg = `${prefixo}${msg}`;

      if (msg.includes("{link}")) {
        msg = msg.replace("{link}", linkPortal);
      } else {
        msg = `${msg}\n\nEfetue o pagamento pelo link: ${linkPortal}`;
      }

      try {
        const phoneFormatted = phone.startsWith("55") ? phone : `55${phone}`;
        const res = await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: phoneFormatted,
            message: msg,
          }),
        });

        if (res.ok) {
          enviadosCount++;
          // Registrar na coleção anti-spam
          await notifRef.set({
            acessoId: docSnap.id,
            cliente: acesso.cliente || "",
            userId,
            dias,
            hojeStr,
            enviadoEm: new Date().toISOString(),
          });
        } else {
          const errText = await res.text();
          erros.push(`Falha de envio Z-API para ${acesso.cliente}: ${errText}`);
        }
      } catch (err: any) {
        erros.push(`Erro de conexão Z-API para ${acesso.cliente}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      enviados: enviadosCount,
      puladosAntiSpam,
      erros,
      executadoEm: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erro ao rodar cron de vencimentos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
