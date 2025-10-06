import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer, Theme as NavTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DiscoverCategoriesScreen, HabitsHomeScreen, PomodoroScreen, SettingsScreen } from '../screens';
import DiscoverListScreen from '../screens/DiscoverListScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import { useTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function PomodoroStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PomodoroHome" component={PomodoroScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function HabitsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HabitsHome" component={HabitsHomeScreen} options={{ title: 'Alışkanlıklarım' }} />
      <Stack.Screen name="HabitDetail" component={HabitDetailScreen} options={{ title: 'Alışkanlık Detayı' }} />
    </Stack.Navigator>
  );
}

function DiscoverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DiscoverCategories" component={DiscoverCategoriesScreen} options={{ title: 'Keşfet' }} />
      <Stack.Screen name="DiscoverList" component={DiscoverListScreen} options={{ title: 'Alışkanlıklar' }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigation() {
  const { theme } = useTheme();
  const navTheme: NavTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.accent,
      notification: theme.colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.subtext,
          tabBarIcon: ({ color, size }) => {
            const iconName =
              route.name === 'Pomodoro' ? 'timer-outline' :
              route.name === 'Alışkanlıklarım' ? 'list-outline' :
              route.name === 'Keşfet' ? 'compass-outline' :
              'settings-outline';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Pomodoro" component={PomodoroStack} />
        <Tab.Screen name="Alışkanlıklarım" component={HabitsStack} />
        <Tab.Screen name="Keşfet" component={DiscoverStack} />
        <Tab.Screen name="Ayarlar" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
