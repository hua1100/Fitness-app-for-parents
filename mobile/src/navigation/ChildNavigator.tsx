import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors, FontSizes } from '../constants';

// 子女頁面
import ChildHomeScreen from '../screens/child/ChildHomeScreen';
import ElderListScreen from '../screens/child/ElderListScreen';
import ElderDetailScreen from '../screens/child/ElderDetailScreen';
import ChildNotificationScreen from '../screens/child/NotificationScreen';
import ChildSettingsScreen from '../screens/child/SettingsScreen';
import BindingInputScreen from '../screens/child/BindingInputScreen';

// 導航類型定義
export type ChildTabParamList = {
  Home: undefined;
  ElderList: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type ChildStackParamList = {
  MainTabs: undefined;
  ElderDetail: { elderId: string; elderName: string };
  BindingInput: undefined;
};

const Tab = createBottomTabNavigator<ChildTabParamList>();
const Stack = createNativeStackNavigator<ChildStackParamList>();

// Tab 導航
const ChildTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ElderList':
              iconName = focused ? 'account-group' : 'account-group-outline';
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
        tabBarActiveTintColor: Colors.secondary,
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
        component={ChildHomeScreen}
        options={{ tabBarLabel: '首頁' }}
      />
      <Tab.Screen
        name="ElderList"
        component={ElderListScreen}
        options={{ tabBarLabel: '長輩' }}
      />
      <Tab.Screen
        name="Notifications"
        component={ChildNotificationScreen}
        options={{ tabBarLabel: '通知' }}
      />
      <Tab.Screen
        name="Settings"
        component={ChildSettingsScreen}
        options={{ tabBarLabel: '設定' }}
      />
    </Tab.Navigator>
  );
};

// Stack 導航（包含 Tab 和其他頁面）
const ChildNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={ChildTabNavigator} />
      <Stack.Screen name="ElderDetail" component={ElderDetailScreen} />
      <Stack.Screen name="BindingInput" component={BindingInputScreen} />
    </Stack.Navigator>
  );
};

export default ChildNavigator;
