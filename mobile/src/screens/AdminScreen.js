import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Users, UserCheck, Clock, CheckCircle2, XCircle, FileText, Settings, Banknote, CalendarDays, History } from 'lucide-react-native';
import api from '../services/api';

export default function AdminScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, working: 0, late: 0 });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/attendance');

      // Filter for today
      const today = new Date();
      const todayRecords = res.data.filter(r => {
        const d = new Date(r.date);
        return d.getDate() === today.getDate() && 
               d.getMonth() === today.getMonth() && 
               d.getFullYear() === today.getFullYear();
      });

      const working = todayRecords.filter(r => !r.checkOutTimeMillis).length;
      const late = todayRecords.filter(r => r.status === 'LATE' || r.late_minutes > 0).length;

      setData(todayRecords);
      setStats({
        total: todayRecords.length,
        working,
        late
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (millis) => {
    if (!millis) return '--:--';
    return new Date(millis).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Quản Lý</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Quản lý Hệ thống</Text>
          <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AdminEmployees')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#e0e7ff' }]}>
                <Users size={24} color="#4f46e5" />
              </View>
              <Text style={styles.gridText}>Nhân sự</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AdminShifts')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fef3c7' }]}>
                <Clock size={24} color="#d97706" />
              </View>
              <Text style={styles.gridText}>Ca làm việc</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AdminRequests')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#d1fae5' }]}>
                <FileText size={24} color="#059669" />
              </View>
              <Text style={styles.gridText}>Đơn từ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AdminPayroll')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fee2e2' }]}>
                <Banknote size={24} color="#dc2626" />
              </View>
              <Text style={styles.gridText}>Bảng lương</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AdminTimesheet')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#e0f2fe' }]}>
                <CalendarDays size={24} color="#0284c7" />
              </View>
              <Text style={styles.gridText}>Bảng chấm công</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AdminAttendanceLogs')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fce7f3' }]}>
                <History size={24} color="#db2777" />
              </View>
              <Text style={styles.gridText}>Lịch chấm công</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('AdminSettings')}>
              <View style={[styles.iconWrapper, { backgroundColor: '#f3f4f6' }]}>
                <Settings size={24} color="#4b5563" />
              </View>
              <Text style={styles.gridText}>Cài đặt</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Báo cáo Hôm nay</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <Users size={20} color="#3b82f6" />
              <Text style={styles.statVal}>{stats.total}</Text>
              <Text style={styles.statLabel}>Lượt chấm công</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <UserCheck size={20} color="#22c55e" />
              <Text style={styles.statVal}>{stats.working}</Text>
              <Text style={styles.statLabel}>Đang làm</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <Clock size={20} color="#ef4444" />
              <Text style={styles.statVal}>{stats.late}</Text>
              <Text style={styles.statLabel}>Đi trễ</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Lượt chấm công hôm nay</Text>

          {data.length === 0 ? (
            <Text style={styles.empty}>Chưa có ai chấm công hôm nay</Text>
          ) : (
            data.map(record => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(record.userName || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{record.userName}</Text>
                    <Text style={styles.userEmail}>{record.userEmail}</Text>
                  </View>
                  {!record.checkOutTimeMillis ? (
                    <View style={[styles.badge, { backgroundColor: '#eff6ff' }]}>
                      <Text style={[styles.badgeText, { color: '#3b82f6' }]}>Đang làm</Text>
                    </View>
                  ) : record.status === 'LATE' || record.status === 'EARLY_LEAVE' ? (
                    <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                      <XCircle size={12} color="#d97706" />
                      <Text style={[styles.badgeText, { color: '#d97706', marginLeft: 4 }]}>
                        {record.status === 'LATE' ? 'Trễ' : 'Sớm'}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                      <CheckCircle2 size={12} color="#059669" />
                      <Text style={[styles.badgeText, { color: '#059669', marginLeft: 4 }]}>Hợp lệ</Text>
                    </View>
                  )}
                </View>

                <View style={styles.recordTimes}>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Vào:</Text>
                    <Text style={styles.timeVal}>{formatTime(record.checkInTimeMillis)}</Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Ra:</Text>
                    <Text style={styles.timeVal}>{formatTime(record.checkOutTimeMillis)}</Text>
                  </View>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Tổng:</Text>
                    <Text style={[styles.timeVal, { color: '#4f46e5' }]}>{record.totalHours ? `${record.totalHours}h` : '--'}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  center: { marginTop: 100, alignItems: 'center' },
  content: { padding: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  gridItem: { width: '31%', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  iconWrapper: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gridText: { fontSize: 12, fontWeight: 'bold', color: '#334155', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', opacity: 0.8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  recordCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  recordHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#64748b' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  userEmail: { fontSize: 12, color: '#64748b' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  recordTimes: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeLabel: { fontSize: 12, color: '#64748b' },
  timeVal: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});
