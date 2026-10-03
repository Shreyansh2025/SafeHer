import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, SHADOW } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { emergencyAPI } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSOSPress = () => {
    Alert.alert(
      '🚨 Emergency Alert',
      'Are you sure you want to trigger an SOS alert? This will notify all your emergency contacts.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: triggerSOS,
        },
      ]
    );
  };

  const triggerSOS = async () => {
  try {
    setLoading(true);

    // Request location permission
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to send SOS alerts.'
      );
      return;
    }

    // Get current location
    const location =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

    const emergencyData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      message: 'Emergency! I need help.',
    };

    console.log(
      '📍 Sending SOS with location:',
      emergencyData
    );

    const response =
      await emergencyAPI.trigger(emergencyData);

    console.log(
      '✅ SOS Response:',
      response.data
    );

    // --------------------------------------------------
    // READ BACKEND DELIVERY RESULT
    // --------------------------------------------------

    const result = response?.data?.emergency;

    const contactsNotified =
      result?.contactsNotified ?? 0;

    const contactsFailed =
      result?.contactsFailed ?? 0;

    const totalContacts =
      result?.notifications ?? 0;

    // --------------------------------------------------
    // BUILD USER MESSAGE
    // --------------------------------------------------

    let title = '⚠️ SOS Recorded';
    let message = '';

    // No emergency contacts
    if (totalContacts === 0) {
      message =
        'Emergency was recorded successfully, but you have no emergency contacts configured.';
    }

    // All contacts failed
    else if (
      contactsNotified === 0 &&
      contactsFailed > 0
    ) {
      title = '⚠️ SOS Recorded';

      message =
        'Emergency was recorded, but no emergency contact could be notified.';
    }

    // Some contacts succeeded
    else if (
      contactsNotified > 0 &&
      contactsFailed > 0
    ) {
      title = '⚠️ SOS Partially Sent';

      message =
        `Emergency was recorded.\n\n` +
        `${contactsNotified} contact(s) were notified successfully.\n` +
        `${contactsFailed} contact(s) could not be notified.`;
    }

    // All contacts succeeded
    else if (
      contactsNotified > 0 &&
      contactsFailed === 0
    ) {
      title = '✅ SOS Alert Sent';

      message =
        `Emergency recorded and ${contactsNotified} contact(s) were notified successfully.`;
    }

    // Add location information
    message +=
      `\n\nLocation: ` +
      `${location.coords.latitude.toFixed(6)}, ` +
      `${location.coords.longitude.toFixed(6)}`;

    Alert.alert(
      title,
      message,
      [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('Contacts'),
        },
      ]
    );

  } catch (error) {
    console.error(
      '❌ SOS Error:',
      error.response?.data || error.message
    );

    Alert.alert(
      'Error',
      error.response?.data?.message ||
        error.message ||
        'Failed to send SOS alert'
    );

  } finally {
    setLoading(false);
  }
};

  const quickActions = [
    {
      id: 1,
      title: 'Manage Contacts',
      icon: '👥',
      color: COLORS.primary,
      onPress: () => navigation.navigate('Contacts'),
    },
    {
      id: 2,
      title: 'View History',
      icon: '📋',
      color: COLORS.secondary,
      onPress: () => navigation.navigate('History'),
    },
    {
      id: 3,
      title: 'Safe Places',
      icon: '📍',
      color: '#10B981',
      onPress: () => Alert.alert('Coming Soon', 'Safe places feature coming soon!'),
    },
    {
      id: 4,
      title: 'Settings',
      icon: '⚙️',
      color: '#F59E0B',
      onPress: () => Alert.alert('Coming Soon', 'Settings coming soon!'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.subtitle}>Stay safe, we're here for you</Text>
      </View>

      {/* SOS Button Container */}
      <View style={styles.sosContainer}>
        <Text style={styles.sosLabel}>Emergency Button</Text>

        <TouchableOpacity
          style={[styles.sosButton, loading && styles.sosButtonDisabled]}
          onPress={handleSOSPress}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>Tap to Alert</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sosInstruction}>
          Press and hold to send emergency alert to all contacts
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: action.color + '20' },
                ]}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Safety Tips Card */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Safety Tip</Text>
        <Text style={styles.tipsText}>
          Always keep your emergency contacts updated and share your location with trusted friends when traveling alone.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    ...SHADOW,
  },
  greeting: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  sosContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  sosLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  sosButton: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.sos,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.sos,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 8,
    borderColor: '#fff',
  },
  sosButtonDisabled: {
    opacity: 0.7,
  },
  sosText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 10,
  },
  sosSubtext: {
    fontSize: 18,
    color: '#fff',
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
  sosInstruction: {
    marginTop: SPACING.lg,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  actionsSection: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOW,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    margin: SPACING.lg,
    marginTop: 0,
    ...SHADOW,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  tipsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
