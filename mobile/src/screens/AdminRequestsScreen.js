import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FileText, CheckCircle, XCircle, Clock, X } from 'lucide-react-native';
import api from '../services/api';

export default function AdminRequestsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn từ');
    } finally {
      setLoading(false);
    }
  };

  const openHandleModal = (req) => {
    setSelectedReq(req);
    setAdminNote(req.adminNote || '');
    setModalVisible(true);
  };

  const handleProcessRequest = async (status) => {
    try {
      await api.put(`/requests/${selectedReq.id}`, {
        status,
        adminNote,
        userId: selectedReq.userId
      });
      Alert.alert('Thành công', `Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} đơn`);
      setModalVisible(false);
      loadRequests();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xử lý đơn');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return '#059669';
    if (status === 'rejected') return '#dc2626';
    return '#d97706';
  };
  
  const getStatusBg = (status) => {
    if (status === 'approved') return '#d1fae5';
    if (status === 'rejected') return '#fee2e2';
    return '#fef3c7';
  };
  
  const getStatusText = (status) => {
    if (status === 'approved') return 'Đã duyệt';
    if (status === 'rejected') return 'Từ chối';
    return 'Chờ duyệt';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Quay lại'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Duyệt Đơn từ</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openHandleModal(item)}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.userName || 'Nhân viên'}</Text>
                  <Text style={styles.reqType}>{item.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <Clock size={16} color="#64748b" />
                <Text style={styles.dateText}>Ngày áp dụng: {typeof item.date === 'string' ? item.date.substring(0, 10) : item.date}</Text>
              </View>
              
              <View style={styles.reasonBox}>
                <Text style={styles.reasonTitle}>Lý do:</Text>
                <Text style={styles.reasonText}>{item.reason}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Không có đơn từ nào.</Text>}
        />
      )}

      {/* Handle Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xử lý Đơn</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.reqInfoBox}>
              <Text style={styles.reqInfoText}><Text style={{ fontWeight: 'bold' }}>Người gửi:</Text> {selectedReq?.userName}</Text>
              <Text style={styles.reqInfoText}><Text style={{ fontWeight: 'bold' }}>Loại đơn:</Text> {selectedReq?.type}</Text>
              <Text style={styles.reqInfoText}><Text style={{ fontWeight: 'bold' }}>Lý do:</Text> {selectedReq?.reason}</Text>
            </View>

            <Text style={styles.inputLabel}>Ghi chú (Tùy chọn)</Text>
            <TextInput
              style={styles.input}
              value={adminNote}
              onChangeText={setAdminNote}
              placeholder="VD: OK đồng ý"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleProcessRequest('rejected')}>
                <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Từ chối</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleProcessRequest('approved')}>
                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Duyệt</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 8 },
  backText: { color: '#4f46e5', fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  reqType: { fontSize: 13, color: '#4f46e5', marginTop: 4, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  dateText: { color: '#64748b', fontSize: 14 },
  reasonBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 },
  reasonTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  reasonText: { color: '#334155', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  reqInfoBox: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, marginBottom: 20 },
  reqInfoText: { fontSize: 14, color: '#334155', marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 20, height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { fontSize: 16, fontWeight: 'bold' }
});
