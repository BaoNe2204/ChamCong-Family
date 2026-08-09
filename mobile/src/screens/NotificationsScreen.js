import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react-native';
import api from '../services/api';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
      // Mark all as read after fetching
      if (res.data.some(n => !n.isRead)) {
        await api.put('/notifications/read');
      }
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.isRead && styles.cardUnread]}>
      <View style={styles.iconBox}>
        <Bell size={20} color={!item.isRead ? "#4f46e5" : "#94a3b8"} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#1e293b" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#4f46e5" />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Bạn không có thông báo nào mới.</Text>
            </View>
          }
        />
      )}
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
  
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#64748b', marginTop: 12, fontSize: 15 },
  
  card: { 
    flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center'
  },
  cardUnread: { backgroundColor: '#e0e7ff', borderColor: '#c7d2fe' },
  
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 4 },
  titleUnread: { color: '#1e3a8a', fontWeight: 'bold' },
  message: { fontSize: 14, color: '#475569', marginBottom: 6 },
  date: { fontSize: 11, color: '#94a3b8' },

  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4f46e5', marginLeft: 8 }
});
