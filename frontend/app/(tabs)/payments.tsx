import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const PaymentsScreen = () => {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [paidPayments, setPaidPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  // Sayfa her göründüğünde verileri yenile
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [statsRes, pendingRes, paidRes] = await Promise.all([
        api.get('/payments/statistics'),
        api.get('/payments/pending'),
        api.get('/payments/paid'),
      ]);

      setStats(statsRes.data);
      setPendingPayments(pendingRes.data);
      setPaidPayments(paidRes.data);
    } catch (error) {
      console.error('Failed to load payment data:', error);
      Alert.alert('Hata', 'Ödeme verileri yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleQuotationPress = (quotationId: string) => {
    router.push(`/quotation-details?id=${quotationId}`);
  };

  const handleSendReminder = async (quotation: any) => {
    Alert.alert(
      'Hatırlatma Gönder',
      `${quotation.customer_name} için ödeme hatırlatması göndermek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: async () => {
            try {
              await api.post('/reminders', {
                quotation_id: quotation.id,
                reminder_type: 'email',
                message: `Sayın ${quotation.customer_name}, ${quotation.quotation_number} numaralı teklifinizin ödemesi beklenmektedir. Toplam tutar: ₺${quotation.total.toFixed(2)}`,
              });
              Alert.alert('Başarılı', 'Hatırlatma oluşturuldu!');
            } catch (error) {
              Alert.alert('Hata', 'Hatırlatma oluşturulamadı.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="trending-up" size={32} color="#fff" />
            <Text style={styles.statValue}>₺{stats?.total_expected.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Toplam Beklenen</Text>
          </View>

          <View style={[styles.statCard, styles.statCardSuccess]}>
            <Ionicons name="checkmark-circle" size={32} color="#fff" />
            <Text style={styles.statValue}>₺{stats?.total_paid.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Tahsil Edilen</Text>
          </View>

          <View style={[styles.statCard, styles.statCardWarning]}>
            <Ionicons name="time" size={32} color="#fff" />
            <Text style={styles.statValue}>₺{stats?.total_pending.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Bekleyen</Text>
          </View>
        </View>

        {/* Collection Rate */}
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Tahsilat Oranı</Text>
          <View style={styles.rateBarContainer}>
            <View
              style={[
                styles.rateBar,
                { width: `${stats?.collection_rate || 0}%` },
              ]}
            />
          </View>
          <Text style={styles.rateText}>{stats?.collection_rate.toFixed(1)}%</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'pending' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('pending')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'pending' && styles.tabTextActive,
              ]}
            >
              Bekleyen ({stats?.pending_count})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'paid' && styles.tabActive,
            ]}
            onPress={() => setActiveTab('paid')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'paid' && styles.tabTextActive,
              ]}
            >
              Ödendi ({stats?.paid_count})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment List */}
        <View style={styles.listContainer}>
          {activeTab === 'pending' ? (
            pendingPayments.length > 0 ? (
              pendingPayments.map((quotation) => (
                <TouchableOpacity
                  key={quotation.id}
                  style={styles.paymentCard}
                  onPress={() => handleQuotationPress(quotation.id)}
                >
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentNumber}>
                      {quotation.quotation_number}
                    </Text>
                    <Text style={styles.paymentAmount}>
                      ₺{quotation.total.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.customerName}>
                    {quotation.customer_name}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {format(new Date(quotation.created_at), 'dd MMM yyyy', {
                      locale: tr,
                    })}
                  </Text>
                  <TouchableOpacity
                    style={styles.reminderButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSendReminder(quotation);
                    }}
                  >
                    <Ionicons name="notifications-outline" size={16} color="#1a73e8" />
                    <Text style={styles.reminderButtonText}>Hatırlatma Gönder</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  Bekleyen ödeme bulunmuyor
                </Text>
              </View>
            )
          ) : paidPayments.length > 0 ? (
            paidPayments.map((quotation) => (
              <TouchableOpacity
                key={quotation.id}
                style={styles.paymentCard}
                onPress={() => handleQuotationPress(quotation.id)}
              >
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentNumber}>
                    {quotation.quotation_number}
                  </Text>
                  <Text style={[styles.paymentAmount, styles.paidAmount]}>
                    ₺{quotation.payment_amount?.toFixed(2) || quotation.total.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.customerName}>
                  {quotation.customer_name}
                </Text>
                {quotation.payment_date && (
                  <View style={styles.paidInfo}>
                    <Ionicons name="checkmark-circle" size={16} color="#34a853" />
                    <Text style={styles.paidDate}>
                      {format(new Date(quotation.payment_date), 'dd MMM yyyy', {
                        locale: tr,
                      })} tarihinde ödendi
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Henüz ödeme alınmamış</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  statCardPrimary: {
    backgroundColor: '#1a73e8',
  },
  statCardSuccess: {
    backgroundColor: '#34a853',
  },
  statCardWarning: {
    backgroundColor: '#fbbc04',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  rateCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  rateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  rateBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  rateBar: {
    height: '100%',
    backgroundColor: '#34a853',
    borderRadius: 4,
  },
  rateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34a853',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#1a73e8',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbbc04',
  },
  paidAmount: {
    color: '#34a853',
  },
  customerName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reminderButtonText: {
    fontSize: 14,
    color: '#1a73e8',
    marginLeft: 6,
    fontWeight: '500',
  },
  paidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  paidDate: {
    fontSize: 14,
    color: '#34a853',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default PaymentsScreen;