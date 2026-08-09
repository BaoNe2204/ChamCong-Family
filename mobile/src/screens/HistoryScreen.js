import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, CheckCircle2, XCircle } from 'lucide-react-native';
import api from '../services/api';

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/attendance/dashboard-full');
      if (response.data?.history) {
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const checkInTime = new Date(item.checkInTimeMillis).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
    const checkOutTime = item.checkOutTimeMillis 
      ? new Date(item.checkOutTimeMillis).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) 
      : '--:--';

    let statusLabel = 'Đang làm';
    let statusColor = '#3b82f6';
    let Icon = Clock;

    if (item.checkOutTimeMillis) {
      if (item.status === 'LATE' || item.status === 'EARLY_LEAVE') {
        statusLabel = item.status === 'LATE' ? 'Đi trễ' : 'Về sớm';
        statusColor = '#f59e0b';
        Icon = XCircle;
      } else {
        statusLabel = item.status === 'OT' ? 'Hợp lệ + OT' : 'Hợp lệ';
        statusColor = '#10b981';
        Icon = CheckCircle2;
      }
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{item.date}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Icon size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Vào ca</Text>
            <Text style={styles.timeVal}>{checkInTime}</Text>
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Tan ca</Text>
            <Text style={styles.timeVal}>{checkOutTime}</Text>
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Tổng giờ</Text>
            <Text style={styles.timeVal}>{item.totalHours ? `${item.totalHours}h` : '--'}</Text>
          </View>
        </View>

        {(item.late_minutes > 0 || item.early_leave_minutes > 0 || item.overtime_hours > 0) && (
          <View style={styles.detailsRow}>
            {item.late_minutes > 0 && <Text style={styles.detailTextWarn}>Trễ {item.late_minutes}p</Text>}
            {item.early_leave_minutes > 0 && <Text style={styles.detailTextWarn}>Sớm {item.early_leave_minutes}p</Text>}
            {item.overtime_hours > 0 && <Text style={styles.detailTextSuccess}>OT {item.overtime_hours}h</Text>}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lịch sử chấm công</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Chưa có dữ liệu</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginHorizontal: 16, marginTop: 60, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  timeBlock: { alignItems: 'center' },
  timeLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  timeVal: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  detailsRow: { flexDirection: 'row', gap: 10, marginTop: 12, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8 },
  detailTextWarn: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
  detailTextSuccess: { color: '#10b981', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 50 }
});
