import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "O servidor do banco de dados (Firebase Admin) não está configurado. Por favor, adicione a variável de ambiente FIREBASE_SERVICE_ACCOUNT nas configurações da Vercel." },
        { status: 500 }
      );
    }

    const { telefone } = await req.json();

    if (!telefone) {
      return NextResponse.json(
        { error: "O número de telefone é obrigatório." },
        { status: 400 }
      );
    }

    const rawPhone = telefone.trim();
    const clean = rawPhone.replace(/\D/g, "");

    if (!clean || clean.length < 8) {
      return NextResponse.json(
        { error: "Por favor, digite um número de telefone válido com DDD." },
        { status: 400 }
      );
    }

    // Gerar variações do telefone para busca no Firestore (IN aceita até 30 itens)
    const variations = [rawPhone, clean];

    if (clean.length === 11) {
      const ddd = clean.substring(0, 2);
      const part1 = clean.substring(2, 7);
      const part2 = clean.substring(7);
      variations.push(`(${ddd}) ${part1}-${part2}`);
      variations.push(`(${ddd})${part1}-${part2}`);
      variations.push(`${ddd} ${part1}-${part2}`);
      variations.push(`55${clean}`);
      variations.push(`+55 (${ddd}) ${part1}-${part2}`);
      variations.push(`+55(${ddd})${part1}-${part2}`);
    } else if (clean.length === 13 && clean.startsWith("55")) {
      const clean11 = clean.substring(2);
      variations.push(clean11);
      const ddd = clean11.substring(0, 2);
      const part1 = clean11.substring(2, 7);
      const part2 = clean11.substring(7);
      variations.push(`(${ddd}) ${part1}-${part2}`);
      variations.push(`(${ddd})${part1}-${part2}`);
      variations.push(`+55 (${ddd}) ${part1}-${part2}`);
      variations.push(`+55${clean11}`);
    } else if (clean.length === 10) {
      const ddd = clean.substring(0, 2);
      const part1 = clean.substring(2, 6);
      const part2 = clean.substring(6);
      variations.push(`(${ddd}) ${part1}-${part2}`);
      variations.push(`(${ddd})${part1}-${part2}`);
      variations.push(`55${clean}`);
    }

    const uniqueVariations = Array.from(new Set(variations.filter(Boolean)));

    // Buscar no Firestore usando o operador IN
    const querySnapshot = await adminDb
      .collection("acessos")
      .where("telefone", "in", uniqueVariations)
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "Nenhum cliente cadastrado foi encontrado com esse telefone." },
        { status: 404 }
      );
    }

    const acessosEncontrados: any[] = [];
    let gestorId = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      acessosEncontrados.push({
        id: doc.id,
        cliente: data.cliente,
        usuario: data.usuario,
        vencimento: data.vencimento,
        valor: Number(data.valor) || 0,
        app: data.app,
        enderecoMac: data.enderecoMac || "",
        chaveKey: data.chaveKey || "",
      });
      gestorId = data.userId;
    });

    // Verificar se a licença do gestor está ativa
    if (gestorId) {
      const userDoc = await adminDb.collection("usuarios").doc(gestorId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData && userData.email !== "elison28araujo@gmail.com") {
          const isExpired = userData.vencimentoLicenca && new Date(userData.vencimentoLicenca) < new Date();
          if (userData.status !== "active" || isExpired) {
            return NextResponse.json(
              { error: "O sistema de consulta deste gestor está suspenso temporariamente." },
              { status: 403 }
            );
          }
        }
      }
    }

    // Buscar configurações do gestor
    let useMp = false;
    let pixManual = null;
    let whatsappGestor = "";

    if (gestorId) {
      const configDoc = await adminDb.collection("configuracoes").doc(gestorId).get();
      if (configDoc.exists) {
        const configData = configDoc.data();
        if (configData) {
          useMp = !!configData.mpAccessToken;
          whatsappGestor = configData.whatsappGestor || "";
          pixManual = {
            pixKey: configData.pixKey || "",
            pixNome: configData.pixNome || "",
            pixCidade: configData.pixCidade || "",
          };
        }
      }
    }

    return NextResponse.json({
      acessos: acessosEncontrados,
      useMp,
      pixManual,
      whatsappGestor,
    });
  } catch (error: any) {
    console.error("Erro na consulta do cliente por telefone:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
