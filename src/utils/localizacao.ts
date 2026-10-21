import * as Location from 'expo-location';

export type Posicao = { latitude: number; longitude: number };

// Pede permissão e devolve a posição do GPS; null se o usuário negar ou o GPS falhar.
export async function obterPosicao(): Promise<Posicao | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const ultima = await Location.getLastKnownPositionAsync();
    const posicao = ultima ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
  } catch {
    return null;
  }
}
