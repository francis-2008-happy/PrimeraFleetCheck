import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { RootStackParamList } from './navigation';
import ListScreen from './screens/ListScreen';
import CheckInFormScreen from './screens/CheckInFormScreen';
import DetailsScreen from './screens/DetailsScreen';

// Creates the "stack" that holds our screens, typed with our screen list.
const Stack = createNativeStackNavigator<RootStackParamList>();

// The root of the app. Sets up navigation, picks light or dark mode to match
// the phone, and registers every screen.
export default function App() {
  const isDark = useColorScheme() === 'dark';

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName="List">
        <Stack.Screen
          name="List"
          component={ListScreen}
          options={{ title: 'Fleet Check', headerLargeTitleEnabled: true }}
        />
        <Stack.Screen
          name="CheckInForm"
          component={CheckInFormScreen}
          options={{ title: 'New Check-In' }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{ title: 'Check-In Details' }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
