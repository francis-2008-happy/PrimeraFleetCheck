import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CheckIn, CHECKLIST_ITEMS, FUEL_LEVELS, VEHICLES } from '../starter-data';
import { RootStackParamList } from '../navigation';
import { addCheckIn, CheckInData, getCheckIn, lastCheckInFor, todayString, updateCheckIn } from '../storage';
import { Colors, useColors } from '../theme';
import PrimaryButton from '../components/PrimaryButton';

// The props React Navigation gives this screen, including "navigation" and "route".
type Props = NativeStackScreenProps<RootStackParamList, 'CheckInForm'>;

// A row of tappable "chips". The selected one is highlighted.
// Used for picking a vehicle and a fuel level.
function OptionChips({
  options,
  selected,
  onSelect,
  colors,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  colors: Colors;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            // Picks this option, closes the keyboard, and gives a light tap feel.
            onPress={() => {
              Keyboard.dismiss();
              Haptics.selectionAsync();
              onSelect(option);
            }}
            style={[
              styles.chip,
              { backgroundColor: colors.card, borderColor: colors.border },
              isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text style={{ color: isSelected ? colors.onPrimary : colors.text, fontWeight: isSelected ? '600' : '400' }}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// One line of the inspection checklist, with an "OK" and a "Defect" button.
function ChecklistRow({
  item,
  isDefect,
  onChange,
  colors,
}: {
  item: string;
  isDefect: boolean;
  onChange: (isDefect: boolean) => void;
  colors: Colors;
}) {
  // Draws one half of the OK / Defect switch.
  function renderSide(label: string, active: boolean, activeColor: string, value: boolean) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item}: ${label}`}
        accessibilityState={{ selected: active }}
        // Marks this item as OK or as a defect.
        onPress={() => {
          Keyboard.dismiss();
          Haptics.selectionAsync();
          onChange(value);
        }}
        style={[styles.toggleSide, active && { backgroundColor: activeColor }]}
      >
        <Text style={{ color: active ? '#fff' : colors.subtext, fontWeight: '600' }}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.checkRow, { borderBottomColor: colors.divider }]}>
      <Text style={[styles.checkLabel, { color: colors.text }]}>{item}</Text>
      <View style={[styles.toggle, { borderColor: colors.border }]}>
        {renderSide('OK', !isDefect, colors.success, false)}
        {renderSide('Defect', isDefect, colors.danger, true)}
      </View>
    </View>
  );
}

// Shows a pop-up with "Cancel" and "Save anyway" and waits for the driver's choice.
// Returns true if they chose to save anyway.
function confirmAsync(title: string, message: string): Promise<boolean> {
  // Alert uses callbacks, so we wrap it in a Promise to be able to "await" it.
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Save anyway', onPress: () => resolve(true) },
    ]);
  });
}

// The form screen for adding a new check-in, or editing an existing one.
export default function CheckInFormScreen({ navigation, route }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const editingId = route.params?.checkInId; // set only when editing

  // One piece of state for each field in the form.
  const [vehicle, setVehicle] = useState('');
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [defects, setDefects] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [original, setOriginal] = useState<CheckIn | undefined>();
  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);

  // When editing, load the saved check-in and fill the form with its values.
  useEffect(() => {
    if (!editingId) return;
    navigation.setOptions({ title: 'Edit Check-In' });

    // Reads the check-in being edited from Supabase and copies it into the form.
    async function loadExisting() {
      try {
        const existing = await getCheckIn(editingId!);
        if (existing) {
          setOriginal(existing);
          setVehicle(existing.vehicle);
          setOdometer(String(existing.odometer));
          setFuelLevel(existing.fuelLevel);
          setDefects(existing.defects);
          setNotes(existing.notes);
        }
      } catch (error) {
        Alert.alert('Could not load', (error as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadExisting();
  }, [editingId, navigation]);

  // Adds or removes one checklist item from the list of defects.
  function setItemDefect(item: string, isDefect: boolean) {
    setDefects((current) =>
      isDefect ? [...current.filter((d) => d !== item), item] : current.filter((d) => d !== item)
    );
  }

  // Checks the form, and if everything is filled in correctly, saves it
  // to the Supabase cloud database and returns to the previous screen.
  async function handleSave() {
    if (!vehicle) {
      Alert.alert('Missing vehicle', 'Please pick a vehicle.');
      return;
    }
    // Only whole kilometres, 1 to 7 digits. This rejects things like "12.5",
    // "1e5" or "Infinity", which Number() would otherwise accept.
    const trimmed = odometer.trim();
    if (!/^\d{1,7}$/.test(trimmed)) {
      Alert.alert('Invalid odometer', 'Please enter the odometer reading as a whole number of kilometres.');
      return;
    }
    const odometerNumber = Number(trimmed);
    if (!fuelLevel) {
      Alert.alert('Missing fuel level', 'Please pick a fuel level.');
      return;
    }
    if (defects.length > 0 && notes.trim() === '') {
      Alert.alert('Describe the defect', 'Please add a note explaining what is wrong.');
      return;
    }

    setSaving(true);
    try {
      // For a new check-in, warn if the odometer is lower than the vehicle's
      // last reading. That usually means a typo, such as a missing digit.
      if (!original) {
        const last = await lastCheckInFor(vehicle);
        if (last && odometerNumber < last.odometer) {
          const saveAnyway = await confirmAsync(
            'Odometer lower than last time',
            `The last check for this vehicle recorded ${last.odometer.toLocaleString()} km. Save ${odometerNumber.toLocaleString()} km anyway?`
          );
          if (!saveAnyway) {
            setSaving(false);
            return;
          }
        }
      }

      const data: CheckInData = {
        vehicle,
        odometer: odometerNumber,
        fuelLevel,
        // Keep defects in checklist order so they always display the same way.
        defects: CHECKLIST_ITEMS.filter((item) => defects.includes(item)),
        // Keep "resolved" only if the defects did not change. Changing them re-opens it.
        resolved: original && sameDefects(original, defects) ? original.resolved : false,
        notes: notes.trim(),
        date: original?.date ?? todayString(),
      };
      // Editing changes the existing document (modify); otherwise add a new one (insert).
      if (original) {
        await updateCheckIn(original.id, data);
      } else {
        await addCheckIn(data);
      }
      Haptics.notificationAsync(
        defects.length > 0 ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not save', (error as Error).message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={[styles.label, { color: colors.text }]}>Vehicle</Text>
      <OptionChips options={VEHICLES} selected={vehicle} onSelect={setVehicle} colors={colors} />

      <Text style={[styles.label, { color: colors.text }]}>Odometer (km)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={odometer}
        onChangeText={setOdometer}
        placeholder="e.g. 184200"
        placeholderTextColor={colors.subtext}
        keyboardType="number-pad"
        maxLength={7}
        accessibilityLabel="Odometer in kilometres"
      />

      <Text style={[styles.label, { color: colors.text }]}>Fuel level</Text>
      <OptionChips options={FUEL_LEVELS} selected={fuelLevel} onSelect={setFuelLevel} colors={colors} />

      <Text style={[styles.label, { color: colors.text }]}>Inspection checklist</Text>
      <View style={[styles.checklist, { backgroundColor: colors.card }]}>
        {CHECKLIST_ITEMS.map((item) => (
          <ChecklistRow
            key={item}
            item={item}
            isDefect={defects.includes(item)}
            // Records whether this item passed or failed.
            onChange={(isDefect) => setItemDefect(item, isDefect)}
            colors={colors}
          />
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>
        Notes{defects.length > 0 ? ' (required — describe the defect)' : ''}
      </Text>
      <TextInput
        style={[styles.input, styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any issues you noticed?"
        placeholderTextColor={colors.subtext}
        multiline
        accessibilityLabel="Notes"
      />

      <PrimaryButton
        title={saving ? 'Saving...' : original ? 'Save Changes' : 'Save Check-In'}
        onPress={handleSave}
        disabled={saving}
        style={{ marginTop: 24 }}
      />
    </ScrollView>
  );
}

// Returns true if an existing check-in has exactly the same defects as the form.
function sameDefects(original: CheckIn, defects: string[]): boolean {
  return original.defects.length === defects.length && original.defects.every((d) => defects.includes(d));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
  },
  checklist: {
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkLabel: {
    fontSize: 15,
    flex: 1,
  },
  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleSide: {
    minHeight: 44,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
