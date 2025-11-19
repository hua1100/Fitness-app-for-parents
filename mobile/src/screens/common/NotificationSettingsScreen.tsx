import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Card, Button, Loading } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useAppSelector } from '../../store';
import { StorageService, StorageKeys } from '../../services/storage.service';

// 通知設定介面
interface NotificationSettings {
  exerciseStart: boolean;
  exerciseEnd: boolean;
  emergency: boolean;
  inactivity: boolean;
  achievement: boolean;
  rewardRedeemed: boolean;
  voiceNew: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const defaultSettings: NotificationSettings = {
  exerciseStart: true,
  exerciseEnd: true,
  emergency: true,
  inactivity: true,
  achievement: true,
  rewardRedeemed: true,
  voiceNew: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useAppSelector((state) => state.auth.user);
  const isElder = user?.role === 'ELDER';

  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // 載入設定
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await StorageService.get<NotificationSettings>(
        StorageKeys.NOTIFICATION_SETTINGS
      );
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('載入通知設定失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 儲存設定
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await StorageService.set(StorageKeys.NOTIFICATION_SETTINGS, settings);
      Alert.alert('成功', '通知設定已儲存');
    } catch (error) {
      Alert.alert('錯誤', '儲存設定失敗');
    } finally {
      setIsSaving(false);
    }
  };

  // 切換設定
  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 時間格式化
  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 處理時間選擇
  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setSettings((prev) => ({
        ...prev,
        quietHoursStart: formatTime(selectedDate),
      }));
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setSettings((prev) => ({
        ...prev,
        quietHoursEnd: formatTime(selectedDate),
      }));
    }
  };

  if (isLoading) {
    return <Loading message="載入設定中..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>通知設定</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 通知類型 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>通知類型</Text>

          {/* 長輩專用通知 */}
          {isElder && (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Icon name="trophy" size={24} color={Colors.warning} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>成就解鎖</Text>
                    <Text style={styles.settingDescription}>解鎖新成就時通知</Text>
                  </View>
                </View>
                <Switch
                  value={settings.achievement}
                  onValueChange={() => toggleSetting('achievement')}
                  trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                  thumbColor={settings.achievement ? Colors.primary : Colors.surface}
                />
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* 子女專用通知 */}
          {!isElder && (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Icon name="play-circle" size={24} color={Colors.success} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>運動開始</Text>
                    <Text style={styles.settingDescription}>長輩開始運動時通知</Text>
                  </View>
                </View>
                <Switch
                  value={settings.exerciseStart}
                  onValueChange={() => toggleSetting('exerciseStart')}
                  trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
                  thumbColor={settings.exerciseStart ? Colors.secondary : Colors.surface}
                />
              </View>
              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Icon name="stop-circle" size={24} color={Colors.primary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>運動結束</Text>
                    <Text style={styles.settingDescription}>長輩結束運動時通知</Text>
                  </View>
                </View>
                <Switch
                  value={settings.exerciseEnd}
                  onValueChange={() => toggleSetting('exerciseEnd')}
                  trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
                  thumbColor={settings.exerciseEnd ? Colors.secondary : Colors.surface}
                />
              </View>
              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Icon name="clock-alert" size={24} color={Colors.warning} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>不活躍提醒</Text>
                    <Text style={styles.settingDescription}>長輩多天未運動時通知</Text>
                  </View>
                </View>
                <Switch
                  value={settings.inactivity}
                  onValueChange={() => toggleSetting('inactivity')}
                  trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
                  thumbColor={settings.inactivity ? Colors.secondary : Colors.surface}
                />
              </View>
              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Icon name="gift" size={24} color={Colors.success} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>獎勵兌換</Text>
                    <Text style={styles.settingDescription}>長輩兌換獎勵時通知</Text>
                  </View>
                </View>
                <Switch
                  value={settings.rewardRedeemed}
                  onValueChange={() => toggleSetting('rewardRedeemed')}
                  trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
                  thumbColor={settings.rewardRedeemed ? Colors.secondary : Colors.surface}
                />
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* 共用通知 */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="alert-circle" size={24} color={Colors.error} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>緊急求助</Text>
                <Text style={styles.settingDescription}>緊急求助通知（建議開啟）</Text>
              </View>
            </View>
            <Switch
              value={settings.emergency}
              onValueChange={() => toggleSetting('emergency')}
              trackColor={{ false: Colors.border, true: Colors.error + '80' }}
              thumbColor={settings.emergency ? Colors.error : Colors.surface}
            />
          </View>

          {!isElder && (
            <>
              <View style={styles.divider} />
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Icon name="microphone" size={24} color={Colors.secondary} />
                  <View style={styles.settingText}>
                    <Text style={styles.settingLabel}>新語音訊息</Text>
                    <Text style={styles.settingDescription}>收到新語音訊息時通知</Text>
                  </View>
                </View>
                <Switch
                  value={settings.voiceNew}
                  onValueChange={() => toggleSetting('voiceNew')}
                  trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
                  thumbColor={settings.voiceNew ? Colors.secondary : Colors.surface}
                />
              </View>
            </>
          )}
        </Card>

        {/* 勿擾時段 */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>勿擾時段</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Icon name="moon-waning-crescent" size={24} color={Colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>啟用勿擾時段</Text>
                <Text style={styles.settingDescription}>
                  在指定時段內不發送通知（緊急求助除外）
                </Text>
              </View>
            </View>
            <Switch
              value={settings.quietHoursEnabled}
              onValueChange={() => toggleSetting('quietHoursEnabled')}
              trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
              thumbColor={settings.quietHoursEnabled ? Colors.primary : Colors.surface}
            />
          </View>

          {settings.quietHoursEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.timeSettings}>
                <TouchableOpacity
                  style={styles.timeItem}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.timeLabel}>開始時間</Text>
                  <Text style={styles.timeValue}>{settings.quietHoursStart}</Text>
                </TouchableOpacity>

                <Icon name="arrow-right" size={20} color={Colors.textSecondary} />

                <TouchableOpacity
                  style={styles.timeItem}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.timeLabel}>結束時間</Text>
                  <Text style={styles.timeValue}>{settings.quietHoursEnd}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>

        {/* 儲存按鈕 */}
        <Button
          title="儲存設定"
          onPress={saveSettings}
          loading={isSaving}
          style={styles.saveButton}
        />
      </ScrollView>

      {/* 時間選擇器 */}
      {showStartPicker && (
        <DateTimePicker
          value={parseTime(settings.quietHoursStart)}
          mode="time"
          is24Hour={true}
          onChange={handleStartTimeChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={parseTime(settings.quietHoursEnd)}
          mode="time"
          is24Hour={true}
          onChange={handleEndTimeChange}
        />
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
  placeholder: {
    width: 32,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  timeSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timeValue: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
});

export default NotificationSettingsScreen;
