import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '../../constants';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'RoleSelect'>;

const RoleSelectScreen: React.FC<Props> = ({ navigation }) => {
  const handleSelectRole = (role: 'ELDER' | 'CHILD') => {
    navigation.navigate('Login', { role });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>長輩運動關懷</Text>
        <Text style={styles.subtitle}>選擇您的身份開始使用</Text>
      </View>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleSelectRole('ELDER')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight }]}>
            <Text style={styles.roleIcon}>👴</Text>
          </View>
          <Text style={styles.roleTitle}>我是長輩</Text>
          <Text style={styles.roleDescription}>
            記錄運動、獲得點數{'\n'}兌換獎項
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => handleSelectRole('CHILD')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: Colors.secondaryLight }]}>
            <Text style={styles.roleIcon}>👨‍👩‍👧</Text>
          </View>
          <Text style={styles.roleTitle}>我是子女</Text>
          <Text style={styles.roleDescription}>
            關心長輩運動狀況{'\n'}錄製語音鼓勵
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          讓運動成為連結家人的橋樑
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  appName: {
    fontSize: FontSizes.header,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  roleContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  roleCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roleIcon: {
    fontSize: 40,
  },
  roleTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  roleDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSizes.md * 1.5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
});

export default RoleSelectScreen;
