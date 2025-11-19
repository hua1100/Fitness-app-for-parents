import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card, Loading, ErrorMessage, ConfirmDialog } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import {
  useGetRewardsQuery,
  useGetUserPointsQuery,
  useRedeemRewardMutation,
} from '../../store/api/rewardApi';

const RewardShopScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    data: rewardsData,
    isLoading: rewardsLoading,
    error: rewardsError,
    refetch: refetchRewards,
  } = useGetRewardsQuery({ page: 1, limit: 50 });

  const {
    data: pointsData,
    refetch: refetchPoints,
  } = useGetUserPointsQuery();

  const [redeemReward, { isLoading: isRedeeming }] = useRedeemRewardMutation();

  useFocusEffect(
    useCallback(() => {
      refetchRewards();
      refetchPoints();
    }, [refetchRewards, refetchPoints])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchRewards(), refetchPoints()]);
    setRefreshing(false);
  };

  const handleRewardPress = (reward: any) => {
    setSelectedReward(reward);
    setShowConfirm(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;

    const userPoints = pointsData?.data?.points || 0;
    if (userPoints < selectedReward.pointsCost) {
      Alert.alert('點數不足', '您的點數不足以兌換此獎項');
      setShowConfirm(false);
      return;
    }

    try {
      await redeemReward(selectedReward.id).unwrap();
      Alert.alert(
        '兌換成功',
        `恭喜您成功兌換「${selectedReward.name}」！`,
        [{ text: '太棒了' }]
      );
      refetchPoints();
    } catch (error: any) {
      Alert.alert('兌換失敗', error.data?.error?.message || '請稍後再試');
    }

    setShowConfirm(false);
    setSelectedReward(null);
  };

  const renderPointsCard = () => {
    const points = pointsData?.data?.points || 0;

    return (
      <Card style={styles.pointsCard}>
        <View style={styles.pointsContent}>
          <Icon name="star-circle" size={40} color={Colors.warning} />
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>我的點數</Text>
            <Text style={styles.pointsValue}>{points}</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderReward = ({ item }: { item: any }) => {
    const userPoints = pointsData?.data?.points || 0;
    const canRedeem = userPoints >= item.pointsCost;

    return (
      <TouchableOpacity
        onPress={() => handleRewardPress(item)}
        activeOpacity={0.7}
        disabled={!canRedeem}
      >
        <Card style={[styles.rewardCard, !canRedeem && styles.disabledCard]}>
          <View style={styles.rewardIcon}>
            <Icon
              name={item.isSystem ? 'gift' : 'heart'}
              size={32}
              color={canRedeem ? Colors.primary : Colors.textSecondary}
            />
          </View>

          <View style={styles.rewardInfo}>
            <Text style={[styles.rewardName, !canRedeem && styles.disabledText]}>
              {item.name}
            </Text>
            {item.description && (
              <Text
                style={[styles.rewardDescription, !canRedeem && styles.disabledText]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}

            <View style={styles.rewardFooter}>
              <View style={styles.pointsCost}>
                <Icon
                  name="star"
                  size={16}
                  color={canRedeem ? Colors.warning : Colors.textSecondary}
                />
                <Text
                  style={[styles.pointsCostText, !canRedeem && styles.disabledText]}
                >
                  {item.pointsCost}
                </Text>
              </View>

              {item.isSystem ? (
                <View style={styles.systemBadge}>
                  <Text style={styles.systemBadgeText}>系統</Text>
                </View>
              ) : (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>自訂</Text>
                </View>
              )}
            </View>
          </View>

          {canRedeem && (
            <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="gift-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>暫無獎項</Text>
      <Text style={styles.emptyText}>獎項商城正在準備中</Text>
    </View>
  );

  if (rewardsLoading && !refreshing) {
    return <Loading message="載入獎項..." />;
  }

  if (rewardsError) {
    return (
      <ErrorMessage
        message="載入失敗，請重試"
        onRetry={refetchRewards}
      />
    );
  }

  const rewards = rewardsData?.data?.rewards || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>獎項商城</Text>
      </View>

      <FlatList
        data={rewards}
        renderItem={renderReward}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderPointsCard}
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

      <ConfirmDialog
        visible={showConfirm}
        title="確認兌換"
        message={
          selectedReward
            ? `確定要用 ${selectedReward.pointsCost} 點數兌換「${selectedReward.name}」嗎？`
            : ''
        }
        confirmText="兌換"
        cancelText="取消"
        onConfirm={handleConfirmRedeem}
        onCancel={() => {
          setShowConfirm(false);
          setSelectedReward(null);
        }}
        loading={isRedeeming}
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
  pointsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.warning + '15',
  },
  pointsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsInfo: {
    marginLeft: Spacing.md,
  },
  pointsLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  pointsValue: {
    fontSize: FontSizes.header,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  disabledCard: {
    opacity: 0.6,
  },
  rewardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  rewardDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsCostText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 4,
  },
  systemBadge: {
    backgroundColor: Colors.info + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  systemBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.info,
    fontWeight: '500',
  },
  customBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.secondary,
    fontWeight: '500',
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

export default RewardShopScreen;
