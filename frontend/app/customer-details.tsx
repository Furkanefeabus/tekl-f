import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';

const CustomerDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    try {
      const response = await api.get(`/customers/${id}`);
      setCustomer(response.data);
    } catch (error) {
      console.error('Failed to load customer:', error);
      Alert.alert('Hata', 'Müşteri yüklenemedi.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
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
              await api.delete(`/customers/${id}`);
              Alert.alert('Başarılı', 'Müşteri silindi.', [
                { text: 'Tamam', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Hata', 'Müşteri silinemedi.');
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleEmail = () => {
    if (customer.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (customer.phone) {
      const phone = customer.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=+90${phone}`);
    }
  };

  if (loading || !customer) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Müşteri Detayı</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{customer.name}</Text>
          {customer.company && (
            <Text style={styles.company}>{customer.company}</Text>
          )}
        </View>

        {/* Contact Actions */}
        <View style={styles.actionsCard}>
          {customer.phone && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={24} color="#34a853" />
              <Text style={styles.actionButtonText}>Ara</Text>
            </TouchableOpacity>
          )}
          {customer.email && (
            <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
              <Ionicons name="mail" size={24} color="#ea4335" />
              <Text style={styles.actionButtonText}>E-posta</Text>
            </TouchableOpacity>
          )}
          {customer.phone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.actionButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>İletişim Bilgileri</Text>
          {customer.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{customer.phone}</Text>
            </View>
          )}
          {customer.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{customer.email}</Text>
            </View>
          )}
          {customer.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{customer.address}</Text>
            </View>
          )}
        </View>

        {/* Tax Info */}
        {(customer.tax_number || customer.tax_office) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Vergi Bilgileri</Text>
            {customer.tax_number && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Vergi No:</Text>
                <Text style={styles.value}>{customer.tax_number}</Text>
              </View>
            )}
            {customer.tax_office && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Vergi Dairesi:</Text>
                <Text style={styles.value}>{customer.tax_office}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34a853',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#34a853',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#34a853',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#34a853',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  company: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  actionsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
});

export default CustomerDetails;