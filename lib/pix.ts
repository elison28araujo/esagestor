function computeCRC16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    for (let b = 0; b < 8; b++) {
      const bit = ((code >> (7 - b)) & 1) === 1;
      const c15 = ((crc >> 15) & 1) === 1;
      crc <<= 1;
      if (c15 !== bit) {
        crc ^= polynomial;
      }
    }
  }

  crc &= 0xffff;
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function cleanString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos e diacríticos
    .replace(/[^A-Z0-9 ]/gi, "") // Mantém apenas letras, números e espaços
    .toUpperCase();
}

export function gerarPixEstatico({
  chave,
  nome,
  cidade,
  valor,
  txid = "***",
}: {
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
  txid?: string;
}): string {
  const payloadIndicator = "000201";
  
  // Merchant Account Info
  const gui = formatField("00", "br.gov.bcb.pix");
  const key = formatField("01", chave.trim());
  const merchantAccountInfo = formatField("26", gui + key);
  
  const categoryCode = "52040000";
  const currencyCode = "5303986";
  
  // Transaction Amount formatted (ex: "30.00")
  const amountStr = valor.toFixed(2);
  const transactionAmount = formatField("54", amountStr);
  
  const countryCode = "5802BR";
  
  // Merchant Name (max 25 chars)
  const cleanedName = cleanString(nome).substring(0, 25).trim();
  const merchantName = formatField("59", cleanedName || "ESA GESTOR");
  
  // Merchant City (max 15 chars)
  const cleanedCity = cleanString(cidade).substring(0, 15).trim();
  const merchantCity = formatField("60", cleanedCity || "SAO PAULO");
  
  // Additional Data (TxID)
  const txidField = formatField("05", txid.trim());
  const additionalData = formatField("62", txidField);
  
  // Concatenate up to CRC
  const rawPayload = 
    payloadIndicator + 
    merchantAccountInfo + 
    categoryCode + 
    currencyCode + 
    transactionAmount + 
    countryCode + 
    merchantName + 
    merchantCity + 
    additionalData + 
    "6304";
    
  const crc = computeCRC16(rawPayload);
  
  return rawPayload + crc;
}
