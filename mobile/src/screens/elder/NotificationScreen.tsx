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

import { Card, Loading, ErrorMessage } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from '../../store/api/notificationApi';

const NotificationScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useGetNotificationsQuery({ page: 1, limit: 50 });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId).unwrap();
    } catch (error) {
      console.error('標記已讀失敗:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    Alert.alert(
      '確認',
      '確定要將所有通知標記為已讀嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: async () => {
            try {
              await markAllAsRead().unwrap();
            } catch (error) {
              Alert.alert('錯誤', '操作失敗，請重試');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EXERCISE_REMINDER':
        return { name: 'dumbbell', color: Colors.primary };
      case 'CHILD_MESSAGE':
        return { name: 'message-text', color: Colors.secondary };
      case 'POINTS_EARNED':
        return { name: 'star', color: Colors.warning };
      case 'ACHIEVEMENT':
        return { name: 'trophy', color: Colors.warning };
      case 'BINDING_REQUEST':
        return { name: 'account-plus', color: Colors.info };
      case 'SYSTEM':
        return { name: 'information', color: Colors.textSecondary };
      default:
        return { name: 'bell', color: Colors.primary };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderNotification = ({ item }: { item: any }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        onPress={() => !item.isRead && handleMarkAsRead(item.id)}
        activeOpacity={0.7}
      >
        <Card style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
          <View style={styles.notificationContent}>
            <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
              <Icon name={icon.name} size={24} color={icon.color} />
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>
                {item.title}
              </Text>
              <Text style={styles.notificationBody} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
            </View>

            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>沒有通知</Text>
      <Text style={styles.emptyText}>您目前沒有任何通知</Text>
    </View>
  );

  const unreadCount = notificationsData?.data?.notifications?.filter(
    (n: any) => !n.isRead
  ).length || 0;

  if (isLoading && !refreshing) {
    return <Loading message="載入通知..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="載入失敗，請重試"
        onRetry={refetch}
      />
    );
  }

  const notifications = notificationsData?.data?.notifications || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>通知</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>全部已讀</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Icon name="bell-ring" size={16} color={Colors.primary} />
          <Text style={styles.unreadBannerText}>
            您有 {unreadCount} 則未讀通知
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  markAllButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  markAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  unreadBannerText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  notificationCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
    marginTop: 4,
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

export default NotificationScreen;
