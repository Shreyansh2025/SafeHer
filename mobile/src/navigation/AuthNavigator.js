import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import VerifyLoginOtpScreen from '../screens/VerifyLoginOtpScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="VerifyLoginOtp" component={VerifyLoginOtpScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}
