import { describe, it, expect } from "vitest";
import {
  normalizeHeader,
  normalizePhone,
  isValidPhone,
  formatPhone,
  isP2P,
  extrairLoginUsuario,
  detectarServidor,
  calcularVagasUsuario,
  ajustarTelasParaQuantidade,
  resumirTelasParaAcesso,
  montarUpgradeTela,
  formatarMensagemUpgrade,
  parseFlexibleDate,
  parseCsv,
} from "./utils";
import { gerarPixEstatico } from "./pix";
import { calcularResumoCombo, calcularValorPlano } from "./constants";

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

  it("extrai o login limpo de textos colados com Usuário/Username e Senha", () => {
    expect(extrairLoginUsuario("👤 Usuário: k9934w2 🔐 Senha: 6p672u9")).toBe("k9934w2");
    expect(extrairLoginUsuario("🔰 Dados de acesso 🔰 Username: t12345")).toBe("t12345");
    expect(extrairLoginUsuario("  k9934w2  ")).toBe("k9934w2");
  });

  it("aplica upgrade de +1 tela somando o acréscimo na mensalidade", () => {
    const upgrade = montarUpgradeTela(
      { app: "P2P", dispositivos: 1, valor: 30, enderecoMac: "AA:11" },
      { app: "OTT PLAYER", enderecoMac: "BB:22", chaveKey: "KEY2" },
      10
    );
    expect(upgrade.dispositivos).toBe(2);
    expect(upgrade.valor).toBe(40);
    expect(upgrade.app).toBe("P2P + OTT PLAYER");
    expect(upgrade.dispositivosP2P).toBe(1);
    expect(upgrade.dispositivosIPTV).toBe(1);
    expect(upgrade.telas).toHaveLength(2);

    const msg = formatarMensagemUpgrade(
      "Olá {cliente}, de R$ {valor_atual} para R$ {valor_novo} (+R$ {acrescimo})",
      { cliente: "Maria", usuario: "user1", valorAtual: 30, acrescimo: 10 }
    );
    expect(msg).toBe("Olá Maria, de R$ 30,00 para R$ 40,00 (+R$ 10,00)");
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

    // 1 único cadastro com 3 dispositivos (1 P2P + 2 IPTV) deve lotar o Warez
    const multi3 = calcularVagasUsuario(
      "7803a6v",
      [{ app: "P2P - OTT - HD PLAYER", dispositivos: 3 }],
      "Warez"
    );
    expect(multi3.ocupadosTotal).toBe(3);
    expect(multi3.vagas.total).toBe(0);
    expect(multi3.vagas.p2p).toBe(0);
    expect(multi3.vagas.iptv).toBe(0);
    expect(multi3.disponivel).toBe(false);

    // 1 único cadastro com 2 dispositivos (1 P2P + 1 IPTV) deixa apenas 1 vaga IPTV
    const multi2 = calcularVagasUsuario(
      "user2",
      [{ app: "P2P + OTT", dispositivos: 2 }],
      "Warez"
    );
    expect(multi2.ocupadosTotal).toBe(2);
    expect(multi2.vagas.total).toBe(1);
    expect(multi2.vagas.p2p).toBe(0);
    expect(multi2.vagas.iptv).toBe(1);
    expect(multi2.disponivel).toBe(true);

    // Telas explícitas por dispositivo (1 P2P + 2 IPTV)
    const telas = ajustarTelasParaQuantidade([], 3, {
      app: "P2P - OTT - HD PLAYER",
      enderecoMac: "AA:BB:CC",
      chaveKey: "1234",
    });
    expect(telas).toHaveLength(3);
    expect(telas[0].app).toBe("P2P");
    expect(telas[1].app).toBe("OTT");
    expect(telas[2].app).toBe("HD PLAYER");

    const resumo = resumirTelasParaAcesso(telas);
    expect(resumo.app).toBe("P2P + OTT + HD PLAYER");
    expect(resumo.dispositivosP2P).toBe(1);
    expect(resumo.dispositivosIPTV).toBe(2);

    const comTelas = calcularVagasUsuario(
      "7803a6v",
      [{ app: resumo.app, dispositivos: 3, telas: resumo.telas }],
      "Warez"
    );
    expect(comTelas.ocupadosTotal).toBe(3);
    expect(comTelas.vagas.total).toBe(0);
    expect(comTelas.disponivel).toBe(false);
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

describe("Cálculo de Combo de Acessos", () => {
  it("cobra valor unitário real quando renova apenas 1 acesso mesmo tendo valorCombo", () => {
    const res = calcularResumoCombo([{ valor: 35, valorCombo: 22.5 }]);
    expect(res.valorComboTotal).toBe(35);
    expect(res.economia).toBe(0);
    expect(res.valoresPorAcesso).toEqual([35]);
  });

  it("aplica valorCombo e calcula economia quando renova 2 ou mais acessos juntos", () => {
    const res = calcularResumoCombo([
      { valor: 35, valorCombo: 22.5 },
      { valor: 35, valorCombo: 22.5 },
    ]);
    expect(res.valorUnitarioTotal).toBe(70);
    expect(res.valorComboTotal).toBe(45);
    expect(res.economia).toBe(25);
    expect(res.valoresPorAcesso).toEqual([22.5, 22.5]);
  });

  it("usa o valor normal quando valorCombo não está preenchido no combo", () => {
    const res = calcularResumoCombo([
      { valor: 30 },
      { valor: 40, valorCombo: 0 },
    ]);
    expect(res.valorUnitarioTotal).toBe(70);
    expect(res.valorComboTotal).toBe(70);
    expect(res.economia).toBe(0);
  });

  it("não sobrescreve valor do combo com preço único da Black Friday", () => {
    const dataBlackFriday = new Date("2026-11-19T21:00:00-03:00");
    const plano = calcularValorPlano(1, 45.0, dataBlackFriday, 2);
    expect(plano.valor).toBe(45.0);
  });

  it("não cobra mais caro que o valor do cliente (ex: R$ 25) durante a Black Friday", () => {
    const dataBlackFriday = new Date("2026-11-19T21:00:00-03:00");
    const plano = calcularValorPlano(1, 25.0, dataBlackFriday, 1);
    expect(plano.valor).toBe(25.0);
  });

  it("aplica tabela Black Friday de 2 dispositivos (37, 65, 85, 145, 259)", () => {
    const dataBlackFriday = new Date("2026-11-19T21:00:00-03:00");
    expect(calcularValorPlano(1, 40.0, dataBlackFriday, 1, 2).valor).toBe(37.0);
    expect(calcularValorPlano(2, 40.0, dataBlackFriday, 1, 2).valor).toBe(65.0);
    expect(calcularValorPlano(3, 40.0, dataBlackFriday, 1, 2).valor).toBe(85.0);
    expect(calcularValorPlano(6, 40.0, dataBlackFriday, 1, 2).valor).toBe(145.0);
    expect(calcularValorPlano(12, 40.0, dataBlackFriday, 1, 2).valor).toBe(259.0);
  });

  it("aplica tabela Black Friday de 3 dispositivos (42, 75, 99, 179, 319)", () => {
    const dataBlackFriday = new Date("2026-11-19T21:00:00-03:00");
    expect(calcularValorPlano(1, 40.0, dataBlackFriday, 1, 3).valor).toBe(42.0);
    expect(calcularValorPlano(2, 40.0, dataBlackFriday, 1, 3).valor).toBe(75.0);
    expect(calcularValorPlano(3, 40.0, dataBlackFriday, 1, 3).valor).toBe(99.0);
    expect(calcularValorPlano(6, 40.0, dataBlackFriday, 1, 3).valor).toBe(179.0);
    expect(calcularValorPlano(12, 40.0, dataBlackFriday, 1, 3).valor).toBe(319.0);
  });
});

