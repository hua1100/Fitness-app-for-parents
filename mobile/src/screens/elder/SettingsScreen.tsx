import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearUser } from '../../store/slices/authSlice';
import { useLogoutMutation } from '../../store/api/authApi';
import { ElderStackParamList } from '../../navigation/ElderNavigator';

type NavigationProp = NativeStackNavigationProp<ElderStackParamList>;

interface SettingItemProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor = Colors.text,
  title,
  subtitle,
  onPress,
  showArrow = true,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
      )}
    </View>
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [logout] = useLogoutMutation();

  const handleLogout = () => {
    Alert.alert(
      '確認登出',
      '確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '登出',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout().unwrap();
            } catch (error) {
              // 即使 API 失敗也要清除本地資料
            }

            // 清除本地存儲
            await AsyncStorage.multiRemove([
              'accessToken',
              'refreshToken',
              'userRole',
              'userId',
            ]);

            // 清除 Redux state
            dispatch(clearUser());
          },
        },
      ]
    );
  };

  const handleBindingCode = () => {
    navigation.navigate('BindingCode');
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const handleNotificationSettings = () => {
    // TODO: 導航到通知設定頁面
    Alert.alert('提示', '通知設定功能即將推出');
  };

  const handleAbout = () => {
    Alert.alert(
      '關於應用',
      '長輩運動關懷 App\n版本 1.0.0\n\n讓運動成為每日的小確幸',
      [{ text: '確定' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 個人資料 */}
        <Card style={styles.profileCard}>
          <TouchableOpacity onPress={handleProfile} activeOpacity={0.7}>
            <View style={styles.profileContent}>
              <View style={styles.avatar}>
                <Icon name="account" size={32} color={Colors.surface} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || '使用者'}</Text>
                <Text style={styles.profileRole}>長輩帳號</Text>
              </View>
              <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </Card>

        {/* 功能設定 */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>功能</Text>

          <SettingItem
            icon="qrcode"
            iconColor={Colors.primary}
            title="綁定碼"
            subtitle="生成與子女綁定的代碼"
            onPress={handleBindingCode}
          />

          <View style={styles.divider} />

          <SettingItem
            icon="bell-outline"
            iconColor={Colors.secondary}
            title="通知設定"
            subtitle="管理推播通知偏好"
            onPress={handleNotificationSettings}
          />
        </Card>

        {/* 其他 */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>其他</Text>

          <SettingItem
            icon="information-outline"
            iconColor={Colors.info}
            title="關於"
            subtitle="版本資訊"
            onPress={handleAbout}
          />

          <View style={styles.divider} />

          <SettingItem
            icon="logout"
            iconColor={Colors.error}
            title="登出"
            onPress={handleLogout}
            showArrow={false}
          />
        </Card>

        <Text style={styles.versionText}>版本 1.0.0</Text>
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
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  profileCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  profileRole: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
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
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
    marginLeft: 56,
  },
  versionText: {
    textAlign: 'center',
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  },
});

export default SettingsScreen;
