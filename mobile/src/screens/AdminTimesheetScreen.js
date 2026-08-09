import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarDays, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react-native';
import api from '../services/api';

export default function AdminTimesheetScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [timesheetData, setTimesheetData] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadTimesheet();
    }, [currentDate])
  );

  const loadTimesheet = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await api.get(`/admin/timesheet/${month}/${year}`);
      setTimesheetData(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải Bảng chấm công');
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Quay lại'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bảng Chấm Công</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <ChevronLeft color="#4f46e5" size={24} />
        </TouchableOpacity>
        <View style={styles.monthBox}>
          <CalendarDays color="#64748b" size={20} />
          <Text style={styles.monthText}>Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}</Text>
        </View>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
          <ChevronRight color="#4f46e5" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={timesheetData}
          keyExtractor={item => item.userId.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <UserCheck size={20} color="#4f46e5" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.fullName || 'Nhân viên'}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={styles.statsBadge}>
                  <Text style={styles.statsText}>{item.totalDays} ngày</Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.label}>Tổng số giờ làm:</Text>
                <Text style={styles.val}>{item.totalHours} giờ</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Không có dữ liệu chấm công tháng này.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 8 },
  backText: { color: '#4f46e5', fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  navBtn: { padding: 8, backgroundColor: '#e0e7ff', borderRadius: 8 },
  monthBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  userEmail: { fontSize: 13, color: '#64748b' },
  statsBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statsText: { color: '#059669', fontWeight: 'bold', fontSize: 14 },
  
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#64748b', fontSize: 14 },
  val: { fontWeight: 'bold', color: '#334155', fontSize: 16 },
});
