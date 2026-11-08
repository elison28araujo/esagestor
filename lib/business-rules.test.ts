import { describe, it, expect } from "vitest";
import {
  normalizeHeader,
  normalizePhone,
  isValidPhone,
  formatPhone,
  isP2P,
  detectarServidor,
  calcularVagasUsuario,
  parseFlexibleDate,
  parseCsv,
} from "./utils";
import { gerarPixEstatico } from "./pix";

describe("Normalização e Formatação de Dados", () => {
  it("normaliza headers removendo acentos e caracteres especiais", () => {
    expect(normalizeHeader("Usuário / Login")).toBe("usuario login");
    expect(normalizeHeader("Data Vencimento")).toBe("data vencimento");
    expect(normalizeHeader("Endereço MAC")).toBe("endereco mac");
  });

  it("normaliza telefones mantendo apenas dígitos", () => {
    expect(normalizePhone("(91) 98506-6711")).toBe("91985066711");
    expect(normalizePhone("+55 (11) 99999-8888")).toBe("5511999998888");
  });

  it("valida telefones com 10 ou 11 dígitos", () => {
    expect(isValidPhone("91985066711")).toBe(true);
    expect(isValidPhone("1133334444")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });

  it("formata telefone brasileiro para exibição legível", () => {
    expect(formatPhone("91985066711")).toBe("(91) 98506-6711");
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("detecta corretamente se um aplicativo é P2P", () => {
    expect(isP2P("P2P")).toBe(true);
    expect(isP2P("ESA P2P TV")).toBe(true);
    expect(isP2P("OTT PLAYER")).toBe(false);
    expect(isP2P("KPLAY")).toBe(false);
    expect(isP2P(undefined)).toBe(false);
  });
});

describe("Regras de Servidores e Cálculo de Vagas", () => {
  it("detecta servidor por prefixo ou propriedade", () => {
    expect(detectarServidor({ usuario: "GN_joao", servidor: "Genial" })).toBe("Genial");
    expect(detectarServidor({ usuario: "FIVE_maria", servidor: "Five" })).toBe("Five");
    expect(detectarServidor({ usuario: "WZ_pedro", servidor: "Warez" })).toBe("Warez");
    expect(detectarServidor({ usuario: "cliente123" })).toBe("Warez"); // Default Warez
  });

  it("calcula vagas para Warez (Max 3: até 1 P2P e 2 IPTV)", () => {
    // Vazio
    const vazio = calcularVagasUsuario("user1", [], "Warez");
    expect(vazio.capacidadeTotal).toBe(3);
    expect(vazio.vagas.total).toBe(3);
    expect(vazio.vagas.p2p).toBe(1);
    expect(vazio.vagas.iptv).toBe(2);

    // 1 P2P presente
    const comP2P = calcularVagasUsuario("user1", [{ app: "P2P" }], "Warez");
    expect(comP2P.vagas.total).toBe(2);
    expect(comP2P.vagas.p2p).toBe(0);
    expect(comP2P.vagas.iptv).toBe(2);

    // 1 P2P e 2 IPTV presente (Lotado)
    const lotado = calcularVagasUsuario(
      "user1",
      [{ app: "P2P" }, { app: "OTT" }, { app: "KPLAY" }],
      "Warez"
    );
    expect(lotado.vagas.total).toBe(0);
    expect(lotado.disponivel).toBe(false);
  });

  it("calcula vagas para Genial (Max 2: 2 IPTV OU 2 P2P)", () => {
    // Vazio
    const vazio = calcularVagasUsuario("userGenial", [], "Genial");
    expect(vazio.capacidadeTotal).toBe(2);
    expect(vazio.vagas.total).toBe(2);

    // Se já tem 1 P2P, só pode aceitar mais 1 P2P (0 IPTV)
    const com1P2P = calcularVagasUsuario("userGenial", [{ app: "P2P" }], "Genial");
    expect(com1P2P.vagas.p2p).toBe(1);
    expect(com1P2P.vagas.iptv).toBe(0);

    // Se já tem 1 IPTV, só pode aceitar mais 1 IPTV (0 P2P)
    const com1IPTV = calcularVagasUsuario("userGenial", [{ app: "OTT" }], "Genial");
    expect(com1IPTV.vagas.p2p).toBe(0);
    expect(com1IPTV.vagas.iptv).toBe(1);
  });

  it("calcula vagas para Five (Max 2: apenas IPTV, 0 P2P)", () => {
    const vazio = calcularVagasUsuario("userFive", [], "Five");
    expect(vazio.capacidadeTotal).toBe(2);
    expect(vazio.vagas.iptv).toBe(2);
    expect(vazio.vagas.p2p).toBe(0);
  });
});

describe("Parser de Datas Flexíveis e CSV", () => {
  it("faz parse de data no formato brasileiro DD/MM/YYYY", () => {
    const parsed = parseFlexibleDate("15/05/2026");
    expect(parsed).toContain("2026-05-15");
  });

  it("faz parse de data no formato ISO YYYY-MM-DD", () => {
    const parsed = parseFlexibleDate("2026-12-31");
    expect(parsed).toContain("2026-12-31");
  });

  it("faz parse de CSV delimitado por ponto e vírgula ou vírgula", () => {
    const csvContent = "usuario;cliente;telefone;valor;app\njoao;Joao Silva;91985066711;35.00;P2P";
    const rows = parseCsv(csvContent);
    expect(rows.length).toBe(2);
    expect(rows[1][0]).toBe("joao");
    expect(rows[1][1]).toBe("Joao Silva");
    expect(rows[1][4]).toBe("P2P");
  });
});

describe("Geração de Pix Estático BRCode (EMV)", () => {
  it("gera payload Pix com formato válido e CRC16 no final", () => {
    const payload = gerarPixEstatico({
      chave: "12345678900",
      nome: "ESA GESTOR",
      cidade: "BELEM",
      valor: 35.0,
      txid: "FATURA123",
    });

    expect(payload.startsWith("000201")).toBe(true);
    expect(payload).toContain("br.gov.bcb.pix");
    expect(payload).toContain("12345678900");
    expect(payload).toContain("35.00");
    expect(payload).toContain("ESA GESTOR");
    expect(payload).toContain("6304"); // ID do CRC
    expect(payload.length).toBeGreaterThan(50);
  });
});

