import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  retryText?: string;
  variant?: 'inline' | 'fullscreen' | 'banner';
  style?: ViewStyle;
}

// 行內錯誤訊息
export const InlineError: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  retryText = '重試',
  style,
}) => {
  return (
    <View style={[styles.inline, style]}>
      <Text style={styles.inlineMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 橫幅錯誤訊息
export const BannerError: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  retryText = '重試',
  style,
}) => {
  return (
    <View style={[styles.banner, style]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerIcon}>!</Text>
        <Text style={styles.bannerMessage}>{message}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text style={styles.bannerRetry}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 全螢幕錯誤訊息
export const FullscreenError: React.FC<ErrorMessageProps> = ({
  message,
  title = '發生錯誤',
  onRetry,
  retryText = '重試',
  style,
}) => {
  return (
    <View style={[styles.fullscreen, style]}>
      <View style={styles.errorIconContainer}>
        <Text style={styles.errorIcon}>!</Text>
      </View>
      <Text style={styles.fullscreenTitle}>{title}</Text>
      <Text style={styles.fullscreenMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.fullscreenRetryButton}
        >
          <Text style={styles.fullscreenRetryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 預設導出
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  variant = 'inline',
  ...props
}) => {
  switch (variant) {
    case 'fullscreen':
      return <FullscreenError {...props} />;
    case 'banner':
      return <BannerError {...props} />;
    default:
      return <InlineError {...props} />;
  }
};

const styles = StyleSheet.create({
  // 行內樣式
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  inlineMessage: {
    fontSize: FontSizes.md,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginLeft: Spacing.md,
  },
  retryText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },

  // 橫幅樣式
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.error,
    padding: Spacing.md,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerIcon: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.white,
    marginRight: Spacing.sm,
  },
  bannerMessage: {
    fontSize: FontSizes.md,
    color: Colors.white,
    flex: 1,
  },
  bannerRetry: {
    fontSize: FontSizes.md,
    color: Colors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // 全螢幕樣式
  fullscreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  errorIcon: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.white,
  },
  fullscreenTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  fullscreenMessage: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: FontSizes.lg * 1.5,
  },
  fullscreenRetryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  fullscreenRetryText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.white,
  },
});

export default ErrorMessage;
