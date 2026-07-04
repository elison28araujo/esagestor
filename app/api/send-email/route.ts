import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Campos to, subject e html são obrigatórios." },
        { status: 400 }
      );
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;

    if (!host || !user || !pass) {
      console.warn("SMTP não configurado. Adicione SMTP_HOST, SMTP_USER, SMTP_PASS no arquivo .env.local.");
      return NextResponse.json(
        { error: "Servidor SMTP não configurado." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true para 465, false para outras portas (como 587)
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"ESA Gestor Alertas" <${from}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Erro ao enviar e-mail:", error);
    return NextResponse.json(
      { error: "Falha ao enviar e-mail.", details: error.message },
      { status: 500 }
    );
  }
}
