// Transforma bytes cifrados em uma imagem "ruído", como o <canvas> da tela Cofre do site.
// O React Native não tem canvas, então montamos um arquivo BMP na memória e mostramos
// com <Image source={{ uri: 'data:image/bmp;base64,...' }} />.

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Base64 -> bytes (feito à mão para não depender de atob, que nem todo motor JS tem).
export function base64ParaBytes(base64: string): Uint8Array {
  const limpo = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((limpo.length * 3) / 4));
  let saida = 0;
  for (let i = 0; i < limpo.length; i += 4) {
    // 4 letras de base64 = 24 bits = 3 bytes
    const a = ALFABETO.indexOf(limpo[i]);
    const b = ALFABETO.indexOf(limpo[i + 1]);
    const c = i + 2 < limpo.length ? ALFABETO.indexOf(limpo[i + 2]) : 0;
    const d = i + 3 < limpo.length ? ALFABETO.indexOf(limpo[i + 3]) : 0;
    const bloco = (a << 18) | (b << 12) | (c << 6) | d;
    if (saida < bytes.length) bytes[saida++] = (bloco >> 16) & 255;
    if (saida < bytes.length) bytes[saida++] = (bloco >> 8) & 255;
    if (saida < bytes.length) bytes[saida++] = bloco & 255;
  }
  return bytes;
}

// Bytes -> base64.
export function bytesParaBase64(bytes: Uint8Array): string {
  let texto = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const bloco = (a << 16) | (b << 8) | c;
    texto += ALFABETO[(bloco >> 18) & 63] + ALFABETO[(bloco >> 12) & 63];
    texto += i + 1 < bytes.length ? ALFABETO[(bloco >> 6) & 63] : '=';
    texto += i + 2 < bytes.length ? ALFABETO[bloco & 63] : '=';
  }
  return texto;
}

// "a1 ff 03" (amostra_hex da API) -> bytes. Usado se o download da prévia falhar.
export function hexParaBytes(hex: string): Uint8Array {
  const partes = hex.trim().split(/\s+/).filter(Boolean);
  return Uint8Array.from(partes.map((p) => parseInt(p, 16) || 0));
}

// Monta um BMP de lado x lado pixels: cada 3 bytes cifrados viram um pixel (R, G, B).
export function bytesParaImagemBmp(bytes: Uint8Array, lado: number): string {
  const bytesPorLinha = Math.ceil((lado * 3) / 4) * 4; // cada linha do BMP tem múltiplo de 4 bytes
  const tamanhoPixels = bytesPorLinha * lado;
  const arquivo = new Uint8Array(54 + tamanhoPixels);
  const dados = new DataView(arquivo.buffer);

  // Cabeçalho do arquivo (14 bytes) + cabeçalho da imagem (40 bytes)
  arquivo[0] = 0x42; // "B"
  arquivo[1] = 0x4d; // "M"
  dados.setUint32(2, arquivo.length, true);
  dados.setUint32(10, 54, true); // onde começam os pixels
  dados.setUint32(14, 40, true);
  dados.setInt32(18, lado, true); // largura
  dados.setInt32(22, lado, true); // altura
  dados.setUint16(26, 1, true);
  dados.setUint16(28, 24, true); // 24 bits por pixel
  dados.setUint32(34, tamanhoPixels, true);

  const total = Math.max(bytes.length - 2, 1);
  for (let y = 0; y < lado; y++) {
    // O BMP guarda as linhas de baixo para cima
    const linha = 54 + (lado - 1 - y) * bytesPorLinha;
    for (let x = 0; x < lado; x++) {
      const i = ((y * lado + x) * 3) % total;
      const destino = linha + x * 3;
      // Ordem do BMP: azul, verde, vermelho
      arquivo[destino] = bytes[i + 2] ?? 0;
      arquivo[destino + 1] = bytes[i + 1] ?? 0;
      arquivo[destino + 2] = bytes[i] ?? 0;
    }
  }
  return `data:image/bmp;base64,${bytesParaBase64(arquivo)}`;
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// 75000 ms -> "1:15"
export function relogio(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
