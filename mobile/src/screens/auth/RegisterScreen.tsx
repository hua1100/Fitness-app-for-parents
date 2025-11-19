import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Button, Input, Loading } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useRegisterMutation } from '../../store/api/authApi';
import { useAppDispatch } from '../../store';
import { setUser } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  const { role } = route.params;
  const dispatch = useAppDispatch();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [register, { isLoading }] = useRegisterMutation();

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = '請輸入姓名';
    }

    if (!phone) {
      newErrors.phone = '請輸入手機號碼';
    } else if (!/^09\d{8}$/.test(phone)) {
      newErrors.phone = '請輸入有效的手機號碼格式';
    }

    if (!password) {
      newErrors.password = '請輸入密碼';
    } else if (password.length < 8) {
      newErrors.password = '密碼至少需要 8 個字元';
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      newErrors.password = '密碼需要包含字母和數字';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '兩次密碼輸入不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      const result = await register({
        phone,
        password,
        name: name.trim(),
        role,
      }).unwrap();

      if (result.success && result.data) {
        const { user, tokens } = result.data;

        // 儲存 tokens
        await AsyncStorage.setItem('accessToken', tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
        await AsyncStorage.setItem('userRole', user.role);
        await AsyncStorage.setItem('userId', user.id);

        // 更新 Redux state
        dispatch(setUser(user));

        Alert.alert('註冊成功', '歡迎加入長輩運動關懷！');
      }
    } catch (error: any) {
      const message = error.data?.error?.message || '註冊失敗，請稍後再試';
      Alert.alert('註冊失敗', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {role === 'ELDER' ? '長輩註冊' : '子女註冊'}
          </Text>
          <Text style={styles.subtitle}>
            請填寫以下資訊完成註冊
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="姓名"
            value={name}
            onChangeText={setName}
            placeholder="請輸入您的姓名"
            autoComplete="name"
            error={errors.name}
          />

          <Input
            label="手機號碼"
            value={phone}
            onChangeText={setPhone}
            placeholder="09xxxxxxxx"
            keyboardType="phone-pad"
            autoComplete="tel"
            error={errors.phone}
          />

          <Input
            label="密碼"
            value={password}
            onChangeText={setPassword}
            placeholder="至少 8 個字元，包含字母和數字"
            secureTextEntry
            showPasswordToggle
            error={errors.password}
          />

          <Input
            label="確認密碼"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="請再次輸入密碼"
            secureTextEntry
            showPasswordToggle
            error={errors.confirmPassword}
          />

          <Button
            title="註冊"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
          />
        </View>
      </ScrollView>

      {isLoading && <Loading overlay message="註冊中..." />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.header,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  registerButton: {
    marginTop: Spacing.lg,
  },
});

export default RegisterScreen;
