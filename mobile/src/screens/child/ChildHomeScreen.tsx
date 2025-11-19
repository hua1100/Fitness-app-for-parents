import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card, Loading, ErrorMessage } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useAppSelector } from '../../store';
import { useGetBindingsQuery } from '../../store/api/bindingApi';
import { ChildStackParamList } from '../../navigation/ChildNavigator';

type NavigationProp = NativeStackNavigationProp<ChildStackParamList>;

const ChildHomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAppSelector((state) => state.auth.user);
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data: bindingsData,
    isLoading,
    error,
    refetch,
  } = useGetBindingsQuery();

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

  const handleElderPress = (elderId: string, elderName: string) => {
    navigation.navigate('ElderDetail', { elderId, elderName });
  };

  const handleAddBinding = () => {
    navigation.navigate('BindingInput');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  const formatLastActivity = (dateString?: string) => {
    if (!dateString) return '尚無活動';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    return `${diffDays} 天前`;
  };

  if (isLoading && !refreshing) {
    return <Loading message="載入中..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="載入失敗，請重試"
        onRetry={refetch}
      />
    );
  }

  const bindings = bindingsData?.data?.bindings || [];
  const confirmedBindings = bindings.filter((b: any) => b.status === 'CONFIRMED');

  return (
    <View style={styles.container}>
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
        {/* 問候區 */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{getGreeting()}，</Text>
          <Text style={styles.userName}>{user?.name || '使用者'}</Text>
        </View>

        {/* 快速統計 */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="account-heart" size={28} color={Colors.secondary} />
              <Text style={styles.statValue}>{confirmedBindings.length}</Text>
              <Text style={styles.statLabel}>關懷長輩</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Icon name="calendar-check" size={28} color={Colors.success} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>今日運動</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Icon name="bell-ring" size={28} color={Colors.warning} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>待處理</Text>
            </View>
          </View>
        </Card>

        {/* 長輩狀態 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>長輩狀態</Text>
          <TouchableOpacity onPress={handleAddBinding}>
            <Icon name="plus-circle" size={24} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {confirmedBindings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Icon name="account-plus-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>尚未綁定長輩</Text>
            <Text style={styles.emptyText}>
              點擊右上角的 + 按鈕，輸入長輩的綁定碼開始關懷
            </Text>
            <TouchableOpacity
              onPress={handleAddBinding}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>新增綁定</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          confirmedBindings.map((binding: any) => (
            <TouchableOpacity
              key={binding.id}
              onPress={() => handleElderPress(binding.elder.id, binding.elder.name)}
              activeOpacity={0.7}
            >
              <Card style={styles.elderCard}>
                <View style={styles.elderInfo}>
                  <View style={styles.elderAvatar}>
                    <Icon name="account" size={24} color={Colors.surface} />
                  </View>
                  <View style={styles.elderDetails}>
                    <Text style={styles.elderName}>{binding.elder.name}</Text>
                    <Text style={styles.elderActivity}>
                      最後活動：{formatLastActivity(binding.elder.lastActivityAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.elderStats}>
                  <View style={styles.elderStat}>
                    <Icon name="star" size={16} color={Colors.warning} />
                    <Text style={styles.elderStatText}>
                      {binding.elder.points || 0}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* 待處理綁定請求 */}
        {bindings.filter((b: any) => b.status === 'PENDING').length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>待確認綁定</Text>
            </View>
            {bindings
              .filter((b: any) => b.status === 'PENDING')
              .map((binding: any) => (
                <Card key={binding.id} style={styles.pendingCard}>
                  <Icon name="clock-outline" size={24} color={Colors.warning} />
                  <View style={styles.pendingInfo}>
                    <Text style={styles.pendingTitle}>
                      等待 {binding.elder.name} 確認
                    </Text>
                    <Text style={styles.pendingText}>
                      綁定請求已送出，請等待長輩確認
                    </Text>
                  </View>
                </Card>
              ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  greetingSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSizes.header,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  addButtonText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
  elderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  elderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  elderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elderDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  elderName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  elderActivity: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  elderStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  elderStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  elderStatText: {
    fontSize: FontSizes.sm,
    color: Colors.warning,
    fontWeight: '600',
    marginLeft: 4,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.warning + '10',
  },
  pendingInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  pendingTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
  },
  pendingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default ChildHomeScreen;
