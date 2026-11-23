import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Carrega dados da API sempre que a tela ganha foco (ex.: ao voltar de "Novo chamado").
export function useCarregar<T>(buscar: () => Promise<T>, dependencias: unknown[] = []) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  const executar = useCallback(async (puxouParaAtualizar = false) => {
    if (puxouParaAtualizar) setAtualizando(true);
    try {
      setDados(await buscarRef.current());
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useFocusEffect(
    useCallback(() => {
      executar();
    }, [executar]),
  );

  return { dados, setDados, erro, carregando, atualizando, recarregar: () => executar(true) };
}
