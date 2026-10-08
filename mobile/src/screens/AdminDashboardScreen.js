import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING } from '../utils/constants';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { adminStyles as styles } from './adminStyles';
import { formatDateTime, formatLocation } from '../utils/admin';

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState([]);
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [activeRes, historyRes, usersRes] = await Promise.all([
        adminAPI.getActiveEmergencies(),
        adminAPI.getHistory(),
        adminAPI.getUsers(),
      ]);
      setActive(activeRes.data.data || []);
      setHistory(historyRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (error) {
      Alert.alert(
        'Unable to load admin data',
        error.response?.data?.message || 'Please try again.'
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Leave the admin panel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SafeHer Control Center</Text>
        <Text style={styles.title}>Hello, {user?.name || 'Admin'}</Text>
        <Text style={styles.subtitle}>Monitor current emergencies and platform activity.</Text>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>ACTIVE SOS</Text>
          <Text style={[styles.statValue, { color: COLORS.sos }]}>{active.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL EVENTS</Text>
          <Text style={styles.statValue}>{history.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>USERS</Text>
          <Text style={styles.statValue}>{users.length}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout Admin</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Active Emergencies</Text>

        {active.length === 0 ? (
          <Text style={styles.empty}>No active emergencies right now.</Text>
        ) : (
          active.map((item) => (
            <View key={item.id} style={{ marginBottom: SPACING.md }}>
              <View style={styles.row}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.User?.name || item.user?.name || 'Unknown user'}
                </Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.itemMeta}>
                {item.User?.phone || item.user?.phone || item.User?.email || 'Contact unavailable'}
              </Text>
              <Text style={styles.itemMeta}>Trigger: {item.triggerType || 'SOS'}</Text>
              <Text style={styles.itemMeta}>{formatDateTime(item.startedAt)}</Text>
              <Text style={styles.itemMeta}>{formatLocation(item)}</Text>
              <View style={styles.divider} />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
