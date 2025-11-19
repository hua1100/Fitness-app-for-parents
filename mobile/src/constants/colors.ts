// 應用程式顏色常數
// 針對長輩設計：高對比度、易於辨識

export const Colors = {
  // 主要顏色
  primary: '#2E7D32', // 深綠色 - 健康、活力
  primaryLight: '#60AD5E',
  primaryDark: '#005005',

  // 次要顏色
  secondary: '#FF6F00', // 橙色 - 溫暖、友善
  secondaryLight: '#FFA040',
  secondaryDark: '#C43E00',

  // 背景顏色
  background: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // 文字顏色
  text: '#212121', // 高對比度黑色
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#FFFFFF',

  // 功能顏色
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',

  // 緊急求助專用
  emergency: '#D32F2F',
  emergencyLight: '#FF6659',
  emergencyDark: '#9A0007',

  // 邊框和分隔線
  border: '#E0E0E0',
  divider: '#EEEEEE',

  // 其他
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // 禁用狀態
  disabled: '#BDBDBD',
  disabledBackground: '#F5F5F5',

  // 點數相關
  points: '#FFD700', // 金色
  pointsBackground: '#FFF8E1',

  // 成就相關
  achievement: '#9C27B0', // 紫色
  achievementBackground: '#F3E5F5',

  // 獎項相關
  reward: '#E91E63', // 粉紅色
  rewardBackground: '#FCE4EC',
} as const;

// 深色模式顏色（未來擴展用）
export const DarkColors = {
  ...Colors,
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  divider: '#2C2C2C',
} as const;

export default Colors;
