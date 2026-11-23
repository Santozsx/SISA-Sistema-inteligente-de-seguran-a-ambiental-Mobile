import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Endereço do back end do SISA (backend/ do projeto web).
// 1. Se EXPO_PUBLIC_API_URL estiver definida (arquivo .env), usa ela.
// 2. Senão, usa o IP do computador que está rodando o "npx expo start" na porta 8000.
//    Para o celular alcançar a API, o back end precisa rodar com:
//    uvicorn app.main:app --host 0.0.0.0
const PORTA_API = 8000;

function urlPadrao(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${PORTA_API}/api/v1`;
  }
  // hostUri vem como "192.168.0.10:8081" quando o app é aberto pelo Expo Go
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${PORTA_API}/api/v1`;
  // Emulador Android enxerga o computador em 10.0.2.2
  return Platform.OS === 'android'
    ? `http://10.0.2.2:${PORTA_API}/api/v1`
    : `http://localhost:${PORTA_API}/api/v1`;
}

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? urlPadrao()).replace(/\/$/, '');

export const VERSAO_APP = Constants.expoConfig?.version ?? '1.0.0';
