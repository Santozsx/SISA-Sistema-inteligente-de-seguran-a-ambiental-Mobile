import * as SecureStore from 'expo-secure-store';

// No celular o token fica no armazenamento seguro do sistema (Keychain / Keystore).
export async function lerItem(chave: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(chave);
  } catch {
    return null;
  }
}

export async function salvarItem(chave: string, valor: string | null): Promise<void> {
  try {
    if (valor) await SecureStore.setItemAsync(chave, valor);
    else await SecureStore.deleteItemAsync(chave);
  } catch {
    // sem armazenamento: a sessão dura só enquanto o app estiver aberto
  }
}
