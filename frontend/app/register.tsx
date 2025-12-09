import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import api from '../src/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const Register = () => {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      await login(response.data.access_token, response.data.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Kayıt Hatası',
        error.response?.data?.detail || 'Kayıt oluşturulamadı.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Kayıt Ol</Text>
            <Text style={styles.subtitle}>Hızlıca başlayın</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Ad Soyad *"
              placeholder="John Doe"
              value={formData.full_name}
              onChangeText={(text) =>
                setFormData({ ...formData, full_name: text })
              }
            />

            <Input
              label="E-posta *"
              placeholder="ornek@email.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Şifre *"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry
            />

            <Input
              label="Şirket"
              placeholder="Şirket Adı"
              value={formData.company}
              onChangeText={(text) =>
                setFormData({ ...formData, company: text })
              }
            />

            <Input
              label="Telefon"
              placeholder="05XX XXX XX XX"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <Button
              title="Kayıt Ol"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Zaten hesabınız var mı?{' '}
                <Text style={styles.link}>Giriş Yap</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 8,
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: '#1a73e8',
    fontWeight: '600',
  },
});

export default Register;