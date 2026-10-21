// expo-secure-store não funciona no navegador; na web o token fica no localStorage.
export async function lerItem(chave: string): Promise<string | null> {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

export async function salvarItem(chave: string, valor: string | null): Promise<void> {
  try {
    if (valor) localStorage.setItem(chave, valor);
    else localStorage.removeItem(chave);
  } catch {
    // navegador sem armazenamento: a sessão dura só enquanto a página estiver aberta
  }
}
