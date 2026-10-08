import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { COLORS } from '../utils/constants';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminHistoryScreen from '../screens/AdminHistoryScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.cardBg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        headerStyle: {
          backgroundColor: COLORS.cardBg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '800',
          color: COLORS.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Admin Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🚨</Text>,
        }}
      />
      <Tab.Screen
        name="AdminHistory"
        component={AdminHistoryScreen}
        options={{
          title: 'Emergency History',
          tabBarLabel: 'History',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{
          title: 'Users',
          tabBarLabel: 'Users',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>👥</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
