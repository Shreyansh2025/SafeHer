import React, { useEffect } from 'react';

import {
  NavigationContainer
} from '@react-navigation/native';

import {
  StatusBar
} from 'expo-status-bar';

import {
  View,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

import {
  AuthProvider,
  useAuth
} from './src/context/AuthContext';

import AuthNavigator
  from './src/navigation/AuthNavigator';

import MainNavigator
  from './src/navigation/MainNavigator';

import {
  COLORS
} from './src/utils/constants';

import {
  connectSocket,
  disconnectSocket
} from './src/services/socket';


// =========================================================
// APP CONTENT
// =========================================================

function AppContent() {

  const {
    user,
    loading
  } = useAuth();


  // =======================================================
  // SOCKET CONNECTION
  // =======================================================

  useEffect(() => {

    if (!user) {

      disconnectSocket();

      return;

    }


    console.log(
      `🔐 Connecting Socket.IO for User ${user.id}`
    );


    connectSocket();


    return () => {

      // This runs when auth state changes
      // or AppContent unmounts.

      disconnectSocket();

    };

  }, [user]);


  // =======================================================
  // AUTH LOADING
  // =======================================================

  if (loading) {

    return (

      <View
        style={styles.loadingContainer}
      >

        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

      </View>

    );

  }


  // =======================================================
  // NAVIGATION
  // =======================================================

  return (

    <NavigationContainer>

      {
        user
          ? <MainNavigator />
          : <AuthNavigator />
      }

      <StatusBar
        style="dark"
      />

    </NavigationContainer>

  );

}


// =========================================================
// APP
// =========================================================

export default function App() {

  return (

    <AuthProvider>

      <AppContent />

    </AuthProvider>

  );

}


// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({

  loadingContainer: {

    flex: 1,

    justifyContent:
      'center',

    alignItems:
      'center',

    backgroundColor:
      COLORS.background,

  },

});