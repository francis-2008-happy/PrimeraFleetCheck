import { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CheckIn, CHECKLIST_ITEMS, needsAttention } from '../starter-data';
import { RootStackParamList } from '../navigation';
import { deleteCheckIn, subscribeToCheckIn, updateCheckIn } from '../storage';
import { Colors, useColors } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';

// The props React Navigation gives this screen, including "navigation" and "route".
type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

// Shows one labelled line of information, such as "Fuel level: 3/4".
function DetailRow({ label, value, colors }: { label: string; value: string; colors: Colors }) {
  return (
    <View style={[styles.row, { borderTopColor: colors.divider }]}>
      <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// The third screen: the full record of one check-in, with edit, resolve and delete actions.
export default function DetailsScreen({ navigation, route }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { checkInId } = route.params; // handed over by the list screen when tapped
  const [checkIn, setCheckIn] = useState<CheckIn | undefined>();
  const [loading, setLoading] = useState(true);

  // Puts an "Edit" button in the top-right corner of the header.
  useLayoutEffect(() => {
    navigation.setOptions({
      // Draws the header button. It opens the form filled in with this check-in.
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => navigation.navigate('CheckInForm', { checkInId })}
        >
          <Text style={[styles.headerButton, { color: colors.primary }]}>Edit</Text>
        </Pressable>
      ),
    });
  }, [navigation, checkInId, colors]);

  // Listens for live changes to this one check-in in Supabase. If it is edited (here or on
  // another phone) the screen updates by itself; if it is deleted, we show that.
  useEffect(() => {
    const unsubscribe = subscribeToCheckIn(
      checkInId,
      // Called with the latest version every time this document changes.
      (latest) => {
        setCheckIn(latest);
        setLoading(false);
      },
      // Called if the listener fails, for example with no internet.
      (error) => {
        setLoading(false);
        Alert.alert('Could not load', error.message);
      }
    );
    // Stops listening when the screen is closed.
    return unsubscribe;
  }, [checkInId]);

  // Marks the defects on this check-in as fixed (or re-opens them) in Supabase.
  // We don't update the screen ourselves: the listener above does it.
  async function toggleResolved() {
    if (!checkIn) return;
    try {
      await updateCheckIn(checkIn.id, { resolved: !checkIn.resolved });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Could not update', (error as Error).message);
    }
  }

  // Asks the driver to confirm, then deletes this check-in and goes back to the list.
  function confirmDelete() {
    Alert.alert('Delete check-in?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        // Runs only if the driver taps "Delete" in the pop-up.
        onPress: async () => {
          navigation.goBack();
          try {
            await deleteCheckIn(checkInId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch (error) {
            Alert.alert('Could not delete', (error as Error).message);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!checkIn) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.subtext }}>This check-in no longer exists.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.vehicle, { color: colors.text }]}>{checkIn.vehicle}</Text>
        <StatusBadge checkIn={checkIn} />
        <View style={styles.spacer} />
        <DetailRow label="Date" value={checkIn.date} colors={colors} />
        <DetailRow label="Odometer" value={`${checkIn.odometer.toLocaleString()} km`} colors={colors} />
        <DetailRow label="Fuel level" value={checkIn.fuelLevel} colors={colors} />
        <DetailRow label="Notes" value={checkIn.notes || 'No notes recorded.'} colors={colors} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Inspection</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {CHECKLIST_ITEMS.map((item) => {
          const failed = checkIn.defects.includes(item);
          return (
            <View key={item} style={styles.checkRow}>
              <Text style={{ color: colors.text, fontSize: 15 }}>{item}</Text>
              <Text style={{ color: failed ? colors.danger : colors.success, fontWeight: '600' }}>
                {failed ? '✕ Defect' : '✓ OK'}
              </Text>
            </View>
          );
        })}
      </View>

      {checkIn.defects.length > 0 && (
        <PrimaryButton
          title={needsAttention(checkIn) ? 'Mark defects as resolved' : 'Re-open defects'}
          variant="outline"
          onPress={toggleResolved}
          style={{ marginTop: 24 }}
        />
      )}
      <PrimaryButton title="Delete check-in" variant="danger" onPress={confirmDelete} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 18,
  },
  vehicle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  spacer: {
    height: 8,
  },
  row: {
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  label: {
    fontSize: 13,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerButton: {
    fontSize: 17,
    fontWeight: '600',
  },
});
