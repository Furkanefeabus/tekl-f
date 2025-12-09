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

const Login = () => {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      await login(response.data.access_token, response.data.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Giriş Hatası',
        error.response?.data?.detail || 'Giriş yapılamadı.'
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
            <Text style={styles.title}>ProQuote</Text>
            <Text style={styles.subtitle}>Profesyonel Teklif Yönetimi</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="E-posta"
              placeholder="ornek@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Şifre"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title="Giriş Yap"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity
              onPress={() => router.push('/register')}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Hesabınız yok mu?{' '}
                <Text style={styles.link}>Kayıt Ol</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
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

export default Login;