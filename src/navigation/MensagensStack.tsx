import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MensagensScreen from '../screens/MensagensScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function MensagensStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConversasList" component={MensagensScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}
