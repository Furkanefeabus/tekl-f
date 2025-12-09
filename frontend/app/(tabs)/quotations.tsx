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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Quotation {
  id: string;
  quotation_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

const Quotations = () => {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/quotations');
      setQuotations(response.data);
    } catch (error) {
      console.error('Failed to load quotations:', error);
      Alert.alert('Hata', 'Teklifler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadQuotations();
    }, [])
  );

  const handleDelete = (quotation: Quotation) => {
    Alert.alert(
      'Teklifi Sil',
      `${quotation.quotation_number} numaralı teklifi silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/quotations/${quotation.id}`);
              loadQuotations();
              Alert.alert('Başarılı', 'Teklif silindi.');
            } catch (error) {
              Alert.alert('Hata', 'Teklif silinemedi.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#ffeaa7';
      case 'sent':
        return '#74b9ff';
      case 'accepted':
        return '#55efc4';
      case 'rejected':
        return '#ff7675';
      default:
        return '#dfe6e9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Taslak';
      case 'sent':
        return 'Gönderildi';
      case 'accepted':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  const renderItem = ({ item }: { item: Quotation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/quotation-details?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.quotationNumber}>{item.quotation_number}</Text>
          <Text style={styles.customerName}>{item.customer_name}</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#ea4335" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Toplam</Text>
            <Text style={styles.total}>₺{item.total.toFixed(2)}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.date}>
          {format(new Date(item.created_at), 'dd MMMM yyyy', { locale: tr })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={quotations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadQuotations} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Henüz teklif yok</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-quotation')}
            >
              <Text style={styles.emptyButtonText}>Yeni Teklif Oluştur</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-quotation')}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  quotationNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardBody: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#999',
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34a853',
    marginTop: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fbbc04',
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
    backgroundColor: '#fbbc04',
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

export default Quotations;