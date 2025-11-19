import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card, Loading, ErrorMessage } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useGetElderRecordsQuery, useGetElderStatsQuery } from '../../store/api/exerciseApi';
import { ChildStackParamList } from '../../navigation/ChildNavigator';

type RouteParams = RouteProp<ChildStackParamList, 'ElderDetail'>;

const ElderDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { elderId, elderName } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetElderStatsQuery({ elderId, period: 'week' });

  const {
    data: recordsData,
    isLoading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords,
  } = useGetElderRecordsQuery({ elderId, page: 1, limit: 20 });

  useFocusEffect(
    useCallback(() => {
      refetchStats();
      refetchRecords();
    }, [refetchStats, refetchRecords])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchRecords()]);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
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
    return `${mins} 分鐘`;
  };

  const isLoading = (statsLoading || recordsLoading) && !refreshing;

  if (isLoading) {
    return <Loading message="載入中..." />;
  }

  if (recordsError) {
    return (
      <ErrorMessage
        message="載入失敗，請重試"
        onRetry={() => {
          refetchStats();
          refetchRecords();
        }}
      />
    );
  }

  const stats = statsData?.data;
  const records = recordsData?.data?.records || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{elderName}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.secondary]}
            tintColor={Colors.secondary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 本週統計 */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>本週統計</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="clock-outline" size={24} color={Colors.secondary} />
              <Text style={styles.statValue}>{stats?.totalMinutes || 0}</Text>
              <Text style={styles.statLabel}>總分鐘</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="counter" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{stats?.totalSessions || 0}</Text>
              <Text style={styles.statLabel}>運動次數</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="star" size={24} color={Colors.warning} />
              <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
              <Text style={styles.statLabel}>獲得點數</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="fire" size={24} color={Colors.error} />
              <Text style={styles.statValue}>{stats?.streak || 0}</Text>
              <Text style={styles.statLabel}>連續天數</Text>
            </View>
          </View>
        </Card>

        {/* 運動記錄 */}
        <View style={styles.recordsSection}>
          <Text style={styles.sectionTitle}>最近運動</Text>

          {records.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Icon name="clipboard-text-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>尚無運動記錄</Text>
            </Card>
          ) : (
            records.map((record: any) => (
              <Card key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{formatDate(record.startTime)}</Text>
                  <View style={styles.pointsBadge}>
                    <Icon name="star" size={12} color={Colors.warning} />
                    <Text style={styles.pointsText}>+{record.pointsEarned}</Text>
                  </View>
                </View>

                <View style={styles.recordBody}>
                  <Text style={styles.recordTime}>
                    {formatTime(record.startTime)}
                    {record.endTime && ` - ${formatTime(record.endTime)}`}
                  </Text>
                  <Text style={styles.recordDuration}>
                    {record.duration ? formatDuration(record.duration) : '進行中'}
                  </Text>
                </View>

                {record.emergencyTriggered && (
                  <View style={styles.emergencyTag}>
                    <Icon name="alert" size={14} color={Colors.error} />
                    <Text style={styles.emergencyText}>緊急求助</Text>
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  statsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  recordsSection: {
    marginTop: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  recordCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  recordDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pointsText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 2,
  },
  recordBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordTime: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  recordDuration: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.secondary,
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
});

export default ElderDetailScreen;
