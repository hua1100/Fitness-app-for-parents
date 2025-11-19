import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card, Loading, ErrorMessage } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useGetBindingsQuery } from '../../store/api/bindingApi';
import { ChildStackParamList } from '../../navigation/ChildNavigator';

type NavigationProp = NativeStackNavigationProp<ChildStackParamList>;

const ElderListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

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

  const renderElderItem = ({ item }: { item: any }) => {
    if (item.status !== 'CONFIRMED') return null;

    return (
      <TouchableOpacity
        onPress={() => handleElderPress(item.elder.id, item.elder.name)}
        activeOpacity={0.7}
      >
        <Card style={styles.elderCard}>
          <View style={styles.elderHeader}>
            <View style={styles.elderAvatar}>
              <Icon name="account" size={28} color={Colors.surface} />
            </View>
            <View style={styles.elderInfo}>
              <Text style={styles.elderName}>{item.elder.name}</Text>
              <Text style={styles.elderPhone}>{item.elder.phone}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
          </View>

          <View style={styles.elderStats}>
            <View style={styles.statBox}>
              <Icon name="clock-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.statLabel}>最後活動</Text>
              <Text style={styles.statValue}>
                {formatLastActivity(item.elder.lastActivityAt)}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Icon name="star" size={18} color={Colors.warning} />
              <Text style={styles.statLabel}>累積點數</Text>
              <Text style={styles.statValue}>{item.elder.points || 0}</Text>
            </View>

            <View style={styles.statBox}>
              <Icon name="calendar-check" size={18} color={Colors.success} />
              <Text style={styles.statLabel}>本週運動</Text>
              <Text style={styles.statValue}>0 次</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="account-group-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>尚未綁定長輩</Text>
      <Text style={styles.emptyText}>
        點擊右上角的按鈕，輸入長輩的綁定碼
      </Text>
    </View>
  );

  if (isLoading && !refreshing) {
    return <Loading message="載入長輩列表..." />;
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
      <View style={styles.header}>
        <Text style={styles.title}>我的長輩</Text>
        <TouchableOpacity onPress={handleAddBinding} style={styles.addButton}>
          <Icon name="plus" size={24} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={confirmedBindings}
        renderItem={renderElderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.secondary]}
            tintColor={Colors.secondary}
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
  addButton: {
    padding: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  elderCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  elderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  elderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  elderName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  elderPhone: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  elderStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
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
    textAlign: 'center',
  },
});

export default ElderListScreen;
