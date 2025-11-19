import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card, Loading, ErrorMessage } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import {
  useGetAchievementsQuery,
  useGetAchievementProgressQuery,
} from '../../store/api/achievementApi';

const AchievementsScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: achievementsData,
    isLoading: achievementsLoading,
    error: achievementsError,
    refetch: refetchAchievements,
  } = useGetAchievementsQuery();

  const {
    data: progressData,
    refetch: refetchProgress,
  } = useGetAchievementProgressQuery();

  useFocusEffect(
    useCallback(() => {
      refetchAchievements();
      refetchProgress();
    }, [refetchAchievements, refetchProgress])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAchievements(), refetchProgress()]);
    setRefreshing(false);
  };

  const renderProgressCard = () => {
    const progress = progressData?.data;
    if (!progress) return null;

    return (
      <Card style={styles.progressCard}>
        <Text style={styles.progressTitle}>成就進度</Text>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress.completionRate}%` },
            ]}
          />
        </View>

        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Icon name="trophy" size={20} color={Colors.warning} />
            <Text style={styles.progressStatValue}>{progress.unlocked}</Text>
            <Text style={styles.progressStatLabel}>已解鎖</Text>
          </View>

          <View style={styles.progressStat}>
            <Icon name="trophy-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.progressStatValue}>{progress.locked}</Text>
            <Text style={styles.progressStatLabel}>待解鎖</Text>
          </View>

          <View style={styles.progressStat}>
            <Icon name="star" size={20} color={Colors.primary} />
            <Text style={styles.progressStatValue}>{progress.totalBonusEarned}</Text>
            <Text style={styles.progressStatLabel}>獎勵點數</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderAchievement = ({ item }: { item: any }) => {
    const isUnlocked = item.isUnlocked;

    return (
      <Card style={[styles.achievementCard, !isUnlocked && styles.lockedCard]}>
        <View style={styles.achievementContent}>
          <View
            style={[
              styles.achievementIcon,
              isUnlocked && styles.unlockedIcon,
            ]}
          >
            <Icon
              name={isUnlocked ? 'trophy' : 'trophy-outline'}
              size={28}
              color={isUnlocked ? Colors.warning : Colors.textSecondary}
            />
          </View>

          <View style={styles.achievementInfo}>
            <Text
              style={[
                styles.achievementName,
                !isUnlocked && styles.lockedText,
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.achievementDescription,
                !isUnlocked && styles.lockedText,
              ]}
            >
              {item.description}
            </Text>

            {isUnlocked ? (
              <View style={styles.unlockedBadge}>
                <Icon name="check-circle" size={14} color={Colors.success} />
                <Text style={styles.unlockedText}>
                  {new Date(item.unlockedAt).toLocaleDateString('zh-TW')} 解鎖
                </Text>
              </View>
            ) : (
              <View style={styles.progressContainer}>
                <View style={styles.miniProgressBar}>
                  <View
                    style={[
                      styles.miniProgressFill,
                      { width: `${item.progress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{item.progress}%</Text>
              </View>
            )}
          </View>

          {item.pointsBonus > 0 && (
            <View style={styles.bonusBadge}>
              <Icon name="star" size={12} color={Colors.warning} />
              <Text style={styles.bonusText}>+{item.pointsBonus}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="trophy-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>暫無成就</Text>
      <Text style={styles.emptyText}>開始運動來解鎖您的第一個成就</Text>
    </View>
  );

  if (achievementsLoading && !refreshing) {
    return <Loading message="載入成就..." />;
  }

  if (achievementsError) {
    return (
      <ErrorMessage
        message="載入失敗，請重試"
        onRetry={refetchAchievements}
      />
    );
  }

  const achievements = achievementsData?.data || [];

  // 排序：已解鎖在前，未解鎖按進度排序
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    if (!a.isUnlocked && !b.isUnlocked) {
      return b.progress - a.progress;
    }
    return new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime();
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的成就</Text>
      </View>

      <FlatList
        data={sortedAchievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderProgressCard}
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
  progressCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  progressTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  progressStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  achievementCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  lockedCard: {
    opacity: 0.7,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  unlockedIcon: {
    backgroundColor: Colors.warning + '20',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  achievementDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  unlockedText: {
    fontSize: FontSizes.xs,
    color: Colors.success,
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  miniProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    width: 35,
    textAlign: 'right',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 2,
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

export default AchievementsScreen;
