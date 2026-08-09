import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Plus, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';

export default function RequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [type, setType] = useState('Nghỉ phép');
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [employees, setEmployees] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const requestTypes = ['Nghỉ phép', 'Đi trễ', 'Làm thêm giờ', 'Đổi ca', 'Khác'];

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [])
  );

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests/my');
      setRequests(res.data);
      
      const empRes = await api.get('/employees/list');
      setEmployees(empRes.data);
      if (empRes.data.length > 0) {
        setTargetUserId(empRes.data[0].id);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn từ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!date || !reason) {
      Alert.alert('Lỗi', 'Vui lòng nhập Ngày và Lý do');
      return;
    }
    try {
      setSubmitLoading(true);
      
      let payload = { type, date, reason };
      if (type === 'Đổi ca') {
        const targetEmp = employees.find(e => e.id === targetUserId);
        if (targetEmp) {
          payload.targetUserId = targetEmp.id;
          payload.targetUserName = targetEmp.fullName || targetEmp.email;
        }
      }

      await api.post('/requests', payload);
      Alert.alert('Thành công', 'Đã gửi đơn chờ duyệt');
      setModalVisible(false);
      setDate('');
      setReason('');
      fetchRequests();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể gửi đơn');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderStatus = (status) => {
    switch(status) {
      case 'approved': return <View style={[styles.statusBadge, {backgroundColor: '#dcfce7'}]}><CheckCircle size={12} color="#16a34a"/><Text style={[styles.statusText, {color: '#16a34a'}]}>Đã duyệt</Text></View>;
      case 'rejected': return <View style={[styles.statusBadge, {backgroundColor: '#fee2e2'}]}><XCircle size={12} color="#dc2626"/><Text style={[styles.statusText, {color: '#dc2626'}]}>Từ chối</Text></View>;
      default: return <View style={[styles.statusBadge, {backgroundColor: '#fef3c7'}]}><Clock size={12} color="#d97706"/><Text style={[styles.statusText, {color: '#d97706'}]}>Chờ duyệt</Text></View>;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>{item.type}</Text>
        {renderStatus(item.status)}
      </View>
      <Text style={styles.cardDate}>Ngày áp dụng: {item.date}</Text>
      {item.type === 'Đổi ca' && item.targetUserName && (
        <Text style={styles.cardDate}>Đổi với: {item.targetUserName}</Text>
      )}
      <Text style={styles.cardReason}>{item.reason}</Text>
      {item.adminNote && <Text style={styles.cardNote}>Phản hồi: {item.adminNote}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#1e293b" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn từ của tôi</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#4f46e5" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>Bạn chưa tạo đơn nào.</Text>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>

      {/* Modal Tạo Đơn */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tạo Đơn Mới</Text>
            
            <Text style={styles.label}>Loại đơn</Text>
            <View style={styles.typeContainer}>
              {requestTypes.map(t => (
                <TouchableOpacity 
                  key={t} 
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Ngày áp dụng</Text>
            <TouchableOpacity 
              style={[styles.input, { justifyContent: 'center' }]} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: date ? '#1e293b' : '#94a3b8', fontSize: 16 }}>
                {date ? new Date(date).toLocaleDateString('vi-VN') : 'Chọn ngày'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date ? new Date(date) : new Date()}
                mode="date"
                display="default"
                onValueChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                  if (selectedDate) {
                    const offset = selectedDate.getTimezoneOffset();
                    const localDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
                    setDate(localDate.toISOString().split('T')[0]);
                  }
                }}
                onDismiss={() => {
                  setShowDatePicker(false);
                }}
              />
            )}

            {type === 'Đổi ca' && (
              <>
                <Text style={styles.label}>Người muốn đổi ca cùng</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={targetUserId}
                    onValueChange={(val) => setTargetUserId(val)}
                  >
                    {employees.map(emp => (
                      <Picker.Item key={emp.id} label={emp.fullName || emp.email} value={emp.id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <Text style={styles.label}>Lý do</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Nhập lý do chi tiết..."
              multiline
              value={reason}
              onChangeText={setReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitLoading}>
                {submitLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Gửi Đơn</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#fff', padding: 16, paddingTop: 40,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40 },
  
  card: { 
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardType: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  cardDate: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  cardReason: { fontSize: 14, color: '#334155' },
  cardNote: { fontSize: 13, color: '#ef4444', marginTop: 8, fontStyle: 'italic' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4f46e5',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4f46e5', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1e293b' },
  
  label: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f8fafc' },
  
  typeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  typeBtnActive: { backgroundColor: '#e0e7ff', borderColor: '#4f46e5' },
  typeText: { fontSize: 13, color: '#475569' },
  typeTextActive: { color: '#4f46e5', fontWeight: 'bold' },
  
  pickerContainer: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: '#f8fafc', marginBottom: 4 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: 'bold' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#4f46e5', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold' },
});
