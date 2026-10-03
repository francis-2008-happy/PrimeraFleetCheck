import { useColorScheme } from 'react-native';

// Every colour the app uses, in one place, for light mode.
const LIGHT = {
  background: '#f2f4f7',
  card: '#ffffff',
  text: '#101828',
  subtext: '#667085',
  border: '#d0d5dd',
  divider: '#eaecf0',
  primary: '#1d4ed8',
  onPrimary: '#ffffff',
  danger: '#d92d20',
  dangerSoft: '#fee4e2',
  success: '#079455',
  successSoft: '#dcfae6',
};

// The same colour names with values that suit dark mode.
const DARK: Colors = {
  background: '#0c111d',
  card: '#1f242f',
  text: '#f5f5f6',
  subtext: '#94969c',
  border: '#333741',
  divider: '#2b303b',
  primary: '#528bff',
  onPrimary: '#ffffff',
  danger: '#f97066',
  dangerSoft: '#55160c',
  success: '#47cd89',
  successSoft: '#053321',
};

export type Colors = typeof LIGHT;

// Returns the light or dark colours, matching the phone's appearance setting.
// Components that call this re-render automatically when the setting changes.
export function useColors(): Colors {
  return useColorScheme() === 'dark' ? DARK : LIGHT;
}
