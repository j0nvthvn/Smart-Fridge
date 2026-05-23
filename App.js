import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import HomeScreen     from './src/screens/HomeScreen';
import ScannerScreen  from './src/screens/ScannerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen    from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { COLORS }     from './src/constants/colors';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { InventoryProvider } from './src/context/InventoryContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Inicio:  'home',
  Escáner: 'maximize',
  Cuenta:  'user',
};

function MainTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.green500,
          tabBarInactiveTintColor: COLORS.gray500,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopWidth: 0.5,
            borderTopColor: COLORS.gray300,
            paddingBottom: 6,
            paddingTop: 6,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
          tabBarIcon: ({ color }) => (
            <Feather name={TAB_ICONS[route.name]} size={20} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Inicio"  component={HomeScreen}     />
        <Tab.Screen name="Escáner" component={ScannerScreen}  />
        <Tab.Screen name="Cuenta"  component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.green500 }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  if (user) return <MainTabs />;

  if (screen === 'register') {
    return (
      <RegisterScreen onGoToLogin={() => setScreen('login')} />
    );
  }

  return (
    <LoginScreen onGoToRegister={() => setScreen('register')} />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <InventoryProvider>
          <StatusBar style="light" />
          <AuthGate />
        </InventoryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
