import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { MapPin, Bell, Clock, WifiOff } from 'lucide-react-native';
import api from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Đang lấy vị trí...');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({ requireWifi: false, isConnected: true });
  const [workedSeconds, setWorkedSeconds] = useState(0);

  useEffect(() => {
    let networkInterval = null;
    
    const checkNetwork = async () => {
      try {
        const res = await api.get('/attendance/check-network');
        if (res.data) setNetworkStatus(res.data);
      } catch (e) {}
    };

    checkNetwork();
    networkInterval = setInterval(checkNetwork, 5000);

    return () => {
      if (networkInterval) clearInterval(networkInterval);
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (data?.todayRecord && !data.todayRecord.checkOutTimeMillis) {
      // Calculate immediate diff
      const calcDiff = () => {
        const now = Date.now();
        const diff = Math.floor((now - data.todayRecord.checkInTimeMillis) / 1000);
        setWorkedSeconds(diff > 0 ? diff : 0);
      };
      calcDiff(); // initial
      interval = setInterval(calcDiff, 1000);
    } else {
      setWorkedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [data?.todayRecord]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useFocusEffect(
    useCallback(() => {
      loadUserAndData();
    }, [])
  );

  const loadUserAndData = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      let currentUser = userStr ? JSON.parse(userStr) : null;
      if (currentUser) setUser(currentUser);
      
      const response = await api.get('/attendance/dashboard-full');
      setData(response.data);
      
      if (response.data.userInfo && currentUser) {
        const updatedUser = { ...currentUser, ...response.data.userInfo };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }

      checkLocation(response.data.settings);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      } else {
        Alert.alert('Lỗi tải dữ liệu', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkLocation = async (settings) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationStatus('Chưa cấp quyền GPS');
      setIsReady(false);
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setCurrentLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });

      const distance = getDistanceFromLatLonInM(
        location.coords.latitude, 
        location.coords.longitude, 
        settings.factoryLat, 
        settings.factoryLng
      );

      if (distance <= settings.maxDistance) {
        setLocationStatus(`Hợp lệ (Cách ${Math.round(distance)}m)`);
        setIsReady(true);
      } else {
        setLocationStatus(`Ngoài vùng (${Math.round(distance)}m)`);
        setIsReady(false);
      }
    } catch (err) {
      setLocationStatus('Lỗi lấy GPS');
      setIsReady(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentLocation) return;
    setActionLoading(true);
    try {
      const result = await api.post('/attendance/checkin', {
        lat: currentLocation.lat,
        lng: currentLocation.lng
      });
      Speech.speak('Đã chấm công thành công!', { language: 'vi-VN' });
      Alert.alert('Thành công', result.data.message || 'Check-in thành công!');
      loadUserAndData();
    } catch (error) {
      Alert.alert('Lỗi Check-in', error.response?.data?.error || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const result = await api.post('/attendance/checkout');
      Speech.speak('Đã chấm công thành công!', { language: 'vi-VN' });
      Alert.alert('Thành công', result.data.message || 'Check-out thành công!');
      loadUserAndData();
    } catch (error) {
      Alert.alert('Lỗi Check-out', error.response?.data?.error || error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{marginTop: 10, color: '#64748b'}}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  // Calculate Status
  let shiftStatus = 'CHƯA VÀO CA';
  if (data?.todayRecord) {
     if (data.todayRecord.checkOutTimeMillis) {
        shiftStatus = 'ĐÃ RA VỀ';
     } else {
        shiftStatus = 'ĐANG TRONG CA';
     }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.name}>{user?.fullName || user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Bell size={24} color="#475569" />
            {data?.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{data.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      {/* GPS Status */}
      <View style={[styles.card, styles.gpsCard]}>
        <MapPin size={24} color={isReady ? '#10b981' : '#f59e0b'} />
        <View style={styles.gpsInfo}>
          <Text style={styles.gpsTitle}>Trạng thái GPS</Text>
          <Text style={[styles.gpsStatus, { color: isReady ? '#10b981' : '#f59e0b' }]}>
            {locationStatus}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => checkLocation(data?.settings)}>
          <Text style={styles.refreshText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Checkin / Checkout Action */}
      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Chấm công hôm nay</Text>
        
        {networkStatus.requireWifi && !networkStatus.isConnected && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 12, marginBottom: 16 }}>
            <WifiOff size={20} color="#ef4444" />
            <Text style={{ marginLeft: 8, color: '#ef4444', fontWeight: 'bold' }}>Vui lòng kết nối Wi-Fi nhà để bấm</Text>
          </View>
        )}
        
        {shiftStatus === 'CHƯA VÀO CA' && (
          <TouchableOpacity 
            style={[styles.mainBtn, (!isReady || (networkStatus.requireWifi && !networkStatus.isConnected)) && styles.mainBtnDisabled]} 
            onPress={handleCheckIn}
            disabled={!isReady || (networkStatus.requireWifi && !networkStatus.isConnected) || actionLoading}
          >
            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>VÀO CA (CHECK-IN)</Text>}
          </TouchableOpacity>
        )}

        {shiftStatus === 'ĐANG TRONG CA' && (
          <View>
            <View style={styles.timerCard}>
              <Text style={styles.timerLabel}>Thời gian đã làm hôm nay</Text>
              <Text style={styles.timerValue}>{formatTime(workedSeconds)}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.mainBtn, styles.checkoutBtn]} 
              onPress={handleCheckOut}
              disabled={actionLoading}
            >
              {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>TAN CA (CHECK-OUT)</Text>}
            </TouchableOpacity>
          </View>
        )}

        {shiftStatus === 'ĐÃ RA VỀ' && (
          <View style={styles.doneWrapper}>
            <View style={styles.doneCard}>
              <Text style={styles.doneTitle}>ĐÃ CHỐT CA GẦN NHẤT!</Text>
              <Text style={styles.doneSub}>Bạn đã ra về. Có thể vào ca tiếp nếu cần.</Text>
            </View>
            <TouchableOpacity 
              style={[styles.mainBtn, (!isReady || (networkStatus.requireWifi && !networkStatus.isConnected)) && styles.mainBtnDisabled, { marginTop: 12 }]} 
              onPress={handleCheckIn}
              disabled={!isReady || (networkStatus.requireWifi && !networkStatus.isConnected) || actionLoading}
            >
              {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>VÀO CA LẠI (PHIÊN MỚI)</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats overview */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Clock size={20} color="#6366f1" />
          <Text style={styles.statLabel}>Giờ làm tháng này</Text>
          <Text style={styles.statVal}>{data?.stats?.totalHoursMonth || 0}h</Text>
        </View>
        <View style={styles.statBox}>
          <Clock size={20} color="#f59e0b" />
          <Text style={styles.statLabel}>Giờ OT</Text>
          <Text style={styles.statVal}>{data?.stats?.otHours || 0}h</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  greeting: { fontSize: 16, color: '#64748b' },
  name: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  bellBtn: { padding: 8, position: 'relative' },
  badge: {
    position: 'absolute', top: 4, right: 4, 
    backgroundColor: '#ef4444', minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center'
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 },
  gpsCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  gpsInfo: { marginLeft: 12, flex: 1 },
  gpsTitle: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  gpsStatus: { fontSize: 15, fontWeight: '900', marginTop: 2 },
  refreshBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  refreshText: { fontSize: 12, fontWeight: 'bold', color: '#334155' },

  actionSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 15 },
  mainBtn: { backgroundColor: '#10b981', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  mainBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  checkoutBtn: { backgroundColor: '#f43f5e', shadowColor: '#f43f5e' },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  doneWrapper: { width: '100%' },
  doneCard: { backgroundColor: '#ecfdf5', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#a7f3d0' },
  doneTitle: { color: '#059669', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  doneSub: { color: '#047857', fontSize: 13, textAlign: 'center' },

  timerCard: { backgroundColor: '#eff6ff', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#bfdbfe' },
  timerLabel: { color: '#3b82f6', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  timerValue: { color: '#1e3a8a', fontSize: 32, fontWeight: '900', fontVariant: ['tabular-nums'] },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 8, marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: '900', color: '#0f172a' }
});
