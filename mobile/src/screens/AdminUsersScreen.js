import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminAPI } from '../services/api';
import { SPACING } from '../utils/constants';
import { adminStyles as styles } from './adminStyles';
import { formatDateTime } from '../utils/admin';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data.data || []);
    } catch (error) {
      Alert.alert(
        'Unable to load users',
        error.response?.data?.message || 'Please try again.'
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUsers} />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Platform</Text>
        <Text style={styles.title}>Registered Users</Text>
        <Text style={styles.subtitle}>{users.length} user{users.length === 1 ? '' : 's'} in SafeHer.</Text>
      </View>

      {users.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.empty}>No users found.</Text>
        </View>
      ) : (
        users.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.itemTitle}>{item.name || 'Unnamed user'}</Text>
              <View style={[styles.pill, { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.pillText, { color: '#4B5563' }]}>USER</Text>
              </View>
            </View>
            <Text style={styles.itemMeta}>Email: {item.email || '—'}</Text>
            <Text style={styles.itemMeta}>Phone: {item.phone || '—'}</Text>
            <Text style={styles.itemMeta}>Joined: {formatDateTime(item.createdAt)}</Text>
            <Text style={styles.itemMeta}>User ID: {item.id}</Text>
            <View style={styles.divider} />
            <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600' }}>
              Account access is controlled by the SafeHer authentication API.
            </Text>
          </View>
        ))
      )}

      <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: SPACING.sm }}>
        Pull down to refresh user data.
      </Text>
    </ScrollView>
  );
}
