import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors, FontSizes } from '../constants';

// 長輩頁面
import ElderHomeScreen from '../screens/elder/HomeScreen';
import ExerciseListScreen from '../screens/elder/ExerciseListScreen';
import NotificationScreen from '../screens/elder/NotificationScreen';
import SettingsScreen from '../screens/elder/SettingsScreen';
import BindingCodeScreen from '../screens/elder/BindingCodeScreen';
import ProfileScreen from '../screens/elder/ProfileScreen';
import RewardShopScreen from '../screens/elder/RewardShopScreen';
import AchievementsScreen from '../screens/elder/AchievementsScreen';
import NotificationSettingsScreen from '../screens/common/NotificationSettingsScreen';

// 導航類型定義
export type ElderTabParamList = {
  Home: undefined;
  ExerciseList: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type ElderStackParamList = {
  MainTabs: undefined;
  BindingCode: undefined;
  Profile: undefined;
  RewardShop: undefined;
  Achievements: undefined;
  NotificationSettings: undefined;
};

const Tab = createBottomTabNavigator<ElderTabParamList>();
const Stack = createNativeStackNavigator<ElderStackParamList>();

// Tab 導航
const ElderTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ExerciseList':
              iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
              break;
            case 'Notifications':
              iconName = focused ? 'bell' : 'bell-outline';
              break;
            case 'Settings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: FontSizes.sm,
          fontWeight: '600',
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={ElderHomeScreen}
        options={{ tabBarLabel: '首頁' }}
      />
      <Tab.Screen
        name="ExerciseList"
        component={ExerciseListScreen}
        options={{ tabBarLabel: '運動記錄' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{ tabBarLabel: '通知' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: '設定' }}
      />
    </Tab.Navigator>
  );
};

// Stack 導航（包含 Tab 和其他頁面）
const ElderNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={ElderTabNavigator} />
      <Stack.Screen name="BindingCode" component={BindingCodeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="RewardShop" component={RewardShopScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </Stack.Navigator>
  );
};

export default ElderNavigator;
