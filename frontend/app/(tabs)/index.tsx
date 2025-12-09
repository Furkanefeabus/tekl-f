import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

const Dashboard = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/statistics');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadStats} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hoş geldiniz,</Text>
          <Text style={styles.userName}>{user?.full_name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İstatistikler</Text>

          <View style={styles.statsGrid}>
            <StatCard
              title="Ürünler"
              value={stats?.products_count || 0}
              icon="cube"
              color="#1a73e8"
              onPress={() => router.push('/(tabs)/products')}
            />
            <StatCard
              title="Müşteriler"
              value={stats?.customers_count || 0}
              icon="people"
              color="#34a853"
              onPress={() => router.push('/(tabs)/customers')}
            />
            <StatCard
              title="Teklifler"
              value={stats?.quotations_count || 0}
              icon="document-text"
              color="#fbbc04"
              onPress={() => router.push('/(tabs)/quotations')}
            />
            <StatCard
              title="Kazanılan"
              value={`₺${(stats?.accepted_value || 0).toFixed(0)}`}
              icon="trophy"
              color="#ea4335"
              onPress={() => {}}
            />
          </View>
        </View>

        {stats?.quotations_by_status && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teklif Durumları</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: '#ffeaa7' },
                  ]}
                >
                  <Text style={styles.statusValue}>
                    {stats.quotations_by_status.draft}
                  </Text>
                </View>
                <Text style={styles.statusLabel}>Taslak</Text>
              </View>
              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: '#74b9ff' },
                  ]}
                >
                  <Text style={styles.statusValue}>
                    {stats.quotations_by_status.sent}
                  </Text>
                </View>
                <Text style={styles.statusLabel}>Gönderildi</Text>
              </View>
              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: '#55efc4' },
                  ]}
                >
                  <Text style={styles.statusValue}>
                    {stats.quotations_by_status.accepted}
                  </Text>
                </View>
                <Text style={styles.statusLabel}>Kabul</Text>
              </View>
              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: '#ff7675' },
                  ]}
                >
                  <Text style={styles.statusValue}>
                    {stats.quotations_by_status.rejected}
                  </Text>
                </View>
                <Text style={styles.statusLabel}>Red</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-quotation')}
          >
            <Ionicons name="add-circle" size={24} color="#1a73e8" />
            <Text style={styles.actionButtonText}>Yeni Teklif Oluştur</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-product')}
          >
            <Ionicons name="cube" size={24} color="#34a853" />
            <Text style={styles.actionButtonText}>Yeni Ürün Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-customer')}
          >
            <Ionicons name="person-add" size={24} color="#fbbc04" />
            <Text style={styles.actionButtonText}>Yeni Müşteri Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/catalog')}
          >
            <Ionicons name="bookmarks" size={24} color="#9c27b0" />
            <Text style={styles.actionButtonText}>Katalog Oluştur</Text>
          </TouchableOpacity>
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
  header: {
    padding: 24,
    backgroundColor: '#1a73e8',
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
});

export default Dashboard;