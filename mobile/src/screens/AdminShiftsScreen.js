import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import api from '../services/api';

export default function AdminShiftsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [fullSettings, setFullSettings] = useState({});
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadShifts();
    }, [])
  );

  const loadShifts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setFullSettings(res.data || {});
      setShifts(res.data?.shifts || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải danh sách ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentShiftId(null);
    setShiftName('');
    setStartTime('');
    setEndTime('');
    setModalVisible(true);
  };

  const openEditModal = (shift) => {
    setIsEditing(true);
    setCurrentShiftId(shift.id);
    setShiftName(shift.name);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setModalVisible(true);
  };

  const validateTime = (timeStr) => {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
  };

  const handleSaveShift = async () => {
    if (!shiftName.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tên ca');
    if (!validateTime(startTime) || !validateTime(endTime)) {
      return Alert.alert('Lỗi', 'Định dạng giờ không hợp lệ (HH:mm)');
    }

    try {
      let newShifts = [...shifts];
      if (isEditing) {
        newShifts = newShifts.map(s => 
          s.id === currentShiftId ? { id: currentShiftId, name: shiftName, startTime, endTime } : s
        );
      } else {
        const newId = 'shift_' + Date.now();
        newShifts.push({ id: newId, name: shiftName, startTime, endTime });
      }
      
      const newSettings = { ...fullSettings, shifts: newShifts };
      await api.post('/settings', newSettings);
      
      Alert.alert('Thành công', isEditing ? 'Đã cập nhật ca làm việc' : 'Đã thêm ca làm việc mới');
      setModalVisible(false);
      loadShifts();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu ca làm việc');
    }
  };

  const handleDeleteShift = (id) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa ca làm việc này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          try {
            const newShifts = shifts.filter(s => s.id !== id);
            const newSettings = { ...fullSettings, shifts: newShifts };
            await api.post('/settings', newSettings);
            loadShifts();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa ca làm việc');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Quay lại'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ca làm việc</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Clock size={20} color="#d97706" />
                </View>
                <Text style={styles.shiftName}>{item.name}</Text>
              </View>
              
              <View style={styles.timeBox}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Bắt đầu</Text>
                  <Text style={styles.timeVal}>{item.startTime}</Text>
                </View>
                <View style={styles.timeDivider} />
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Kết thúc</Text>
                  <Text style={styles.timeVal}>{item.endTime}</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#e0e7ff' }]} onPress={() => openEditModal(item)}>
                  <Edit2 size={16} color="#4f46e5" />
                  <Text style={[styles.actionText, { color: '#4f46e5' }]}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#fee2e2' }]} onPress={() => handleDeleteShift(item.id)}>
                  <Trash2 size={16} color="#dc2626" />
                  <Text style={[styles.actionText, { color: '#dc2626' }]}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có ca làm việc nào.</Text>}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Sửa Ca' : 'Thêm Ca mới'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Tên ca</Text>
            <TextInput
              style={styles.input}
              value={shiftName}
              onChangeText={setShiftName}
              placeholder="VD: Ca Sáng"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Giờ vào (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="08:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Giờ ra (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="17:00"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveShift}>
              <Text style={styles.submitBtnText}>Lưu Ca làm việc</Text>
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
  addBtn: { width: 36, height: 36, backgroundColor: '#4f46e5', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconWrapper: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  shiftName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  timeBox: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, alignItems: 'center' },
  timeCol: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  timeVal: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  timeDivider: { width: 1, height: 30, backgroundColor: '#cbd5e1', marginHorizontal: 16 },
  
  actions: { flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  actionText: { fontWeight: 'bold', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 20 },
  submitBtn: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
