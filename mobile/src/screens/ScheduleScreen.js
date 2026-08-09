import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, Clock } from 'lucide-react-native';
import api from '../services/api';

export default function ScheduleScreen() {
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState([]);
  const [shiftsDef, setShiftsDef] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch settings to get shift definitions
      const dashRes = await api.get('/attendance/dashboard-full');
      const shifts = dashRes.data?.settings?.shifts || [];
      setShiftsDef(shifts);

      // Fetch user's schedule
      const schedRes = await api.get('/attendance/my-schedule');
      const { defaultShiftId, dailyShifts } = schedRes.data;

      // Generate the next 14 days schedule
      const next14Days = [];
      const today = new Date();
      
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Check if there is an override in dailyShifts
        const override = dailyShifts.find(ds => ds.date === dateStr || (typeof ds.date === 'string' && ds.date.startsWith(dateStr)));
        const finalShiftId = override ? override.shift_id : defaultShiftId;
        const isSwapped = !!override;

        const shiftInfo = shifts.find(s => s.id === finalShiftId) || { name: 'Chưa xếp ca', startTime: '--:--', endTime: '--:--' };
        
        next14Days.push({
          dateStr,
          dateObj: d,
          shiftInfo,
          isSwapped
        });
      }

      setScheduleData(next14Days);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isToday = item.dateStr === new Date().toISOString().split('T')[0];
    const dayOfWeek = item.dateObj.toLocaleDateString('vi-VN', { weekday: 'long' });
    const dateFormatted = item.dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
      <View style={[styles.card, isToday && styles.cardToday]}>
        <View style={styles.dateContainer}>
          <Text style={[styles.dayText, isToday && styles.textToday]}>{dayOfWeek}</Text>
          <Text style={styles.dateText}>{dateFormatted}</Text>
          {isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>Hôm nay</Text></View>}
        </View>
        <View style={styles.shiftContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Calendar size={16} color={item.isSwapped ? "#f59e0b" : "#4f46e5"} />
            <Text style={[styles.shiftName, item.isSwapped && { color: '#d97706' }]}>
              {item.shiftInfo.name}
            </Text>
            {item.isSwapped && (
              <View style={styles.swappedBadge}>
                <Text style={styles.swappedText}>Đã đổi ca</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color="#64748b" />
            <Text style={styles.timeText}>
              {item.shiftInfo.startTime} - {item.shiftInfo.endTime}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Làm Việc (14 ngày tới)</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={scheduleData}
          keyExtractor={(item) => item.dateStr}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#fff', padding: 16, paddingTop: 40,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    alignItems: 'center'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, gap: 12, paddingBottom: 100 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  cardToday: {
    borderColor: '#4f46e5',
    backgroundColor: '#f5f3ff',
    borderWidth: 2
  },
  dateContainer: {
    width: 90,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingRight: 12,
    alignItems: 'center'
  },
  dayText: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 4, textTransform: 'capitalize' },
  dateText: { fontSize: 12, color: '#64748b' },
  textToday: { color: '#4f46e5' },
  todayBadge: { backgroundColor: '#4f46e5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 6 },
  todayBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  shiftContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center'
  },
  shiftName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  timeText: { fontSize: 14, color: '#64748b' },
  swappedBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  swappedText: { color: '#d97706', fontSize: 10, fontWeight: 'bold' }
});
