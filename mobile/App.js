import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Platform } from 'react-native';
import { MapPin, Clock, Banknote, ShieldCheck, User, CalendarDays } from 'lucide-react-native';
import api from './src/services/api';

// Push notifications via Expo Go are disabled in SDK 53 for Android
async function registerForPushNotificationsAsync() {
  return null;
}

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import PayrollScreen from './src/screens/PayrollScreen';
import AdminScreen from './src/screens/AdminScreen';
import AdminEmployeesScreen from './src/screens/AdminEmployeesScreen';
import AdminShiftsScreen from './src/screens/AdminShiftsScreen';
import AdminRequestsScreen from './src/screens/AdminRequestsScreen';
import AdminPayrollScreen from './src/screens/AdminPayrollScreen';
import AdminSettingsScreen from './src/screens/AdminSettingsScreen';
import AdminTimesheetScreen from './src/screens/AdminTimesheetScreen';
import AdminAttendanceLogsScreen from './src/screens/AdminAttendanceLogsScreen';

import ProfileScreen from './src/screens/ProfileScreen';
import RequestsScreen from './src/screens/RequestsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Admin Stack Navigator
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminScreen} />
      <Stack.Screen name="AdminEmployees" component={AdminEmployeesScreen} />
      <Stack.Screen name="AdminShifts" component={AdminShiftsScreen} />
      <Stack.Screen name="AdminRequests" component={AdminRequestsScreen} />
      <Stack.Screen name="AdminPayroll" component={AdminPayrollScreen} />
      <Stack.Screen name="AdminTimesheet" component={AdminTimesheetScreen} />
      <Stack.Screen name="AdminAttendanceLogs" component={AdminAttendanceLogsScreen} />
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    </Stack.Navigator>
  );
}

// Tab Navigator
function MainTabs({ route }) {
  const { role } = route.params || { role: 'employee' };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingBottom: Platform.OS === 'ios' ? 25 : 12,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        }
      }}
    >
      {role !== 'admin' && (
        <Tab.Screen 
          name="Chấm Công" 
          component={DashboardScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />
          }}
        />
      )}
      {role !== 'admin' && (
        <Tab.Screen 
          name="Lịch Sử" 
          component={HistoryScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />
          }}
        />
      )}
      {role !== 'admin' && (
        <Tab.Screen 
          name="Lương" 
          component={PayrollScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Banknote color={color} size={size} />
          }}
        />
      )}
      {role !== 'admin' && (
        <Tab.Screen 
          name="Lịch" 
          component={ScheduleScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />
          }}
        />
      )}
      {role === 'admin' && (
        <Tab.Screen 
          name="Quản Lý" 
          component={AdminStack} 
          options={{
            tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />
          }}
        />
      )}
      <Tab.Screen 
        name="Cá nhân" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [role, setRole] = useState('employee');

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        setRole(user.role || 'employee');
        setInitialRoute('MainTabs');
        
        // Setup Push Notifications
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          api.post('/users/push-token', { pushToken }).catch(e => console.log('Error saving token', e));
        }
      } else {
        setInitialRoute('Login');
      }
    } catch (e) {
      setInitialRoute('Login');
    }
  };

  if (initialRoute === null) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} initialParams={{ role }} />
        <Stack.Screen name="Requests" component={RequestsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
