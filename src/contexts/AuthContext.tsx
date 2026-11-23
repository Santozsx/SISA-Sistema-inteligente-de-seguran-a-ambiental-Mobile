import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { Perfil } from '../types';

type AuthValor = {
  perfil: Perfil | null;
  carregando: boolean; // true enquanto verifica a sessão salva ao abrir o app
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: { nome: string; email: string; tipo: string; senha: string }) => Promise<void>;
  sair: () => Promise<void>;
  atualizarPerfilLocal: (perfil: Perfil) => void;
};

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.definirAoExpirarSessao(() => setPerfil(null));

    // Se há um token salvo, troca por um novo e já entra sem pedir login.
    (async () => {
      try {
        if (await api.carregarToken()) setPerfil(await api.renovarSessao());
      } catch {
        await api.logout();
      } finally {
        setCarregando(false);
      }
    })();

    return () => api.definirAoExpirarSessao(null);
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    setPerfil(await api.login(email, senha));
  }, []);

  const cadastrar = useCallback(async (dados: { nome: string; email: string; tipo: string; senha: string }) => {
    await api.cadastrar(dados);
    setPerfil(await api.login(dados.email, dados.senha));
  }, []);

  const sair = useCallback(async () => {
    await api.logout();
    setPerfil(null);
  }, []);

  const valor = useMemo(
    () => ({ perfil, carregando, entrar, cadastrar, sair, atualizarPerfilLocal: setPerfil }),
    [perfil, carregando, entrar, cadastrar, sair],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValor {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return valor;
}
