import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert, Modal, TextInput, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { History, CalendarDays, Edit2, Trash2, X, Clock } from 'lucide-react-native';
import api from '../services/api';

export default function AdminAttendanceLogsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  
  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [currentDate])
  );

  const loadLogs = async () => {
    try {
      setLoading(true);
      const dateStr = currentDate.toISOString().split('T')[0];
      const res = await api.get(`/admin/attendance?startStr=${dateStr}&endStr=${dateStr}`);
      setLogs(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải Lịch chấm công');
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + delta);
    setCurrentDate(newDate);
  };

  const formatTime = (millis) => {
    if (!millis) return '--:--';
    return new Date(millis).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const openEditModal = (log) => {
    setSelectedLog(log);
    setEditCheckIn(formatTime(log.checkInTimeMillis));
    setEditCheckOut(formatTime(log.checkOutTimeMillis));
    setModalVisible(true);
  };

  const handleDelete = (log) => {
    Alert.alert('Xác nhận', `Xóa bản ghi chấm công của ${log.userName}?`, [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/admin/attendance/update', {
              action: 'delete',
              id: log.id
            });
            loadLogs();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa');
          }
        }
      }
    ]);
  };

  const handleSaveEdit = async () => {
    try {
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(editCheckIn) || (editCheckOut !== '--:--' && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(editCheckOut))) {
        return Alert.alert('Lỗi', 'Định dạng giờ không hợp lệ (HH:mm)');
      }
      
      const dateStr = typeof selectedLog.date === 'string' ? selectedLog.date.split('T')[0] : selectedLog.date;

      await api.post('/admin/attendance/update', {
        action: 'update',
        id: selectedLog.id,
        userId: selectedLog.userId,
        date: dateStr,
        checkInTime: editCheckIn,
        checkOutTime: editCheckOut === '--:--' ? null : editCheckOut
      });
      
      Alert.alert('Thành công', 'Đã sửa giờ chấm công');
      setModalVisible(false);
      loadLogs();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu bản ghi');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Quay lại'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Lịch Chấm Công</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navBtn}>
          <Text style={styles.navText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.dateBox}>
          <CalendarDays color="#64748b" size={20} />
          <Text style={styles.dateText}>{currentDate.toLocaleDateString('vi-VN')}</Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.navBtn}>
          <Text style={styles.navText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.userName || 'Nhân viên'}</Text>
                  <Text style={[styles.statusText, { color: item.checkOutTimeMillis ? '#059669' : '#d97706' }]}>
                    {item.checkOutTimeMillis ? 'Đã hoàn thành' : 'Đang làm việc'}
                  </Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Giờ vào</Text>
                  <Text style={styles.timeVal}>{formatTime(item.checkInTimeMillis)}</Text>
                </View>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Giờ ra</Text>
                  <Text style={styles.timeVal}>{formatTime(item.checkOutTimeMillis)}</Text>
                </View>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Tổng giờ</Text>
                  <Text style={[styles.timeVal, { color: '#4f46e5' }]}>{item.totalHours}h</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#e0e7ff' }]} onPress={() => openEditModal(item)}>
                  <Edit2 size={16} color="#4f46e5" />
                  <Text style={[styles.actionText, { color: '#4f46e5' }]}>Sửa giờ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#fee2e2' }]} onPress={() => handleDelete(item)}>
                  <Trash2 size={16} color="#dc2626" />
                  <Text style={[styles.actionText, { color: '#dc2626' }]}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Không có dữ liệu trong ngày này.</Text>}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa giờ chấm công</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubTitle}>{selectedLog?.userName}</Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Giờ vào (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  value={editCheckIn}
                  onChangeText={setEditCheckIn}
                  placeholder="08:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Giờ ra (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  value={editCheckOut}
                  onChangeText={setEditCheckOut}
                  placeholder="17:00"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit}>
              <Text style={styles.submitBtnText}>Lưu thay đổi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  navBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e0e7ff', borderRadius: 8 },
  navText: { color: '#4f46e5', fontWeight: 'bold', fontSize: 16 },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  statusText: { fontSize: 13, marginTop: 4, fontWeight: 'bold' },
  
  timeRow: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 16 },
  timeBox: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  timeVal: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  actionText: { fontWeight: 'bold', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  modalSubTitle: { color: '#64748b', marginBottom: 20, fontSize: 16 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 20 },
  submitBtn: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
