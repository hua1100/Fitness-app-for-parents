import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card, Loading, ErrorMessage } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useGetMyExerciseRecordsQuery, useGetMyStatsQuery } from '../../store/api/exerciseApi';

const ExerciseListScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: recordsData,
    isLoading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords,
  } = useGetMyExerciseRecordsQuery({ page: 1, limit: 50 });

  const {
    data: statsData,
    refetch: refetchStats,
  } = useGetMyStatsQuery({ period: 'week' });

  useFocusEffect(
    useCallback(() => {
      refetchRecords();
      refetchStats();
    }, [refetchRecords, refetchStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchRecords(), refetchStats()]);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} 分 ${secs} 秒`;
    }
    return `${secs} 秒`;
  };

  const renderStatsCard = () => {
    if (!statsData?.data) return null;

    const stats = statsData.data;
    return (
      <Card style={styles.statsCard}>
        <Text style={styles.statsTitle}>本週統計</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="clock-outline" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.totalMinutes}</Text>
            <Text style={styles.statLabel}>總分鐘</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="counter" size={24} color={Colors.secondary} />
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>運動次數</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="star" size={24} color={Colors.warning} />
            <Text style={styles.statValue}>{stats.totalPoints}</Text>
            <Text style={styles.statLabel}>獲得點數</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderRecord = ({ item }: { item: any }) => (
    <Card style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordDate}>
          <Icon name="calendar" size={16} color={Colors.textSecondary} />
          <Text style={styles.recordDateText}>{formatDate(item.startTime)}</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Icon name="star" size={14} color={Colors.warning} />
          <Text style={styles.pointsText}>+{item.pointsEarned}</Text>
        </View>
      </View>

      <View style={styles.recordBody}>
        <View style={styles.recordInfo}>
          <Text style={styles.recordTime}>
            {formatTime(item.startTime)} - {item.endTime ? formatTime(item.endTime) : '進行中'}
          </Text>
          <Text style={styles.recordDuration}>
            {item.duration ? formatDuration(item.duration) : '計時中...'}
          </Text>
        </View>

        {item.status === 'COMPLETED' && (
          <View style={styles.completedBadge}>
            <Icon name="check-circle" size={20} color={Colors.success} />
          </View>
        )}
      </View>

      {item.emergencyTriggered && (
        <View style={styles.emergencyTag}>
          <Icon name="alert" size={14} color={Colors.error} />
          <Text style={styles.emergencyText}>緊急求助已觸發</Text>
        </View>
      )}
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="clipboard-text-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>尚無運動記錄</Text>
      <Text style={styles.emptyText}>開始您的第一次運動吧！</Text>
    </View>
  );

  if (recordsLoading && !refreshing) {
    return <Loading message="載入運動記錄..." />;
  }

  if (recordsError) {
    return (
      <ErrorMessage
        message="載入失敗，請重試"
        onRetry={refetchRecords}
      />
    );
  }

  const records = recordsData?.data?.records || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>運動記錄</Text>
      </View>

      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderStatsCard}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.header,
    fontWeight: 'bold',
    color: Colors.text,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  statsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  statsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  recordCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  recordDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDateText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 4,
  },
  recordBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordTime: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  recordDuration: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  completedBadge: {
    marginLeft: Spacing.md,
  },
  emergencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  emergencyText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    marginLeft: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});

export default ExerciseListScreen;
