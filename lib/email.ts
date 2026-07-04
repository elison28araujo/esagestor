import { Acesso } from "./types";

export async function enviarResumoAlertasEmail(to: string, acessos: Acesso[]): Promise<boolean> {
  const hoje = Date.now();

  const vencidos = acessos.filter((a) => new Date(a.vencimento).getTime() < hoje);
  
  const vencendo = acessos.filter((a) => {
    const dias = Math.ceil((new Date(a.vencimento).getTime() - hoje) / (1000 * 60 * 60 * 24));
    return dias > 0 && dias <= 3;
  });

  // Se não houver nada vencido ou vencendo, não envia e-mail
  if (vencidos.length === 0 && vencendo.length === 0) {
    return false;
  }

  // Montar corpo HTML elegante
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
      <h2 style="color: #2563eb; margin-top: 0; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">ESA GESTOR - Alerta de Vencimentos</h2>
      <p style="font-size: 15px; color: #475569;">Olá, aqui está o resumo diário de vencimentos dos seus clientes IPTV:</p>
      
      <div style="display: flex; gap: 10px; margin: 20px 0; justify-content: center;">
        ${
          vencidos.length > 0
            ? `<div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 12px; border-radius: 8px; text-align: center; flex: 1;">
                <span style="display: block; font-size: 20px; font-weight: bold; color: #dc2626;">${vencidos.length}</span>
                <span style="font-size: 12px; color: #7f1d1d; font-weight: 600;">VENCIDOS</span>
               </div>`
            : ""
        }
        ${
          vencendo.length > 0
            ? `<div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 8px; text-align: center; flex: 1;">
                <span style="display: block; font-size: 20px; font-weight: bold; color: #d97706;">${vencendo.length}</span>
                <span style="font-size: 12px; color: #78350f; font-weight: 600;">PRÓX. VENCIMENTO</span>
               </div>`
            : ""
        }
      </div>
  `;

  if (vencidos.length > 0) {
    htmlContent += `
      <h3 style="color: #dc2626; border-left: 4px solid #dc2626; padding-left: 8px; margin-top: 25px;">🔴 Clientes Vencidos</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
        <thead>
          <tr style="background-color: #ef4444; color: white;">
            <th style="padding: 8px; text-align: left;">Cliente</th>
            <th style="padding: 8px; text-align: left;">Usuário</th>
            <th style="padding: 8px; text-align: center;">App</th>
            <th style="padding: 8px; text-align: center;">Vencimento</th>
            <th style="padding: 8px; text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>
    `;

    vencidos.forEach((item, idx) => {
      const bgColor = idx % 2 === 0 ? "#ffffff" : "#f1f5f9";
      htmlContent += `
        <tr style="background-color: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px; font-weight: bold; color: #1e293b;">${item.cliente}</td>
          <td style="padding: 8px; color: #475569;">${item.usuario}</td>
          <td style="padding: 8px; text-align: center; color: #3b82f6; font-weight: 600;">${item.app}</td>
          <td style="padding: 8px; text-align: center; color: #ef4444; font-weight: bold;">${new Date(item.vencimento).toLocaleDateString("pt-BR")}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${Number(item.valor).toFixed(2)}</td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;
  }

  if (vencendo.length > 0) {
    htmlContent += `
      <h3 style="color: #d97706; border-left: 4px solid #d97706; padding-left: 8px; margin-top: 25px;">... Vencendo em até 3 dias</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
        <thead>
          <tr style="background-color: #f59e0b; color: white;">
            <th style="padding: 8px; text-align: left;">Cliente</th>
            <th style="padding: 8px; text-align: left;">Usuário</th>
            <th style="padding: 8px; text-align: center;">App</th>
            <th style="padding: 8px; text-align: center;">Vencimento</th>
            <th style="padding: 8px; text-align: right;">Valor</th>
          </tr>
        </thead>
        <tbody>
    `;

    vencendo.forEach((item, idx) => {
      const bgColor = idx % 2 === 0 ? "#ffffff" : "#f1f5f9";
      htmlContent += `
        <tr style="background-color: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px; font-weight: bold; color: #1e293b;">${item.cliente}</td>
          <td style="padding: 8px; color: #475569;">${item.usuario}</td>
          <td style="padding: 8px; text-align: center; color: #3b82f6; font-weight: 600;">${item.app}</td>
          <td style="padding: 8px; text-align: center; color: #d97706; font-weight: bold;">${new Date(item.vencimento).toLocaleDateString("pt-BR")}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #1e293b;">R$ ${Number(item.valor).toFixed(2)}</td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
    `;
  }

  htmlContent += `
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        Este e-mail foi gerado automaticamente pelo seu painel ESA Gestor.<br/>
        Não responda a este e-mail.
      </p>
    </div>
  `;

  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject: `ESA Gestor Alertas: ${vencidos.length + vencendo.length} cliente(s) expirando ou vencidos`,
        html: htmlContent,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
    return false;
  } catch (err) {
    console.error("Erro ao chamar endpoint send-email:", err);
    return false;
  }
}
