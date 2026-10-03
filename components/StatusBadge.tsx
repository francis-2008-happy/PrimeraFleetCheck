import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CheckIn, needsAttention } from '../starter-data';
import { useColors } from '../theme';

// A small coloured label showing whether a check-in needs attention.
// It uses an icon and words as well as colour, so it is clear even to
// someone who cannot tell red from green.
export default function StatusBadge({ checkIn }: { checkIn: CheckIn }) {
  const colors = useColors();

  let label = 'All OK';
  let icon: keyof typeof Ionicons.glyphMap = 'checkmark-circle';
  let color = colors.success;
  let background = colors.successSoft;

  if (needsAttention(checkIn)) {
    const count = checkIn.defects.length;
    label = `${count} defect${count === 1 ? '' : 's'}`;
    icon = 'warning';
    color = colors.danger;
    background = colors.dangerSoft;
  } else if (checkIn.defects.length > 0) {
    label = 'Resolved';
    icon = 'construct';
  }

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
