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
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card, Button, Loading, ErrorMessage } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import {
  useGetVoicesQuery,
  useGetVoiceQuotaQuery,
  useDeleteVoiceMutation,
  useBatchDeleteVoicesMutation,
} from '../../store/api/voiceApi';
import { ChildStackParamList } from '../../navigation/ChildNavigator';

type RouteParams = RouteProp<ChildStackParamList, 'VoiceManage'>;

const VoiceManageScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { elderId, elderName } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const {
    data: voicesData,
    isLoading: voicesLoading,
    error: voicesError,
    refetch: refetchVoices,
  } = useGetVoicesQuery({ elderId, page: 1, limit: 50 });

  const {
    data: quotaData,
    refetch: refetchQuota,
  } = useGetVoiceQuotaQuery(elderId);

  const [deleteVoice] = useDeleteVoiceMutation();
  const [batchDelete, { isLoading: isBatchDeleting }] = useBatchDeleteVoicesMutation();

  useFocusEffect(
    useCallback(() => {
      refetchVoices();
      refetchQuota();
    }, [refetchVoices, refetchQuota])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchVoices(), refetchQuota()]);
    setRefreshing(false);
  };

  const handleSelectVoice = (voiceId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(voiceId)) {
      newSelected.delete(voiceId);
    } else {
      newSelected.add(voiceId);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteVoice = (voiceId: string) => {
    Alert.alert(
      '確認刪除',
      '確定要刪除這段語音嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVoice(voiceId).unwrap();
              refetchQuota();
            } catch (error) {
              Alert.alert('錯誤', '刪除失敗，請重試');
            }
          },
        },
      ]
    );
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;

    Alert.alert(
      '確認刪除',
      `確定要刪除選中的 ${selectedIds.size} 段語音嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await batchDelete({ voiceIds: Array.from(selectedIds) }).unwrap();
              setSelectedIds(new Set());
              setIsSelectMode(false);
              refetchQuota();
            } catch (error) {
              Alert.alert('錯誤', '刪除失敗，請重試');
            }
          },
        },
      ]
    );
  };

  const handleRecord = () => {
    // TODO: 導航到錄音頁面或開啟錄音元件
    Alert.alert('提示', '錄音功能即將推出！\n\n請期待下一版本更新。');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `0:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderQuotaCard = () => {
    const quota = quotaData?.data?.quota;
    if (!quota) return null;

    const percentage = (quota.used / quota.limit) * 100;

    return (
      <Card style={styles.quotaCard}>
        <View style={styles.quotaHeader}>
          <Text style={styles.quotaTitle}>語音配額</Text>
          <Text style={styles.quotaText}>
            {quota.used} / {quota.limit}
          </Text>
        </View>
        <View style={styles.quotaBar}>
          <View
            style={[
              styles.quotaFill,
              { width: `${percentage}%` },
              percentage > 80 && styles.quotaWarning,
            ]}
          />
        </View>
        <Text style={styles.quotaRemaining}>
          還可錄製 {quota.remaining} 段語音
        </Text>
      </Card>
    );
  };

  const renderVoiceItem = ({ item }: { item: any }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        onPress={() => isSelectMode ? handleSelectVoice(item.id) : null}
        onLongPress={() => {
          setIsSelectMode(true);
          handleSelectVoice(item.id);
        }}
        activeOpacity={isSelectMode ? 0.7 : 1}
      >
        <Card style={[styles.voiceCard, isSelected && styles.voiceCardSelected]}>
          <View style={styles.voiceContent}>
            {isSelectMode && (
              <View style={styles.checkbox}>
                <Icon
                  name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={isSelected ? Colors.secondary : Colors.textSecondary}
                />
              </View>
            )}

            <View style={styles.voiceIcon}>
              <Icon name="microphone" size={24} color={Colors.secondary} />
            </View>

            <View style={styles.voiceInfo}>
              <Text style={styles.voiceDuration}>
                {formatDuration(item.duration)}
              </Text>
              <Text style={styles.voiceDate}>
                {formatDate(item.createdAt)}
              </Text>
            </View>

            <View style={styles.voiceStats}>
              <Icon name="play-circle-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.playCount}>{item.playCount}</Text>
            </View>

            {!isSelectMode && (
              <TouchableOpacity
                onPress={() => handleDeleteVoice(item.id)}
                style={styles.deleteButton}
              >
                <Icon name="delete-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="microphone-off" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>尚無語音</Text>
      <Text style={styles.emptyText}>
        錄製一段鼓勵語音給 {elderName} 吧！
      </Text>
    </View>
  );

  if (voicesLoading && !refreshing) {
    return <Loading message="載入語音..." />;
  }

  if (voicesError) {
    return (
      <ErrorMessage
        message="載入失敗，請重試"
        onRetry={refetchVoices}
      />
    );
  }

  const voices = voicesData?.data?.voices || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>語音鼓勵</Text>
        {isSelectMode ? (
          <TouchableOpacity
            onPress={() => {
              setIsSelectMode(false);
              setSelectedIds(new Set());
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <View style={styles.elderInfo}>
        <Icon name="account" size={20} color={Colors.textSecondary} />
        <Text style={styles.elderName}>{elderName}</Text>
      </View>

      <FlatList
        data={voices}
        renderItem={renderVoiceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderQuotaCard}
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

      {isSelectMode && selectedIds.size > 0 ? (
        <View style={styles.bottomBar}>
          <Button
            title={`刪除 (${selectedIds.size})`}
            onPress={handleBatchDelete}
            loading={isBatchDeleting}
            style={styles.deleteAllButton}
          />
        </View>
      ) : (
        <View style={styles.bottomBar}>
          <Button
            title="錄製語音"
            onPress={handleRecord}
            disabled={quotaData?.data?.quota?.remaining === 0}
            style={styles.recordButton}
          />
        </View>
      )}
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
  cancelButton: {
    padding: Spacing.xs,
  },
  cancelText: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
  },
  placeholder: {
    width: 40,
  },
  elderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.secondary + '10',
  },
  elderName: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  quotaCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quotaTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  quotaText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  quotaBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  quotaFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  quotaWarning: {
    backgroundColor: Colors.warning,
  },
  quotaRemaining: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  voiceCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  voiceCardSelected: {
    borderColor: Colors.secondary,
    borderWidth: 2,
  },
  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: Spacing.sm,
  },
  voiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceDuration: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  voiceDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  voiceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  playCount: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  deleteButton: {
    padding: Spacing.xs,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recordButton: {
    backgroundColor: Colors.secondary,
  },
  deleteAllButton: {
    backgroundColor: Colors.error,
  },
});

export default VoiceManageScreen;
