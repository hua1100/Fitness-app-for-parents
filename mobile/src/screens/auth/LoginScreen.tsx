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

import { Button, Input, Loading, SocialLoginButtons } from '../../components/common';
import { Colors, FontSizes, Spacing } from '../../constants';
import { useLoginMutation, useLineLoginMutation, useGoogleLoginMutation } from '../../store/api/authApi';
import { useAppDispatch } from '../../store';
import { setUser } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { SocialAuthService } from '../../services/socialAuth.service';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const { role } = route.params;
  const dispatch = useAppDispatch();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const [login, { isLoading }] = useLoginMutation();
  const [lineLogin, { isLoading: isLineLoading }] = useLineLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();

  const validate = (): boolean => {
    const newErrors: { phone?: string; password?: string } = {};

    if (!phone) {
      newErrors.phone = '請輸入手機號碼';
    } else if (!/^09\d{8}$/.test(phone)) {
      newErrors.phone = '請輸入有效的手機號碼格式';
    }

    if (!password) {
      newErrors.password = '請輸入密碼';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const result = await login({ phone, password }).unwrap();

      if (result.success && result.data) {
        const { user, tokens } = result.data;

        // 儲存 tokens
        await AsyncStorage.setItem('accessToken', tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
        await AsyncStorage.setItem('userRole', user.role);
        await AsyncStorage.setItem('userId', user.id);

        // 更新 Redux state
        dispatch(setUser(user));

        // 導航到主頁面（會由 RootNavigator 處理）
      }
    } catch (error: any) {
      const message = error.data?.error?.message || '登入失敗，請檢查帳號密碼';
      Alert.alert('登入失敗', message);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register', { role });
  };

  // Line 登入處理
  const handleLineLogin = async () => {
    try {
      const lineResult = await SocialAuthService.loginWithLine();
      const result = await lineLogin({
        accessToken: lineResult.accessToken,
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
      }
    } catch (error: any) {
      const message = error.data?.error?.message || error.message || 'Line 登入失敗';
      Alert.alert('登入失敗', message);
    }
  };

  // Google 登入處理
  const handleGoogleLogin = async () => {
    try {
      const googleResult = await SocialAuthService.loginWithGoogle();
      const result = await googleLogin({
        idToken: googleResult.idToken,
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
      }
    } catch (error: any) {
      const message = error.data?.error?.message || error.message || 'Google 登入失敗';
      Alert.alert('登入失敗', message);
    }
  };

  const isSocialLoading = isLineLoading || isGoogleLoading;

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
            {role === 'ELDER' ? '長輩登入' : '子女登入'}
          </Text>
          <Text style={styles.subtitle}>
            歡迎回來！請輸入您的帳號資訊
          </Text>
        </View>

        <View style={styles.form}>
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
            placeholder="請輸入密碼"
            secureTextEntry
            showPasswordToggle
            error={errors.password}
          />

          <Button
            title="登入"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          />

          <Button
            title="還沒有帳號？立即註冊"
            variant="text"
            onPress={goToRegister}
            style={styles.registerButton}
          />

          <SocialLoginButtons
            onLineLogin={handleLineLogin}
            onGoogleLogin={handleGoogleLogin}
            isLineLoading={isLineLoading}
            isGoogleLoading={isGoogleLoading}
            disabled={isLoading || isSocialLoading}
          />
        </View>
      </ScrollView>

      {(isLoading || isSocialLoading) && (
        <Loading
          overlay
          message={isLineLoading ? 'Line 登入中...' : isGoogleLoading ? 'Google 登入中...' : '登入中...'}
        />
      )}
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
    marginTop: Spacing.xl,
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
  loginButton: {
    marginTop: Spacing.lg,
  },
  registerButton: {
    marginTop: Spacing.md,
  },
});

export default LoginScreen;
