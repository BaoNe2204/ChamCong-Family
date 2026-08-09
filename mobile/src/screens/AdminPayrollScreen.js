import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Banknote, ChevronLeft, ChevronRight, Calculator, CalendarDays } from 'lucide-react-native';
import api from '../services/api';

export default function AdminPayrollScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [payrollList, setPayrollList] = useState([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadPayroll();
    }, [currentDate])
  );

  const loadPayroll = async () => {
    try {
      setLoading(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await api.get(`/admin/payroll/${month}/${year}`);
      setPayrollList(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải bảng lương');
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const totalSalary = payrollList.reduce((acc, curr) => acc + (curr.salary || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Quay lại'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bảng Lương</Text>
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

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng quỹ lương tháng này</Text>
        <Text style={styles.summaryVal}>{totalSalary.toLocaleString('vi-VN')} đ</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={payrollList}
          keyExtractor={item => item.userId.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.fullName || 'Nhân viên'}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <Text style={styles.salaryTotal}>{(item.salary || 0).toLocaleString('vi-VN')} đ</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Ngày công</Text>
                  <Text style={styles.statVal}>{item.validDays} ngày</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Giờ công</Text>
                  <Text style={styles.statVal}>{item.baseHours}h</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Tăng ca</Text>
                  <Text style={styles.statVal}>{item.overtimeHours}h</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Thưởng/Phạt</Text>
                  <Text style={[styles.statVal, { color: (item.bonus - item.penalty) >= 0 ? '#059669' : '#dc2626' }]}>
                    {item.bonus - item.penalty >= 0 ? '+' : ''}{(item.bonus - item.penalty).toLocaleString('vi-VN')} đ
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Không có dữ liệu lương tháng này.</Text>}
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
  
  summaryCard: { margin: 16, backgroundColor: '#4f46e5', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  summaryLabel: { color: '#e0e7ff', fontSize: 14, marginBottom: 8 },
  summaryVal: { color: '#fff', fontSize: 28, fontWeight: '900' },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  userEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  salaryTotal: { fontSize: 18, fontWeight: '900', color: '#059669' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { width: '48%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  statVal: { fontSize: 15, fontWeight: 'bold', color: '#334155' }
});
