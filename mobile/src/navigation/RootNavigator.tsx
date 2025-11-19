import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthNavigator from './AuthNavigator';
// TODO: 在 Phase 3 添加導航器
// import ElderNavigator from './ElderNavigator';
// import ChildNavigator from './ChildNavigator';

// 載入畫面
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

// 導航類型定義
export type RootStackParamList = {
  Auth: undefined;
  ElderMain: undefined;
  ChildMain: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// 載入畫面元件
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary} />
  </View>
);

const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'ELDER' | 'CHILD' | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const role = await AsyncStorage.getItem('userRole');

      if (token && role) {
        setUserRole(role as 'ELDER' | 'CHILD');
      }
    } catch (error) {
      console.error('檢查認證狀態失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {!userRole ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : userRole === 'ELDER' ? (
          // TODO: 替換為 ElderNavigator
          <Stack.Screen name="ElderMain" component={AuthNavigator} />
        ) : (
          // TODO: 替換為 ChildNavigator
          <Stack.Screen name="ChildMain" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default RootNavigator;
