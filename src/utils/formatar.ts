// O back end devolve datas em UTC sem fuso ("2026-10-21T03:04:34"); o "Z" faz o app ler como UTC.
function paraData(iso: string): Date {
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
}

export function tempoRelativo(iso: string): string {
  const minutos = Math.floor((Date.now() - paraData(iso).getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? '1 dia' : `${dias} dias`;
}

export function hora(iso: string): string {
  return paraData(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function dataHora(iso: string): string {
  return paraData(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function distancia(km: number | null): string {
  if (km === null) return 'distância desconhecida';
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

// Aceita "-23.55, -46.63" no campo de local e devolve as coordenadas, se forem válidas.
export function extrairCoordenadas(texto: string): { latitude: number; longitude: number } | null {
  const partes = texto.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!partes) return null;
  const latitude = Number(partes[1]);
  const longitude = Number(partes[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

// Compara versões "1.2.3"; devolve true se a for menor que b.
export function versaoMenor(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diferenca = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diferenca !== 0) return diferenca < 0;
  }
  return false;
}
