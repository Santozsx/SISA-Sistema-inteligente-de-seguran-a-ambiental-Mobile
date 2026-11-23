import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BottomTabs from './src/navigation/BottomTabs';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { versaoMinima } from './src/services/api';
import { VERSAO_APP } from './src/services/config';
import { versaoMenor } from './src/utils/formatar';
import { colors } from './src/theme/colors';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.backgroundAlt,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
  },
};

function Rotas() {
  const { perfil, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Logado: abas do app. Sem sessão: login e cadastro.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {perfil ? (
        <Stack.Screen name="App" component={BottomTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  // Avisa se a API não aceita mais esta versão do app (SISA_VERSAO_MINIMA_APP no back end).
  useEffect(() => {
    versaoMinima()
      .then((v) => {
        if (versaoMenor(VERSAO_APP, v.versao_minima_app)) {
          Alert.alert('Atualização necessária', `Esta versão do app (${VERSAO_APP}) não é mais aceita. Atualize para a ${v.versao_minima_app} ou superior.`);
        }
      })
      .catch(() => {
        // sem conexão: a tela de login mostra o erro ao tentar entrar
      });
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          <Rotas />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
