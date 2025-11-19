import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius, Shadows } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  style,
  titleStyle,
  variant = 'elevated',
  padding = 'large', // 預設較大內距適合長輩
}) => {
  const cardStyles = [
    styles.card,
    styles[`${variant}Card`],
    styles[`${padding}Padding`],
    style,
  ];

  const content = (
    <>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{content}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.sm,
  },

  // 變體樣式
  defaultCard: {},
  elevatedCard: {
    ...Shadows.md,
  },
  outlinedCard: {
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // 內距樣式
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: Spacing.sm,
  },
  mediumPadding: {
    padding: Spacing.md,
  },
  largePadding: {
    padding: Spacing.lg,
  },

  // 標頭
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // 內容
  content: {},
});

export default Card;
