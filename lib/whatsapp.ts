export type WhatsappTipo = "normal" | "business";

export function normalizarTelefoneWhatsapp(telefone: string): string {
  const digits = (telefone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
}

export function abrirWhatsappComEscolha(
  telefone: string,
  mensagem: string,
  tipo: WhatsappTipo
): void {
  const phoneWithCountry = normalizarTelefoneWhatsapp(telefone);
  if (!phoneWithCountry) return;

  const textParam = mensagem ? `&text=${encodeURIComponent(mensagem)}` : "";
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    const pkg = tipo === "business" ? "com.whatsapp.w4b" : "com.whatsapp";
    window.location.href = `intent://send?phone=${phoneWithCountry}${textParam}#Intent;scheme=whatsapp;package=${pkg};end`;
    return;
  }

  const query = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  window.open(`https://wa.me/${phoneWithCountry}${query}`, "_blank");
}
