import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calculator, Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import api from '../services/api';

export default function PayrollScreen() {
  const date = new Date();
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadPayroll();
    }, [selectedMonth, selectedYear])
  );

  const loadPayroll = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/payroll/${selectedMonth}/${selectedYear}`);
      setPayroll(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const changeMonth = (delta) => {
    let newM = selectedMonth + delta;
    let newY = selectedYear;
    if (newM > 12) { newM = 1; newY++; }
    else if (newM < 1) { newM = 12; newY--; }
    setSelectedMonth(newM);
    setSelectedYear(newY);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bảng lương cá nhân</Text>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.btnNav}>
            <Text style={styles.btnNavText}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.currentMonth}>
            <CalendarIcon size={18} color="#4f46e5" />
            <Text style={styles.monthText}>Tháng {selectedMonth}/{selectedYear}</Text>
          </View>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.btnNav}>
            <Text style={styles.btnNavText}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : payroll ? (
        <View style={styles.content}>
          <View style={styles.salaryCard}>
            <View style={styles.salaryIconWrap}>
              <Calculator size={28} color="#fff" />
            </View>
            <Text style={styles.salaryLabel}>TỔNG THU NHẬP DỰ KIẾN</Text>
            <Text style={styles.salaryAmount}>{formatMoney(payroll.salary)}</Text>
            <View style={styles.rateBadge}>
              <Text style={styles.rateText}>Mức lương: {formatMoney(payroll.hourlyRate)}/h</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Clock size={24} color="#6366f1" />
              <Text style={styles.statVal}>{payroll.totalHours}h</Text>
              <Text style={styles.statLabel}>Tổng giờ làm</Text>
            </View>
            <View style={styles.statBox}>
              <CalendarIcon size={24} color="#0ea5e9" />
              <Text style={styles.statVal}>{payroll.totalDays}</Text>
              <Text style={styles.statLabel}>Ngày đi làm</Text>
            </View>
          </View>

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <View style={styles.detailLeft}>
                <CheckCircle2 size={20} color="#10b981" />
                <Text style={styles.detailText}>Ngày công hợp lệ</Text>
              </View>
              <Text style={styles.detailNum}>{payroll.validDays}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailLeft}>
                <AlertTriangle size={20} color="#f43f5e" />
                <Text style={styles.detailText}>Ngày lỗi (trễ/sớm/thiếu giờ)</Text>
              </View>
              <Text style={[styles.detailNum, {color: '#f43f5e'}]}>{payroll.errorDays}</Text>
            </View>
          </View>
        </View>
      ) : (
        <Text style={styles.empty}>Không có dữ liệu tháng này</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { marginTop: 100, alignItems: 'center' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 16 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnNav: { padding: 10, backgroundColor: '#f1f5f9', borderRadius: 12 },
  btnNavText: { fontSize: 16, fontWeight: 'bold', color: '#475569' },
  currentMonth: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthText: { fontSize: 16, fontWeight: 'bold', color: '#4f46e5' },
  content: { padding: 20 },
  salaryCard: { backgroundColor: '#4f46e5', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, marginBottom: 24 },
  salaryIconWrap: { backgroundColor: '#6366f1', pading: 12, borderRadius: 16, marginBottom: 16 },
  salaryLabel: { color: '#c7d2fe', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  salaryAmount: { color: '#fff', fontSize: 36, fontWeight: '900', marginBottom: 16 },
  rateBadge: { backgroundColor: '#3730a3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  rateText: { color: '#e0e7ff', fontSize: 12, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  statVal: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 12, marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#64748b' },
  detailsList: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  detailNum: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});
