import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Card } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useAppSelector } from '../../store';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useAppSelector((state) => state.auth.user);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未設定';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>個人資料</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 頭像區 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Icon name="account" size={48} color={Colors.surface} />
          </View>
          <Text style={styles.userName}>{user?.name || '使用者'}</Text>
          <Text style={styles.userRole}>長輩帳號</Text>
        </View>

        {/* 基本資料 */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>基本資料</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="account-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>姓名</Text>
            </View>
            <Text style={styles.infoValue}>{user?.name || '未設定'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="phone-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>手機號碼</Text>
            </View>
            <Text style={styles.infoValue}>{user?.phone || '未設定'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>出生日期</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(user?.birthDate)}</Text>
          </View>
        </Card>

        {/* 帳號資訊 */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>帳號資訊</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="identifier" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>使用者 ID</Text>
            </View>
            <Text style={styles.infoValueSmall} numberOfLines={1}>
              {user?.id || '未知'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <View style={styles.infoLabel}>
              <Icon name="clock-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoLabelText}>註冊時間</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(user?.createdAt)}</Text>
          </View>
        </Card>

        {/* 統計資訊 */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>成就統計</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="star" size={28} color={Colors.warning} />
              <Text style={styles.statValue}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>總點數</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Icon name="trophy" size={28} color={Colors.primary} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>成就數</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Icon name="fire" size={28} color={Colors.error} />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>連續天數</Text>
            </View>
          </View>
        </Card>
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userRole: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  infoCard: {
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
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabelText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  infoValueSmall: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
    maxWidth: 150,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  statsCard: {
    padding: Spacing.md,
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
    height: 60,
    backgroundColor: Colors.border,
  },
});

export default ProfileScreen;
