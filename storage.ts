import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckIn, SAMPLE_CHECKINS } from './starter-data';

// The name ("key") our list of check-ins is saved under on the phone.
const STORAGE_KEY = 'primera-fleet-check:checkins';

// Makes sure a saved record has every field the app expects.
// Check-ins saved by an older version of the app had no "defects" or
// "resolved" fields, so we fill in safe defaults instead of crashing.
function normalize(raw: any): CheckIn {
  return {
    id: String(raw.id),
    vehicle: String(raw.vehicle ?? ''),
    odometer: Number.isFinite(raw.odometer) ? raw.odometer : 0,
    fuelLevel: String(raw.fuelLevel ?? ''),
    defects: Array.isArray(raw.defects) ? raw.defects : [],
    resolved: raw.resolved === true,
    notes: String(raw.notes ?? ''),
    date: String(raw.date ?? ''),
  };
}

// Loads every saved check-in from the phone.
// The very first time the app runs nothing is saved yet, so we store the
// sample check-ins and return those, giving the list something to show.
// If the saved text is damaged, we return an empty list rather than crash,
// so the driver can still save new check-ins.
export async function loadCheckIns(): Promise<CheckIn[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (json === null) {
    await saveCheckIns(SAMPLE_CHECKINS);
    return SAMPLE_CHECKINS;
  }
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data.map(normalize) : [];
  } catch {
    return [];
  }
}

// Replaces the whole saved list on the phone with the list given.
async function saveCheckIns(checkIns: CheckIn[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
}

// Finds one saved check-in by its id. Returns undefined if it no longer exists.
export async function getCheckIn(id: string): Promise<CheckIn | undefined> {
  const all = await loadCheckIns();
  return all.find((c) => c.id === id);
}

// Saves a check-in. If one with the same id exists it is replaced (an edit),
// otherwise the new one is added to the front so the newest shows first.
export async function upsertCheckIn(checkIn: CheckIn): Promise<void> {
  const all = await loadCheckIns();
  const exists = all.some((c) => c.id === checkIn.id);
  const updated = exists
    ? all.map((c) => (c.id === checkIn.id ? checkIn : c))
    : [checkIn, ...all];
  await saveCheckIns(updated);
}

// Removes one check-in from the phone.
export async function deleteCheckIn(id: string): Promise<void> {
  const all = await loadCheckIns();
  await saveCheckIns(all.filter((c) => c.id !== id));
}

// Returns the most recent saved check-in for a vehicle, if there is one.
// Used to warn the driver if a new odometer reading is lower than the last.
export async function lastCheckInFor(vehicle: string): Promise<CheckIn | undefined> {
  const all = await loadCheckIns();
  return all.find((c) => c.vehicle === vehicle);
}

// Makes a unique id from the current time plus a few random letters,
// so two check-ins saved in the same millisecond still get different ids.
export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Returns today's date as YYYY-MM-DD using the phone's local time zone.
export function todayString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
