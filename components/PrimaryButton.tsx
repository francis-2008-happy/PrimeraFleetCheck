import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useColors } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'outline'; // colour style of the button
  disabled?: boolean;
  style?: ViewStyle; // extra layout, such as margins, from the screen using it
};

// A large, full-width button used on every screen, so they all look the same.
// It fades while pressed or disabled, and tells screen readers it is a button.
export default function PrimaryButton({ title, onPress, variant = 'primary', disabled, style }: Props) {
  const colors = useColors();
  const background =
    variant === 'danger' ? colors.danger : variant === 'outline' ? 'transparent' : colors.primary;
  const textColor = variant === 'outline' ? colors.primary : colors.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      // Pressable passes "pressed" to this function so we can fade the button.
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor: colors.primary },
        variant === 'outline' && styles.outline,
        (pressed || disabled) && styles.faded,
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1.5,
  },
  faded: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
