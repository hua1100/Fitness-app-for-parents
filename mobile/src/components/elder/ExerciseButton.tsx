import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
} from 'react-native';
import { Colors, FontSizes, Shadows } from '../../constants';

interface ExerciseButtonProps {
  isExercising: boolean;
  onPress: () => void;
  disabled?: boolean;
  elapsedTime?: string;
}

const ExerciseButton: React.FC<ExerciseButtonProps> = ({
  isExercising,
  onPress,
  disabled = false,
  elapsedTime,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isExercising ? styles.exercisingButton : styles.startButton,
          disabled && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isExercising ? '結束運動' : '開始運動'}
        </Text>
        {isExercising && elapsedTime && (
          <Text style={styles.timerText}>{elapsedTime}</Text>
        )}
      </TouchableOpacity>

      {!isExercising && (
        <Text style={styles.hint}>點擊開始記錄您的運動</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  startButton: {
    backgroundColor: Colors.primary,
  },
  exercisingButton: {
    backgroundColor: Colors.secondary,
  },
  disabledButton: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.white,
  },
  timerText: {
    fontSize: FontSizes.header,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 8,
  },
  hint: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});

export default ExerciseButton;
