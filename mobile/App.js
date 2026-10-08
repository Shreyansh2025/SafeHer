import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import { COLORS } from './src/utils/constants';
import { connectSocket, disconnectSocket } from './src/services/socket';

function AppContent() {
  const { user, loading, accountType } = useAuth();

  useEffect(() => {
    if (!user || accountType === 'admin') {
      disconnectSocket();
      return;
    }

    console.log(`🔐 Connecting Socket.IO for User ${user.id}`);
    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [user, accountType]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : accountType === 'admin' ? (
        <AdminNavigator />
      ) : (
        <MainNavigator />
      )}

      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
