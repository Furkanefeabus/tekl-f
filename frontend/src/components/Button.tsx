import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    if (variant === 'primary') baseStyle.push(styles.primary);
    if (variant === 'secondary') baseStyle.push(styles.secondary);
    if (variant === 'outline') baseStyle.push(styles.outline);
    if (variant === 'danger') baseStyle.push(styles.danger);
    if (disabled) baseStyle.push(styles.disabled);
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    if (variant === 'outline') baseStyle.push(styles.outlineText);
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: '#1a73e8',
  },
  secondary: {
    backgroundColor: '#34a853',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1a73e8',
  },
  danger: {
    backgroundColor: '#ea4335',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: '#1a73e8',
  },
});

export default Button;