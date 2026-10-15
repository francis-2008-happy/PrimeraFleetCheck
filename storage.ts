import { ensureSignedIn, supabase } from './supabase';
import { CheckIn, SAMPLE_CHECKINS } from './starter-data';

// Everything about a check-in except its id. The database creates the id.
export type CheckInData = Omit<CheckIn, 'id'>;

// A function a screen calls to stop listening for live updates.
export type Unsubscribe = () => void;

// The name of our table in Supabase (see supabase-setup.sql).
const TABLE = 'checkins';

// Turns one database row into our CheckIn type. SQL columns use snake_case
// (fuel_level) while our TypeScript uses camelCase (fuelLevel).
function toCheckIn(row: any): CheckIn {
  return {
    id: row.id,
    vehicle: row.vehicle,
    odometer: row.odometer,
    fuelLevel: row.fuel_level,
    defects: row.defects ?? [],
    resolved: row.resolved,
    notes: row.notes ?? '',
    date: row.date,
  };
}

// Turns our CheckIn fields into database column names, for saving.
// Only the fields that were given are included, so an update can change just one.
function toRow(data: Partial<CheckInData>) {
  return {
    vehicle: data.vehicle,
    odometer: data.odometer,
    fuel_level: data.fuelLevel,
    defects: data.defects,
    resolved: data.resolved,
    notes: data.notes,
    date: data.date,
  };
}

// RETRIEVE: reads every check-in, newest first.
// This is the same as the SQL:  SELECT * FROM checkins ORDER BY created_at DESC
export async function getCheckIns(): Promise<CheckIn[]> {
  await ensureSignedIn();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(toCheckIn);
}

// RETRIEVE: reads one check-in by its id. Returns undefined if it was deleted.
export async function getCheckIn(id: string): Promise<CheckIn | undefined> {
  await ensureSignedIn();
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toCheckIn(data) : undefined;
}

// INSERT: adds a new row. The database fills in id and created_at itself.
export async function addCheckIn(data: CheckInData): Promise<void> {
  await ensureSignedIn();
  const { error } = await supabase.from(TABLE).insert(toRow(data));
  if (error) throw error;
}

// MODIFY: changes some columns of one existing row and leaves the rest alone.
export async function updateCheckIn(id: string, changes: Partial<CheckInData>): Promise<void> {
  await ensureSignedIn();
  const { error } = await supabase
    .from(TABLE)
    .update({ ...toRow(changes), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// DELETE: removes one row from the table.
export async function deleteCheckIn(id: string): Promise<void> {
  await ensureSignedIn();
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

// Returns the most recent check-in for a vehicle, if there is one.
// Used to warn the driver if a new odometer reading is lower than the last.
export async function lastCheckInFor(vehicle: string): Promise<CheckIn | undefined> {
  await ensureSignedIn();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('vehicle', vehicle)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toCheckIn(data) : undefined;
}

// Uploads the example check-ins from starter-data.ts in a single insert,
// so there is something to show in an empty database.
export async function addSampleCheckIns(): Promise<void> {
  await ensureSignedIn();
  const rows = SAMPLE_CHECKINS.map(({ id, ...data }) => toRow(data));
  const { error } = await supabase.from(TABLE).insert(rows);
  if (error) throw error;
}

// NOTIFICATIONS: opens a live Realtime connection to the checkins table.
// Supabase sends a message whenever any row is inserted, updated or deleted,
// from THIS phone or ANY other one, and we call onChange so the screen can reload.
// Returns a function that closes the connection when the screen is closed.
function listenForChanges(onChange: () => void, onError: (error: Error) => void): Unsubscribe {
  // Each listener needs its own channel name, so we add a random ending.
  const channel = supabase
    .channel(`checkins-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onChange())
    // Reports problems with the live connection itself.
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError(err ?? new Error('Lost the live connection to the database.'));
      }
    });
  // Closes this live connection.
  return () => {
    supabase.removeChannel(channel);
  };
}

// Keeps a screen's list of check-ins up to date: loads it once, then
// reloads it every time the database sends a change notification.
export function subscribeToCheckIns(
  onData: (checkIns: CheckIn[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return subscribe(getCheckIns, onData, onError);
}

// Keeps one check-in up to date, for the details screen.
// Sends undefined if the check-in has been deleted.
export function subscribeToCheckIn(
  id: string,
  onData: (checkIn: CheckIn | undefined) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return subscribe(() => getCheckIn(id), onData, onError);
}

// The shared logic behind the two subscribe functions above: sign in, load
// the data, then reload it on every change until the screen unsubscribes.
function subscribe<T>(
  load: () => Promise<T>,
  onData: (value: T) => void,
  onError: (error: Error) => void
): Unsubscribe {
  let stopped = false;
  let latestRequest = 0;
  let stopListening: Unsubscribe = () => {};

  // Loads fresh data. If two loads overlap, only the newest one is used.
  async function reload() {
    const request = ++latestRequest;
    try {
      const value = await load();
      if (!stopped && request === latestRequest) onData(value);
    } catch (error) {
      if (!stopped) onError(error as Error);
    }
  }

  ensureSignedIn()
    .then(() => {
      if (stopped) return;
      stopListening = listenForChanges(reload, onError);
      reload();
    })
    .catch(onError);

  // Stops reloading and closes the live connection.
  return () => {
    stopped = true;
    stopListening();
  };
}

// Returns today's date as YYYY-MM-DD using the phone's local time zone.
export function todayString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
