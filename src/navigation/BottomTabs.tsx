import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import MuralScreen from '../screens/MuralScreen';
import InstitutosScreen from '../screens/InstitutosScreen';
import MensagensStack from './MensagensStack';
import ChamadosStack from './ChamadosStack';
import CofreScreen from '../screens/CofreScreen';
import ConfigScreen from '../screens/ConfigScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const icons: Record<string, keyof typeof Feather.glyphMap> = {
  Mural: 'home',
  Institutos: 'map-pin',
  Mensagens: 'message-circle',
  Chamados: 'alert-triangle',
  Cofre: 'lock',
  Config: 'settings',
};

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.backgroundAlt,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10 },
        tabBarIcon: ({ color, size }) => (
          <Feather name={icons[route.name]} size={size ? size - 4 : 18} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Mural" component={MuralScreen} />
      <Tab.Screen name="Institutos" component={InstitutosScreen} />
      <Tab.Screen name="Mensagens" component={MensagensStack} />
      <Tab.Screen name="Chamados" component={ChamadosStack} />
      <Tab.Screen name="Cofre" component={CofreScreen} />
      <Tab.Screen name="Config" component={ConfigScreen} />
    </Tab.Navigator>
  );
}
