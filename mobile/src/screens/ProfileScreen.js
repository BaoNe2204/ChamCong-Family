import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LogOut, Key, FileText, ChevronRight } from 'lucide-react-native';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
    ]);
  };

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    try {
      setLoading(true);
      await api.put('/users/change-password', passwords);
      Alert.alert('Thành công', 'Đổi mật khẩu thành công');
      setModalVisible(false);
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</Text>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Requests')}>
          <View style={styles.menuIconBox}>
            <FileText color="#4f46e5" size={22} />
          </View>
          <Text style={styles.menuText}>Đơn từ của tôi</Text>
          <ChevronRight color="#cbd5e1" size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setModalVisible(true)}>
          <View style={styles.menuIconBox}>
            <Key color="#4f46e5" size={22} />
          </View>
          <Text style={styles.menuText}>Đổi mật khẩu</Text>
          <ChevronRight color="#cbd5e1" size={20} />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { marginTop: 20 }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color="#ef4444" size={20} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Đổi mật khẩu */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwords.currentPassword}
              onChangeText={t => setPasswords({...passwords, currentPassword: t})}
            />

            <Text style={styles.label}>Mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwords.newPassword}
              onChangeText={t => setPasswords({...passwords, newPassword: t})}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Xác nhận</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#e0e7ff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#4f46e5' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  email: { fontSize: 14, color: '#64748b', marginTop: 4 },
  roleBadge: {
    marginTop: 8, paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: '#f1f5f9', borderRadius: 20
  },
  roleText: { fontSize: 12, color: '#475569', fontWeight: 'bold' },

  section: { backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', marginTop: 10 },
  menuItem: { 
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc'
  },
  menuIconBox: { 
    width: 40, height: 40, borderRadius: 10, 
    backgroundColor: '#e0e7ff', 
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12
  },
  menuText: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '500' },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1e293b' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: 'bold' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#4f46e5', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold' },
});
