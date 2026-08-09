import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Settings, MapPin, Wifi, Calculator, Save } from 'lucide-react-native';
import api from '../services/api';

export default function AdminSettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    wifiIp: '',
    otMultiplier: '1.5',
    minHoursForValidShift: '4',
    baseWorkingDays: '26',
    shifts: []
  });

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data) {
        setSettings({
          maxDistance: res.data.maxDistance ? res.data.maxDistance.toString() : '500',
          otMultiplier: res.data.otMultiplier ? res.data.otMultiplier.toString() : '1.5',
          minHoursForValidShift: res.data.minHoursForValidShift ? res.data.minHoursForValidShift.toString() : '0',
          baseWorkingDays: res.data.baseWorkingDays ? res.data.baseWorkingDays.toString() : '26',
          wifiIp: res.data.wifiIp || ''
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...settings,
        maxDistance: parseInt(settings.maxDistance) || 500,
        otMultiplier: parseFloat(settings.otMultiplier) || 1.5,
        minHoursForValidShift: parseFloat(settings.minHoursForValidShift) || 0,
        baseWorkingDays: parseInt(settings.baseWorkingDays) || 26
      };
      await api.post('/settings', payload);
      Alert.alert('Thành công', 'Đã lưu cấu hình hệ thống');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Quay lại'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cài đặt Hệ thống</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color="#4f46e5" />
              <Text style={styles.sectionTitle}>Chấm công GPS</Text>
            </View>
            <Text style={styles.label}>Khoảng cách cho phép (mét)</Text>
            <TextInput
              style={styles.input}
              value={settings.maxDistance}
              onChangeText={(text) => setSettings({ ...settings, maxDistance: text })}
              keyboardType="numeric"
              placeholder="VD: 500"
            />
            <Text style={styles.hint}>Nhân viên chỉ có thể chấm công nếu đứng trong bán kính này so với tọa độ công ty (Cài tọa độ trên Web).</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Wifi size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Chấm công WiFi</Text>
            </View>
            <Text style={styles.label}>Địa chỉ IP WiFi Công ty</Text>
            <TextInput
              style={styles.input}
              value={settings.wifiIp}
              onChangeText={(text) => setSettings({ ...settings, wifiIp: text })}
              placeholder="VD: 192.168.1.1"
            />
            <Text style={styles.hint}>Nếu nhập, nhân viên bắt buộc phải kết nối đúng WiFi này mới được chấm công. Để trống để tắt.</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calculator size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Cấu hình Lương</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Hệ số Tăng ca</Text>
                <TextInput
                  style={styles.input}
                  value={settings.otMultiplier}
                  onChangeText={(text) => setSettings({ ...settings, otMultiplier: text })}
                  keyboardType="numeric"
                  placeholder="VD: 1.5"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Tối thiểu tính ca (Giờ)</Text>
                <TextInput
                  style={styles.input}
                  value={settings.minHoursForValidShift}
                  onChangeText={(text) => setSettings({ ...settings, minHoursForValidShift: text })}
                  keyboardType="numeric"
                  placeholder="VD: 4"
                />
              </View>
            </View>
            <Text style={styles.hint}>Làm dưới thời gian này, khi check-out sẽ không được tính lương ca đó.</Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Lưu Cài Đặt</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
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
  
  scrollContent: { padding: 16 },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 16, backgroundColor: '#f8fafc' },
  hint: { fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
  
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  
  saveBtn: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
