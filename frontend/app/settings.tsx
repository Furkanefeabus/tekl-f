import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import Button from '../src/components/Button';
import Toast from '../src/components/Toast';
import { useToast } from '../src/hooks/useToast';
import { pickImage } from '../src/utils/imageUtils';

const Settings = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'company' | 'design'>('company');
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  // Firma Ayarları
  const [companySettings, setCompanySettings] = useState({
    full_name: user?.full_name || '',
    company: user?.company || '',
    phone: user?.phone || '',
    company_logo: '',
    company_address: '',
    company_tax_number: '',
    company_tax_office: '',
    default_tax_rate: 20,
  });

  // Tasarım Ayarları
  const [designSettings, setDesignSettings] = useState({
    primary_color: '#1a73e8',
    secondary_color: '#34a853',
    header_bg_color: '#1a73e8',
    table_header_bg: '#1a73e8',
    table_row_bg: '#f5f5f5',
    price_color: '#34a853',
    text_color: '#333333',
    background_image: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data;

      setCompanySettings({
        full_name: userData.full_name || '',
        company: userData.company || '',
        phone: userData.phone || '',
        company_logo: userData.company_logo || '',
        company_address: userData.company_address || '',
        company_tax_number: userData.company_tax_number || '',
        company_tax_office: userData.company_tax_office || '',
        default_tax_rate: userData.default_tax_rate || 20,
      });

      if (userData.design_settings) {
        setDesignSettings({ ...designSettings, ...userData.design_settings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleLogoUpload = async () => {
    const image = await pickImage();
    if (image) {
      setCompanySettings({ ...companySettings, company_logo: image });
    }
  };

  const handleBackgroundUpload = async () => {
    const image = await pickImage();
    if (image) {
      setDesignSettings({ ...designSettings, background_image: image });
    }
  };

  const handleSaveCompany = async () => {
    setLoading(true);
    try {
      await api.put('/auth/settings', companySettings);
      showToast('✅ Ayarlar Kaydedildi!', 'success');
    } catch (error: any) {
      showToast('❌ Hata: Kaydedilemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = async () => {
    setLoading(true);
    try {
      await api.put('/auth/settings', { design_settings: designSettings });
      showToast('✅ Ayarlar Kaydedildi!', 'success');
    } catch (error: any) {
      showToast('❌ Hata: Kaydedilemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const ColorPicker = ({ label, value, onChange }: any) => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.colorLabel}>{label}</Text>
      <View style={styles.colorRow}>
        <View style={[styles.colorPreview, { backgroundColor: value }]} />
        <TextInput
          style={styles.colorInput}
          value={value}
          onChangeText={onChange}
          placeholder="#1a73e8"
          maxLength={7}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Toast {...toast} onHide={hideToast} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'company' && styles.tabActive]}
          onPress={() => setActiveTab('company')}
        >
          <Ionicons
            name="business"
            size={20}
            color={activeTab === 'company' ? '#1a73e8' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'company' && styles.tabTextActive,
            ]}
          >
            Firma Bilgileri
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'design' && styles.tabActive]}
          onPress={() => setActiveTab('design')}
        >
          <Ionicons
            name="color-palette"
            size={20}
            color={activeTab === 'design' ? '#1a73e8' : '#666'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'design' && styles.tabTextActive,
            ]}
          >
            Tasarım
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'company' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Firma Bilgileri</Text>

            {/* Logo */}
            <Text style={styles.label}>Firma Logosu</Text>
            <TouchableOpacity
              style={styles.logoContainer}
              onPress={handleLogoUpload}
            >
              {companySettings.company_logo ? (
                <Image
                  source={{ uri: companySettings.company_logo }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={40} color="#999" />
                  <Text style={styles.logoText}>Logo Yükle</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Form Fields */}
            <Text style={styles.label}>Firma Adı</Text>
            <TextInput
              style={styles.input}
              value={companySettings.company}
              onChangeText={(text) =>
                setCompanySettings({ ...companySettings, company: text })
              }
              placeholder="Firma adınız"
            />

            <Text style={styles.label}>Yetkili Adı Soyadı</Text>
            <TextInput
              style={styles.input}
              value={companySettings.full_name}
              onChangeText={(text) =>
                setCompanySettings({ ...companySettings, full_name: text })
              }
              placeholder="Ad Soyad"
            />

            <Text style={styles.label}>Telefon</Text>
            <TextInput
              style={styles.input}
              value={companySettings.phone}
              onChangeText={(text) =>
                setCompanySettings({ ...companySettings, phone: text })
              }
              placeholder="05XX XXX XX XX"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Adres</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={companySettings.company_address}
              onChangeText={(text) =>
                setCompanySettings({ ...companySettings, company_address: text })
              }
              placeholder="Firma adresi"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Vergi Numarası</Text>
            <TextInput
              style={styles.input}
              value={companySettings.company_tax_number}
              onChangeText={(text) =>
                setCompanySettings({ ...companySettings, company_tax_number: text })
              }
              placeholder="Vergi numarası"
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Vergi Dairesi</Text>
            <TextInput
              style={styles.input}
              value={companySettings.company_tax_office}
              onChangeText={(text) =>
                setCompanySettings({ ...companySettings, company_tax_office: text })
              }
              placeholder="Vergi dairesi"
            />

            <Text style={styles.label}>Varsayılan KDV Oranı</Text>
            <View style={styles.taxRateContainer}>
              {[1, 5, 10, 20].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[
                    styles.taxRateButton,
                    companySettings.default_tax_rate === rate && styles.taxRateButtonActive,
                  ]}
                  onPress={() => setCompanySettings({ ...companySettings, default_tax_rate: rate })}
                >
                  <Text
                    style={[
                      styles.taxRateText,
                      companySettings.default_tax_rate === rate && styles.taxRateTextActive,
                    ]}
                  >
                    %{rate}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Kaydet"
              onPress={handleSaveCompany}
              loading={loading}
              style={styles.saveButton}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PDF Tasarım Ayarları</Text>
            <Text style={styles.sectionDescription}>
              Teklif ve katalog PDF'lerinizin görünümünü özelleştirin
            </Text>

            {/* Advanced Design Editor Button */}
            <TouchableOpacity
              style={styles.advancedButton}
              onPress={() => router.push('/design-settings')}
            >
              <Ionicons name="color-wand" size={24} color="#1a73e8" />
              <View style={styles.advancedButtonContent}>
                <Text style={styles.advancedButtonTitle}>Gelişmiş Tasarım Editörü</Text>
                <Text style={styles.advancedButtonSubtitle}>
                  Detaylı özelleştirme, şablonlar ve canlı önizleme
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>

            {/* Background */}
            <Text style={styles.label}>Arka Plan Resmi</Text>
            <TouchableOpacity
              style={styles.bgContainer}
              onPress={handleBackgroundUpload}
            >
              {designSettings.background_image ? (
                <Image
                  source={{ uri: designSettings.background_image }}
                  style={styles.bgImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.bgPlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                  <Text style={styles.bgText}>Arka Plan Yükle</Text>
                  <Text style={styles.bgSubtext}>(Opsiyonel)</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Color Pickers */}
            <Text style={styles.subsectionTitle}>Renkler</Text>

            <ColorPicker
              label="Ana Renk (Başlıklar)"
              value={designSettings.primary_color}
              onChange={(text: string) =>
                setDesignSettings({ ...designSettings, primary_color: text })
              }
            />

            <ColorPicker
              label="İkincil Renk"
              value={designSettings.secondary_color}
              onChange={(text: string) =>
                setDesignSettings({ ...designSettings, secondary_color: text })
              }
            />

            <ColorPicker
              label="Tablo Başlık Arka Planı"
              value={designSettings.table_header_bg}
              onChange={(text: string) =>
                setDesignSettings({ ...designSettings, table_header_bg: text })
              }
            />

            <ColorPicker
              label="Tablo Satır Arka Planı"
              value={designSettings.table_row_bg}
              onChange={(text: string) =>
                setDesignSettings({ ...designSettings, table_row_bg: text })
              }
            />

            <ColorPicker
              label="Fiyat Rengi"
              value={designSettings.price_color}
              onChange={(text: string) =>
                setDesignSettings({ ...designSettings, price_color: text })
              }
            />

            <ColorPicker
              label="Metin Rengi"
              value={designSettings.text_color}
              onChange={(text: string) =>
                setDesignSettings({ ...designSettings, text_color: text })
              }
            />

            <View style={styles.previewBox}>
              <Ionicons name="information-circle" size={20} color="#1a73e8" />
              <Text style={styles.previewText}>
                Değişiklikler sonraki PDF oluşturmalarında aktif olacak
              </Text>
            </View>

            <Button
              title="Tasarımı Kaydet"
              onPress={handleSaveDesign}
              loading={loading}
              style={styles.saveButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a73e8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1a73e8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1a73e8',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  bgContainer: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  bgPlaceholder: {
    alignItems: 'center',
  },
  bgText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  bgSubtext: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
  colorPickerContainer: {
    marginBottom: 16,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
  },
  colorInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  previewBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    color: '#1565c0',
    marginLeft: 12,
  },
  saveButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  taxRateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  taxRateButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taxRateButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1a73e8',
  },
  taxRateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  taxRateTextActive: {
    color: '#1a73e8',
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#1a73e8',
  },
  advancedButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  advancedButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a73e8',
    marginBottom: 4,
  },
  advancedButtonSubtitle: {
    fontSize: 12,
    color: '#666',
  },
});

export default Settings;
