import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    // 1. Validar autenticação do usuário via Firebase ID Token
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Acesso não autorizado. Token de autenticação ausente." },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1]?.trim();
    if (!token) {
      return NextResponse.json(
        { error: "Token de autenticação inválido." },
        { status: 401 }
      );
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err: any) {
      console.warn("Falha ao verificar token Firebase no send-email:", err.message);
      return NextResponse.json(
        { error: "Token de autenticação expirado ou inválido." },
        { status: 401 }
      );
    }

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Campos to, subject e html são obrigatórios." },
        { status: 400 }
      );
    }

    // Só permite envio para o próprio e-mail do usuário autenticado ou se for admin
    const userEmail = (decodedToken.email || "").toLowerCase();
    const targetEmail = String(to).toLowerCase().trim();
    const isAdmin = userEmail === "elison28araujo@gmail.com" || decodedToken.admin === true;

    if (userEmail !== targetEmail && !isAdmin) {
      return NextResponse.json(
        { error: "Você só pode disparar alertas para seu próprio e-mail cadastrado." },
        { status: 403 }
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
        { error: "Servidor SMTP não configurado no ambiente." },
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
