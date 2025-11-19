import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// TODO: 在 Phase 3 添加實際頁面
// import LoginScreen from '../screens/auth/LoginScreen';
// import RegisterScreen from '../screens/auth/RegisterScreen';
// import RoleSelectScreen from '../screens/auth/RoleSelectScreen';

// 暫時使用佔位元件
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

// 佔位頁面
const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>頁面開發中...</Text>
  </View>
);

const LoginScreen = () => <PlaceholderScreen title="登入" />;
const RegisterScreen = () => <PlaceholderScreen title="註冊" />;
const RoleSelectScreen = () => <PlaceholderScreen title="選擇角色" />;

// 導航類型定義
export type AuthStackParamList = {
  RoleSelect: undefined;
  Login: { role: 'ELDER' | 'CHILD' };
  Register: { role: 'ELDER' | 'CHILD' };
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelect"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerBackTitleVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="RoleSelect"
        component={RoleSelectScreen}
        options={{
          title: '選擇身份',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: '登入',
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: '註冊',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
});

export default AuthNavigator;
