import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Search, UserPlus, Edit2, Lock, Unlock, Mail, Phone, MapPin, X } from 'lucide-react-native';
import api from '../services/api';

export default function AdminEmployeesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editSalary, setEditSalary] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      // Filter out admin if you want, or show all
      setUsers(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.fullName || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditSalary(user.hourlyRate ? user.hourlyRate.toString() : '25000');
    setModalVisible(true);
  };

  const handleUpdateSalary = async () => {
    try {
      await api.put(`/users/${selectedUser.id}`, {
        fullName: selectedUser.fullName,
        phone: selectedUser.phone,
        role: selectedUser.role,
        shift_id: selectedUser.shift_id,
        hourlyRate: parseInt(editSalary) || 0
      });
      Alert.alert('Thành công', 'Đã cập nhật lương theo giờ');
      setModalVisible(false);
      loadUsers();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật lương');
    }
  };

  const handleDelete = (user) => {
    Alert.alert('Xác nhận', `Xóa nhân viên ${user.fullName || user.email}?`, [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/${user.id}`);
            loadUsers();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa');
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
        <Text style={styles.title}>Nhân sự</Text>
        <TouchableOpacity style={styles.addBtn}>
          <UserPlus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#94a3b8" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Tìm tên, email..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.fullName || 'Chưa cập nhật tên'}</Text>
                  <Text style={styles.userRole}>{item.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</Text>
                </View>
                <View style={styles.salaryBadge}>
                  <Text style={styles.salaryText}>{(item.hourlyRate || 0).toLocaleString()} đ/h</Text>
                </View>
              </View>

              <View style={styles.contactInfo}>
                <View style={styles.infoRow}>
                  <Mail size={14} color="#64748b" />
                  <Text style={styles.infoText}>{item.email}</Text>
                </View>
                {item.phone && (
                  <View style={styles.infoRow}>
                    <Phone size={14} color="#64748b" />
                    <Text style={styles.infoText}>{item.phone}</Text>
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#e0e7ff' }]} onPress={() => openEditModal(item)}>
                  <Edit2 size={16} color="#4f46e5" />
                  <Text style={[styles.actionText, { color: '#4f46e5' }]}>Sửa lương</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#fee2e2' }]} onPress={() => handleDelete(item)}>
                  <X size={16} color="#dc2626" />
                  <Text style={[styles.actionText, { color: '#dc2626' }]}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cập nhật lương</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubTitle}>{selectedUser?.fullName}</Text>
            
            <Text style={styles.inputLabel}>Lương theo giờ (VNĐ)</Text>
            <TextInput
              style={styles.input}
              value={editSalary}
              onChangeText={setEditSalary}
              keyboardType="numeric"
              placeholder="VD: 25000"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateSalary}>
              <Text style={styles.submitBtnText}>Cập nhật</Text>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  userRole: { fontSize: 13, color: '#64748b', marginTop: 4 },
  salaryBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#d1fae5', borderRadius: 8 },
  salaryText: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
  contactInfo: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#334155' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e0e7ff' },
  actionText: { fontWeight: 'bold', fontSize: 13 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  modalSubTitle: { color: '#64748b', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 24 },
  submitBtn: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
