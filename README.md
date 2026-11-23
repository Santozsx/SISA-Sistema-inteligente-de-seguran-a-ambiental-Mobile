# SISA — App Mobile

App mobile (React Native + Expo + TypeScript) do Sistema Inteligente de Segurança Ambiental,
espelhando a versão desktop enviada, com Bottom Tab Navigation e tema Dark Navy.

## Como rodar

```bash
npm install
npx expo start
```

Requer Expo CLI (`npx expo`) e o app **Expo Go** no celular, ou um emulador Android/iOS.

Para o mapa (`react-native-maps`) funcionar no Android, adicione sua chave do Google Maps
em `app.json` (`android.config.googleMaps.apiKey`) e, no iOS, em `ios.config.googleMapsApiKey`.

## Estrutura

```
App.tsx                        # Stack raiz: Login → Register → App (tabs)
src/
  theme/colors.ts               # Design system (cores, status, spacing, radius)
  types/index.ts                 # Tipos: Instituto, NoticiaMural, Mensagem, Chamado
  data/mock.ts                   # Dados mockados (substituir por chamadas de API)
  components/
    StatusBadge.tsx
    InstitutoCard.tsx
    NoticiaCard.tsx
    ChamadoCard.tsx
    MessageBubble.tsx
    PreviaCifrada.tsx            # bytes cifrados desenhados como imagem (BMP gerado em memória)
  screens/
    LoginScreen.tsx
    RegisterScreen.tsx
    MuralScreen.tsx              # Aba 1 — carrossel de institutos + mural de notícias
    InstitutosScreen.tsx         # Aba 2 — mapa (react-native-maps) + lista
    MensagensScreen.tsx          # Aba 3 — lista de conversas
    ChatScreen.tsx                # Chat individual (canal cifrado)
    ChamadosScreen.tsx           # Aba 4 — listagem com filtros por status
    NovoChamadoScreen.tsx        # Modal de novo chamado (categoria, GPS, anexo)
    CofreScreen.tsx              # Aba 5 — fotos cifradas (enviar, ver cifrado, revelar com senha)
    ConfigScreen.tsx             # Aba 6 — perfil, criptografia, notificações
  navigation/
    BottomTabs.tsx                # Bottom Tab Navigation (5 abas)
    MensagensStack.tsx            # Stack: lista de conversas → chat
    ChamadosStack.tsx             # Stack: lista de chamados → modal novo chamado
```

## Cofre (igual ao site)

Usa as mesmas rotas `/cofre` do back end. A foto (câmera ou galeria) e a legenda são cifradas
no servidor. A lista mostra a prévia "ruído" dos bytes cifrados, a amostra em hexadecimal,
o algoritmo, os tamanhos, a entropia e o SHA-256. "Revelar" pede a senha (`POST /cofre/desbloquear`),
mostra a foto por 1 minuto, e o cofre se fecha sozinho ao vencer o prazo, ao trocar de aba
ou quando o app vai para segundo plano. No chat, o ícone de imagem abre o Cofre já com o
instituto da conversa como destinatário.

## Próximos passos sugeridos

- Substituir `src/data/mock.ts` por chamadas reais à API (autenticação, institutos,
  mensagens, chamados).
- Implementar a criptografia de ponta a ponta de fato (o app hoje simula o selo "cifrada").
- Persistir sessão de login (ex: `expo-secure-store`) em vez de navegar direto para "App".
- Adicionar push notifications para novos chamados/mensagens.
