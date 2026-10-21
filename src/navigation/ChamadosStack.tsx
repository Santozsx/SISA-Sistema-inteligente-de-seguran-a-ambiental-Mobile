import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChamadosScreen from '../screens/ChamadosScreen';
import ChamadoDetalheScreen from '../screens/ChamadoDetalheScreen';
import NovoChamadoScreen from '../screens/NovoChamadoScreen';

const Stack = createNativeStackNavigator();

export default function ChamadosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChamadosList" component={ChamadosScreen} />
      <Stack.Screen name="ChamadoDetalhe" component={ChamadoDetalheScreen} />
      <Stack.Screen name="NovoChamado" component={NovoChamadoScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
