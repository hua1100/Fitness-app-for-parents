import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '../../constants';

interface SocialLoginButtonsProps {
  onLineLogin: () => void;
  onGoogleLogin: () => void;
  isLineLoading?: boolean;
  isGoogleLoading?: boolean;
  disabled?: boolean;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onLineLogin,
  onGoogleLogin,
  isLineLoading = false,
  isGoogleLoading = false,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>或使用以下方式登入</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.buttonsContainer}>
        {/* Line 登入按鈕 */}
        <TouchableOpacity
          style={[styles.socialButton, styles.lineButton, disabled && styles.disabledButton]}
          onPress={onLineLogin}
          disabled={disabled || isLineLoading}
          activeOpacity={0.8}
        >
          {isLineLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.lineIcon}>L</Text>
              <Text style={styles.lineButtonText}>Line 登入</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Google 登入按鈕 */}
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton, disabled && styles.disabledButton]}
          onPress={onGoogleLogin}
          disabled={disabled || isGoogleLoading}
          activeOpacity={0.8}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Google 登入</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  buttonsContainer: {
    gap: Spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 56,
    ...Shadows.sm,
  },
  lineButton: {
    backgroundColor: '#00B900', // Line 官方綠色
  },
  googleButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  lineIcon: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.white,
    marginRight: Spacing.sm,
  },
  googleIcon: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#4285F4', // Google 藍色
    marginRight: Spacing.sm,
  },
  lineButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
  },
  googleButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
});

export default SocialLoginButtons;
