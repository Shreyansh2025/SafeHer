import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text, ImageBackground, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import AdminNavigator from './src/navigation/AdminNavigator';
import { COLORS, FONTS, IMAGES } from './src/utils/constants';
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
    return <SplashView />;
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

function SplashView({ withFonts = true }) {
  return (
    <ImageBackground
      source={IMAGES.splash}
      style={styles.loadingContainer}
      resizeMode="cover"
    >
      <View style={styles.splashWash} />
      <Image source={IMAGES.logo} style={styles.splashLogo} resizeMode="contain" />
      {withFonts ? (
        <Text style={styles.splashTagline}>Safer Women, Brighter Tomorrows</Text>
      ) : null}
      <ActivityIndicator
        size="small"
        color={COLORS.primary}
        style={{ marginTop: 24 }}
      />
    </ImageBackground>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // Keep the loader on screen until fonts are ready
  if (!fontsLoaded) {
    return <SplashView withFonts={false} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  splashWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,248,252,0.55)',
  },
  splashLogo: {
    width: '60%',
    height: 120,
  },
  splashTagline: {
    marginTop: 8,
    fontFamily: FONTS.bodySemi,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
