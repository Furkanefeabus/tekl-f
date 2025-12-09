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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import Toast from '../src/components/Toast';
import { useToast } from '../src/hooks/useToast';
import api from '../src/services/api';

const AddCustomer = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    tax_office: '',
  });

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert('Hata', 'Lütfen müşteri adını girin.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/customers', {
        name: formData.name,
        company: formData.company || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        tax_number: formData.tax_number || undefined,
        tax_office: formData.tax_office || undefined,
      });
      
      // Başarı mesajı göster
      showToast('✅ Müşteri Eklendi!', 'success');
      setTimeout(() => router.back(), 2500);
    } catch (error: any) {
      Alert.alert(
        'Hata',
        error.response?.data?.detail || 'Müşteri eklenemedi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Toast {...toast} onHide={hideToast} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Müşteri Ekle</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <Input
            label="Yetkili Adı Soyadı *"
            placeholder="John Doe"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Input
            label="Şirket Adı"
            placeholder="Şirket adı"
            value={formData.company}
            onChangeText={(text) =>
              setFormData({ ...formData, company: text })
            }
          />

          <Input
            label="E-posta"
            placeholder="ornek@email.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Telefon"
            placeholder="05XX XXX XX XX"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />

          <Input
            label="Adres"
            placeholder="Tam adres"
            value={formData.address}
            onChangeText={(text) =>
              setFormData({ ...formData, address: text })
            }
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          <View style={styles.row}>
            <Input
              label="Vergi Numarası"
              placeholder="XXXXXXXXXX"
              value={formData.tax_number}
              onChangeText={(text) =>
                setFormData({ ...formData, tax_number: text })
              }
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
            />

            <Input
              label="Vergi Dairesi"
              placeholder="Vergi Dairesi"
              value={formData.tax_office}
              onChangeText={(text) =>
                setFormData({ ...formData, tax_office: text })
              }
              containerStyle={styles.halfInput}
            />
          </View>

          <Button
            title="Müşteriyi Ekle"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#34a853',
  },
  container: {
    flex: 1,
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
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  button: {
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: '#34a853',
  },
});

export default AddCustomer;
