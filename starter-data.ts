// starter-data.ts
// A small set of vehicles and a few example check-ins to test the app with.
// The first time the app runs, SAMPLE_CHECKINS are saved to the phone so the
// list has something to show. After that the driver adds their own.

// The shape of one saved vehicle check-in.
export type CheckIn = {
  id: string;        // a unique id for this entry
  vehicle: string;   // which vehicle was checked
  odometer: number;  // kilometres shown on the odometer
  fuelLevel: string; // one of the FUEL_LEVELS below
  defects: string[]; // the CHECKLIST_ITEMS that failed the inspection
  resolved: boolean; // true once a manager marks the defects as fixed
  notes: string;     // anything the driver noticed
  date: string;      // the day the check was recorded (YYYY-MM-DD)
};

// The vehicles a driver can pick from in the form.
export const VEHICLES: string[] = [
  "Toyota Hiace - LAG-231-KJA",
  "Mercedes Sprinter - LAG-884-XA",
  "Ford Transit - LAG-512-MU",
  "Toyota Hilux - LAG-176-GG",
  "Isuzu NPR Truck - LAG-909-BD",
];

// The fuel level options a driver can choose from.
export const FUEL_LEVELS: string[] = ["Full", "3/4", "1/2", "1/4", "Low"];

// The parts of the vehicle a driver inspects. Each one is marked OK or Defect.
// These are the standard items on a pre-trip vehicle inspection report.
export const CHECKLIST_ITEMS: string[] = [
  "Tyres",
  "Lights",
  "Brakes",
  "Fluids & oil",
  "Wipers & windscreen",
  "Mirrors",
  "Horn",
];

// A few example check-ins so the list screen has something to show.
export const SAMPLE_CHECKINS: CheckIn[] = [
  { id: "1", vehicle: "Toyota Hiace - LAG-231-KJA", odometer: 184200, fuelLevel: "3/4", defects: ["Tyres"], resolved: false, notes: "Front left tyre pressure a little low.", date: "2026-09-21" },
  { id: "2", vehicle: "Mercedes Sprinter - LAG-884-XA", odometer: 97650, fuelLevel: "Full", defects: [], resolved: false, notes: "All good, no issues.", date: "2026-09-21" },
  { id: "3", vehicle: "Ford Transit - LAG-512-MU", odometer: 210430, fuelLevel: "1/4", defects: ["Wipers & windscreen"], resolved: true, notes: "Needs refuel before next trip. Wiper blade worn.", date: "2026-09-22" },
  { id: "4", vehicle: "Toyota Hilux - LAG-176-GG", odometer: 56120, fuelLevel: "1/2", defects: ["Brakes"], resolved: false, notes: "Brake felt slightly soft, worth a look.", date: "2026-09-23" },
  { id: "5", vehicle: "Isuzu NPR Truck - LAG-909-BD", odometer: 302870, fuelLevel: "Low", defects: ["Lights"], resolved: false, notes: "Reverse light not working.", date: "2026-09-23" },
];

// Returns true when a check-in has defects that have not been fixed yet.
export function needsAttention(checkIn: CheckIn): boolean {
  return checkIn.defects.length > 0 && !checkIn.resolved;
}
