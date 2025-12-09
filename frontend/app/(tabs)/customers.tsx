import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';

interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const Customers = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      Alert.alert('Hata', 'Müşteriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDelete = (customer: Customer) => {
    Alert.alert(
      'Müşteriyi Sil',
      `${customer.name} müşterisini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/customers/${customer.id}`);
              loadCustomers();
              Alert.alert('Başarılı', 'Müşteri silindi.');
            } catch (error) {
              Alert.alert('Hata', 'Müşteri silinemedi.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/customer-details?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            {item.company && (
              <Text style={styles.company}>{item.company}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#ea4335" />
          </TouchableOpacity>
        </View>
        {item.phone && (
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color="#666" />
            <Text style={styles.contactText}>{item.phone}</Text>
          </View>
        )}
        {item.email && (
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color="#666" />
            <Text style={styles.contactText}>{item.email}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={customers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCustomers} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Henüz müşteri yok</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-customer')}
            >
              <Text style={styles.emptyButtonText}>Yeni Müşteri Ekle</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-customer')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  company: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34a853',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#34a853',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Customers;