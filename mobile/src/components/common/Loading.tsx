import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
  ViewStyle,
} from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants';

interface LoadingProps {
  visible?: boolean;
  message?: string;
  overlay?: boolean;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

// 行內載入指示器
export const LoadingIndicator: React.FC<LoadingProps> = ({
  message,
  size = 'large',
  color = Colors.primary,
  style,
}) => {
  return (
    <View style={[styles.inline, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

// 全螢幕載入指示器
export const LoadingOverlay: React.FC<LoadingProps> = ({
  visible = true,
  message = '載入中...',
  color = Colors.primary,
}) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={color} />
          {message && <Text style={styles.overlayMessage}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

// 全頁載入狀態
export const LoadingScreen: React.FC<LoadingProps> = ({
  message = '載入中...',
  color = Colors.primary,
  style,
}) => {
  return (
    <View style={[styles.fullScreen, style]}>
      <ActivityIndicator size="large" color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

// 骨架屏（列表項目）
export const SkeletonItem: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.skeletonItem, style]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
      </View>
    </View>
  );
};

// 預設導出
const Loading: React.FC<LoadingProps> = (props) => {
  if (props.overlay) {
    return <LoadingOverlay {...props} />;
  }
  return <LoadingIndicator {...props} />;
};

const styles = StyleSheet.create({
  // 行內樣式
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  message: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
  },

  // 覆蓋層樣式
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 150,
  },
  overlayMessage: {
    fontSize: FontSizes.lg,
    color: Colors.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },

  // 全螢幕樣式
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  // 骨架屏樣式
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.xs,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.disabledBackground,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: Colors.disabledBackground,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  skeletonLineShort: {
    width: '60%',
  },
});

export default Loading;
