import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CheckIn, needsAttention } from '../starter-data';
import { RootStackParamList } from '../navigation';
import { loadCheckIns } from '../storage';
import { Colors, useColors } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';

// The props React Navigation gives this screen, including "navigation".
type Props = NativeStackScreenProps<RootStackParamList, 'List'>;

// Which check-ins the list is showing: all of them, or only unresolved defects.
type Filter = 'all' | 'attention';

// Shows one check-in as a tappable card: vehicle, status badge, then date, fuel and odometer.
function CheckInRow({ item, colors, onPress }: { item: CheckIn; colors: Colors; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.vehicle}, ${item.date}`}
      onPress={onPress}
      // Fades the card slightly while the driver's finger is on it.
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderLeftColor: colors.primary },
        needsAttention(item) && { borderLeftColor: colors.danger },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.vehicle, { color: colors.text }]} numberOfLines={1}>
          {item.vehicle}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
      </View>
      <Text style={[styles.meta, { color: colors.subtext }]}>
        {item.date} · Fuel: {item.fuelLevel} · {item.odometer.toLocaleString()} km
      </Text>
      <StatusBadge checkIn={item} />
    </Pressable>
  );
}

// The first screen: a searchable, filterable list of saved check-ins and an "add" button.
export default function ListScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Adds the native search bar to this screen's header.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: 'Search vehicle or notes',
        // Stores what the driver types so the list can be filtered by it.
        onChangeText: (event) => setSearch(event.nativeEvent.text),
      },
    });
  }, [navigation]);

  // Every time this screen comes into view (on launch, and when coming back
  // from another screen), reload the check-ins from the phone's storage.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      // Reads the saved check-ins and puts them into state for the list.
      async function refresh() {
        try {
          const saved = await loadCheckIns();
          if (active) setCheckIns(saved);
        } catch {
          Alert.alert('Could not load', 'Your saved check-ins could not be read.');
        } finally {
          if (active) setLoading(false);
        }
      }
      refresh();

      // Runs when the screen loses focus, so a slow load doesn't update a hidden screen.
      return () => {
        active = false;
      };
    }, [])
  );

  // The check-ins that match the search box and the selected filter.
  const query = search.trim().toLowerCase();
  const visible = checkIns.filter(
    (c) =>
      (filter === 'all' || needsAttention(c)) &&
      (query === '' ||
        c.vehicle.toLowerCase().includes(query) ||
        c.notes.toLowerCase().includes(query))
  );
  const attentionCount = checkIns.filter(needsAttention).length;

  // Opens the details screen for the check-in the driver tapped.
  function openDetails(checkIn: CheckIn) {
    navigation.navigate('Details', { checkInId: checkIn.id });
  }

  // Draws one row of the list. FlatList calls this for each visible check-in.
  function renderRow({ item }: { item: CheckIn }) {
    // Tapping the row opens that check-in's details.
    return <CheckInRow item={item} colors={colors} onPress={() => openDetails(item)} />;
  }

  // Draws one of the two filter tabs above the list ("All" / "Needs attention").
  function renderFilterTab(value: Filter, label: string) {
    const selected = filter === value;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        // Switches the list to this filter when tapped.
        onPress={() => setFilter(value)}
        style={[
          styles.filterTab,
          { borderColor: colors.border, backgroundColor: colors.card },
          selected && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
      >
        <Text style={[styles.filterText, { color: selected ? colors.onPrimary : colors.text }]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id} // tells FlatList which field is the unique key
        renderItem={renderRow}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.filterRow}>
            {renderFilterTab('all', `All (${checkIns.length})`)}
            {renderFilterTab('attention', `Needs attention (${attentionCount})`)}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={48} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {checkIns.length === 0
                ? 'No check-ins yet. Tap the button below to log your first one.'
                : 'No check-ins match.'}
            </Text>
          </View>
        }
      />
      {/* Opens an empty form for a new check-in. */}
      <PrimaryButton
        title="+ New Check-In"
        onPress={() => navigation.navigate('CheckInForm', {})}
        style={{ marginHorizontal: 16, marginTop: 8, marginBottom: insets.bottom + 12 }}
      />
    </View>
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
  listContent: {
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  filterText: {
    fontWeight: '600',
  },
  card: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    gap: 6,
    borderLeftWidth: 4,
  },
  cardPressed: {
    opacity: 0.6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
