import React, { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACTIVE_SOS_STORAGE_KEY, stopSOSAlarm } from '../services/sosAudioService';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../utils/constants';
import { emergencyAPI } from '../services/api';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await emergencyAPI.getAll();
      console.log('📋 History Response:', response.data);
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('❌ History Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleResolve = async (item) => {
    Alert.alert(
      'Mark as Resolved',
      'Confirm that this emergency has been resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              await emergencyAPI.resolve(item.id);
              await AsyncStorage.removeItem(ACTIVE_SOS_STORAGE_KEY).catch(() => {});
              DeviceEventEmitter.emit('safeher:sos-resolved');
              await stopSOSAlarm();
              fetchHistory();
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            item.status === 'RESOLVED' ? styles.resolvedBadge : styles.activeBadge,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.status === 'RESOLVED' ? styles.resolvedText : styles.activeText,
            ]}
          >
            {item.status === 'RESOLVED' ? '✓ Resolved' : '⚠ Active'}
          </Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>
          {item.address || `Location: ${parseFloat(item.latitude).toFixed(4)}, ${parseFloat(item.longitude).toFixed(4)}`}
        </Text>
      </View>

      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesText}>
          Lat: {parseFloat(item.latitude).toFixed(6)}, Long: {parseFloat(item.longitude).toFixed(6)}
        </Text>
      </View>

      {item.status !== 'RESOLVED' && (
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={() => handleResolve(item)}
        >
          <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency History</Text>
        <Text style={styles.subtitle}>
          {history.length} alert{history.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* History List */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No emergency history</Text>
          <Text style={styles.emptySubtext}>
            Your past SOS alerts will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchHistory}
        />
      )}
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    padding: SPACING.lg,
  },
  historyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  dateContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  resolvedBadge: {
    backgroundColor: COLORS.success + '20',
  },
  activeBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resolvedText: {
    color: COLORS.success,
  },
  activeText: {
    color: COLORS.warning,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  coordinatesContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  resolveButton: {
    backgroundColor: COLORS.success,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
