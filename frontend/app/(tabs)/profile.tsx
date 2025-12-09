import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';

const Profile = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Kullanıcı yoksa yönlendir
  React.useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user]);

  // Yükleme durumu
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const InfoRow = ({ icon, label, value }: any) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color="#1a73e8" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Belirtilmemiş'}</Text>
      </View>
    </View>
  );

  const MenuButton = ({ icon, title, onPress, color = '#333' }: any) => (
    <TouchableOpacity
      style={styles.menuButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.menuText, { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {user?.subscription_plan.toUpperCase()} PLAN
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
          <View style={styles.card}>
            <InfoRow icon="person-outline" label="Ad Soyad" value={user?.full_name} />
            <InfoRow icon="mail-outline" label="E-posta" value={user?.email} />
            <InfoRow icon="business-outline" label="Şirket" value={user?.company} />
            <InfoRow icon="call-outline" label="Telefon" value={user?.phone} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          <View style={styles.card}>
            <MenuButton
              icon="settings-outline"
              title="Firma ve Tasarım Ayarları"
              onPress={() => router.push('/settings')}
            />
            <MenuButton
              icon="card-outline"
              title="Abonelik Yönetimi"
              onPress={() => Alert.alert('Yakında', 'Bu özellik çok yakında!')}
            />
            <MenuButton
              icon="notifications-outline"
              title="Bildirimler"
              onPress={() => Alert.alert('Yakında', 'Bu özellik çok yakında!')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diğer</Text>
          <View style={styles.card}>
            <MenuButton
              icon="help-circle-outline"
              title="Yardım & Destek"
              onPress={() => Alert.alert('Destek', 'Bize destek@proquote.com adresinden ulaşabilirsiniz.')}
            />
            <MenuButton
              icon="information-circle-outline"
              title="Hakkımızda"
              onPress={() => Alert.alert('ProQuote', 'Versiyon 1.0.0')}
            />
            <MenuButton
              icon="log-out-outline"
              title="Çıkış Yap"
              onPress={handleLogout}
              color="#ea4335"
            />
          </View>
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
    backgroundColor: '#1a73e8',
    paddingVertical: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#34a853',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});

export default Profile;