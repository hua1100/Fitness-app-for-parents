import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Colors, FontSizes, Spacing, Shadows } from '../../constants';
import { ConfirmDialog } from '../common';

interface EmergencyButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  onPress,
  disabled = false,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePress = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onPress();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, disabled && styles.disabledButton]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>緊急求助</Text>
        <Text style={styles.subText}>SOS</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={showConfirm}
        title="緊急求助"
        message="確定要發送緊急求助嗎？您的子女將會收到通知並看到您的位置。"
        confirmText="發送求助"
        cancelText="取消"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmVariant="danger"
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.emergency,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    ...Shadows.md,
  },
  disabledButton: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.white,
  },
  subText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 4,
  },
});

export default EmergencyButton;
