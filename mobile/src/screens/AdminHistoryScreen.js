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
import { adminAPI } from '../services/api';
import { SPACING, FONTS } from '../utils/constants';
import { adminStyles as styles } from './adminStyles';
import { formatDateTime } from '../utils/admin';

const FILTERS = ['ALL', 'ACTIVE', 'RESOLVED', 'CANCELLED'];

export default function AdminHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = filter === 'ALL' ? {} : { status: filter };
      const response = await adminAPI.getHistory(params);
      setHistory(response.data.data || []);
    } catch (error) {
      Alert.alert(
        'Unable to load history',
        error.response?.data?.message || 'Please try again.'
      );
    } finally {
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadHistory} />}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Monitoring</Text>
        <Text style={styles.title}>Emergency History</Text>
        <Text style={styles.subtitle}>Review every emergency recorded by SafeHer.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {FILTERS.map((item) => {
            const selected = item === filter;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setFilter(item)}
                style={{
                  paddingHorizontal: SPACING.md,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: selected ? '#F5F3FF' : '#fff',
                  borderWidth: 1,
                  borderColor: selected ? '#C4B5FD' : '#E5E7EB',
                }}
              >
                <Text style={{ color: selected ? '#6D28D9' : '#6B7280', fontFamily: FONTS.bodyBold, fontSize: 12 }}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.card}>
        {history.length === 0 ? (
          <Text style={styles.empty}>No emergencies found for this filter.</Text>
        ) : (
          history.map((item) => (
            <View key={item.id} style={{ marginBottom: SPACING.md }}>
              <View style={styles.row}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.User?.name || item.user?.name || 'Unknown user'}
                </Text>
                <View style={[styles.pill, { backgroundColor: item.status === 'ACTIVE' ? '#FEF2F2' : '#F3F4F6' }]}>
                  <Text style={[styles.pillText, { color: item.status === 'ACTIVE' ? '#DC2626' : '#4B5563' }]}>
                    {item.status || 'UNKNOWN'}
                  </Text>
                </View>
              </View>
              <Text style={styles.itemMeta}>Trigger: {item.triggerType || 'SOS'}</Text>
              <Text style={styles.itemMeta}>Started: {formatDateTime(item.startedAt || item.createdAt)}</Text>
              <Text style={styles.itemMeta}>Ended: {formatDateTime(item.endedAt)}</Text>
              <Text style={styles.itemMeta} numberOfLines={2}>
                {item.address || `${item.latitude ?? '—'}, ${item.longitude ?? '—'}`}
              </Text>
              <View style={styles.divider} />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
