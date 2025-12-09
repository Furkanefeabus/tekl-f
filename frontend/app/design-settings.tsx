import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from '../src/components/Toast';
import { useToast } from '../src/hooks/useToast';
import api from '../src/services/api';

const TEMPLATES = [
  { id: 'modern', name: 'Modern', colors: { primary: '#1a73e8', secondary: '#34a853', accent: '#fbbc04' } },
  { id: 'classic', name: 'Klasik', colors: { primary: '#2c3e50', secondary: '#27ae60', accent: '#e74c3c' } },
  { id: 'minimalist', name: 'Minimalist', colors: { primary: '#000000', secondary: '#666666', accent: '#cccccc' } },
];

const DesignSettingsScreen = () => {
  const router = useRouter();
  const [settings, setSettings] = useState<any>({
    primary_color: '#1a73e8',
    secondary_color: '#34a853',
    accent_color: '#fbbc04',
    header_bg_color: '#1a73e8',
    table_header_bg: '#1a73e8',
    table_row_bg: '#f5f5f5',
    price_color: '#34a853',
    text_color: '#333333',
    background_color: '#ffffff',
    font_family: 'Helvetica',
    title_font_size: 24,
    header_font_size: 14,
    body_font_size: 10,
    page_margin: 30,
    logo_size: 100,
    logo_position: 'left',
    show_logo: true,
    show_header: true,
    border_width: 1,
    border_color: '#e0e0e0',
    cell_padding: 10,
    document_title: 'PROFORMA FATURA',
    quotation_label: 'Teklif No',
    date_label: 'Tarih',
    customer_info_label: 'Musteri Bilgileri',
    product_details_label: 'Urun/Hizmet Detaylari',
    total_label: 'GENEL TOPLAM',
    notes_label: 'Notlar',
    template: 'modern',
  });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'colors' | 'fonts' | 'layout' | 'labels'>('colors');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.design_settings) {
        setSettings({ ...settings, ...response.data.design_settings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const { toast, showToast, hideToast } = useToast();
  
  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/auth/settings', {
        design_settings: settings,
      });
      showToast('✅ Tasarım Kaydedildi!', 'success');
    } catch (error) {
      Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: any) => {
    setSettings({
      ...settings,
      template: template.id,
      primary_color: template.colors.primary,
      secondary_color: template.colors.secondary,
      accent_color: template.colors.accent,
      header_bg_color: template.colors.primary,
      table_header_bg: template.colors.primary,
      price_color: template.colors.secondary,
    });
  };

  const renderColorSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Şablonlar</Text>
      <View style={styles.templateContainer}>
        {TEMPLATES.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateCard,
              settings.template === template.id && styles.templateCardActive,
            ]}
            onPress={() => applyTemplate(template)}
          >
            <View style={styles.templateColors}>
              <View style={[styles.templateColorBox, { backgroundColor: template.colors.primary }]} />
              <View style={[styles.templateColorBox, { backgroundColor: template.colors.secondary }]} />
              <View style={[styles.templateColorBox, { backgroundColor: template.colors.accent }]} />
            </View>
            <Text style={styles.templateName}>{template.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Renkler</Text>
      <View style={styles.colorGrid}>
        <View style={styles.colorItem}>
          <Text style={styles.colorLabel}>Ana Renk</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorPreview, { backgroundColor: settings.primary_color }]} />
            <TextInput
              style={styles.colorInput}
              value={settings.primary_color}
              onChangeText={(value) => setSettings({ ...settings, primary_color: value })}
              placeholder="#1a73e8"
            />
          </View>
        </View>

        <View style={styles.colorItem}>
          <Text style={styles.colorLabel}>İkincil Renk</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorPreview, { backgroundColor: settings.secondary_color }]} />
            <TextInput
              style={styles.colorInput}
              value={settings.secondary_color}
              onChangeText={(value) => setSettings({ ...settings, secondary_color: value })}
              placeholder="#34a853"
            />
          </View>
        </View>

        <View style={styles.colorItem}>
          <Text style={styles.colorLabel}>Vurgu Rengi</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorPreview, { backgroundColor: settings.accent_color }]} />
            <TextInput
              style={styles.colorInput}
              value={settings.accent_color}
              onChangeText={(value) => setSettings({ ...settings, accent_color: value })}
              placeholder="#fbbc04"
            />
          </View>
        </View>

        <View style={styles.colorItem}>
          <Text style={styles.colorLabel}>Fiyat Rengi</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorPreview, { backgroundColor: settings.price_color }]} />
            <TextInput
              style={styles.colorInput}
              value={settings.price_color}
              onChangeText={(value) => setSettings({ ...settings, price_color: value })}
              placeholder="#34a853"
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderFontSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Font Boyutları</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Başlık Font Boyutu: {settings.title_font_size}pt</Text>
        <TextInput
          style={styles.input}
          value={String(settings.title_font_size)}
          onChangeText={(value) => setSettings({ ...settings, title_font_size: parseInt(value) || 24 })}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Başlık Font Boyutu: {settings.header_font_size}pt</Text>
        <TextInput
          style={styles.input}
          value={String(settings.header_font_size)}
          onChangeText={(value) => setSettings({ ...settings, header_font_size: parseInt(value) || 14 })}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Metin Font Boyutu: {settings.body_font_size}pt</Text>
        <TextInput
          style={styles.input}
          value={String(settings.body_font_size)}
          onChangeText={(value) => setSettings({ ...settings, body_font_size: parseInt(value) || 10 })}
          keyboardType="number-pad"
        />
      </View>
    </View>
  );

  const renderLayoutSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sayfa Düzeni</Text>
      
      <View style={styles.switchRow}>
        <Text style={styles.inputLabel}>Logo Göster</Text>
        <Switch
          value={settings.show_logo}
          onValueChange={(value) => setSettings({ ...settings, show_logo: value })}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.inputLabel}>Başlık Göster</Text>
        <Switch
          value={settings.show_header}
          onValueChange={(value) => setSettings({ ...settings, show_header: value })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sayfa Kenar Boşluğu: {settings.page_margin}px</Text>
        <TextInput
          style={styles.input}
          value={String(settings.page_margin)}
          onChangeText={(value) => setSettings({ ...settings, page_margin: parseInt(value) || 30 })}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Logo Boyutu: {settings.logo_size}px</Text>
        <TextInput
          style={styles.input}
          value={String(settings.logo_size)}
          onChangeText={(value) => setSettings({ ...settings, logo_size: parseInt(value) || 100 })}
          keyboardType="number-pad"
        />
      </View>

      <Text style={styles.inputLabel}>Logo Konumu</Text>
      <View style={styles.buttonGroup}>
        {['left', 'center', 'right'].map((pos) => (
          <TouchableOpacity
            key={pos}
            style={[
              styles.optionButton,
              settings.logo_position === pos && styles.optionButtonActive,
            ]}
            onPress={() => setSettings({ ...settings, logo_position: pos })}
          >
            <Text
              style={[
                styles.optionButtonText,
                settings.logo_position === pos && styles.optionButtonTextActive,
              ]}
            >
              {pos === 'left' ? 'Sol' : pos === 'center' ? 'Orta' : 'Sağ'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLabelsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Etiketler</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Belge Başlığı</Text>
        <TextInput
          style={styles.input}
          value={settings.document_title}
          onChangeText={(value) => setSettings({ ...settings, document_title: value })}
          placeholder="PROFORMA FATURA"
          autoCorrect={false}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Teklif No Etiketi</Text>
        <TextInput
          style={styles.input}
          value={settings.quotation_label}
          onChangeText={(value) => setSettings({ ...settings, quotation_label: value })}
          placeholder="Teklif No"
          autoCorrect={false}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tarih Etiketi</Text>
        <TextInput
          style={styles.input}
          value={settings.date_label}
          onChangeText={(value) => setSettings({ ...settings, date_label: value })}
          placeholder="Tarih"
          autoCorrect={false}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Müşteri Bilgileri</Text>
        <TextInput
          style={styles.input}
          value={settings.customer_info_label}
          onChangeText={(value) => setSettings({ ...settings, customer_info_label: value })}
          placeholder="Musteri Bilgileri"
          autoCorrect={false}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ürün Detayları</Text>
        <TextInput
          style={styles.input}
          value={settings.product_details_label}
          onChangeText={(value) => setSettings({ ...settings, product_details_label: value })}
          placeholder="Urun/Hizmet Detaylari"
          autoCorrect={false}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Toplam Etiketi</Text>
        <TextInput
          style={styles.input}
          value={settings.total_label}
          onChangeText={(value) => setSettings({ ...settings, total_label: value })}
          placeholder="GENEL TOPLAM"
          autoCorrect={false}
          autoCapitalize="characters"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Toast {...toast} onHide={hideToast} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasarım Ayarları</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Ionicons name="checkmark" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Section Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeSection === 'colors' && styles.tabButtonActive]}
          onPress={() => setActiveSection('colors')}
        >
          <Ionicons name="color-palette" size={20} color={activeSection === 'colors' ? '#1a73e8' : '#666'} />
          <Text style={[styles.tabButtonText, activeSection === 'colors' && styles.tabButtonTextActive]}>
            Renkler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeSection === 'fonts' && styles.tabButtonActive]}
          onPress={() => setActiveSection('fonts')}
        >
          <Ionicons name="text" size={20} color={activeSection === 'fonts' ? '#1a73e8' : '#666'} />
          <Text style={[styles.tabButtonText, activeSection === 'fonts' && styles.tabButtonTextActive]}>
            Fontlar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeSection === 'layout' && styles.tabButtonActive]}
          onPress={() => setActiveSection('layout')}
        >
          <Ionicons name="grid" size={20} color={activeSection === 'layout' ? '#1a73e8' : '#666'} />
          <Text style={[styles.tabButtonText, activeSection === 'layout' && styles.tabButtonTextActive]}>
            Düzen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeSection === 'labels' && styles.tabButtonActive]}
          onPress={() => setActiveSection('labels')}
        >
          <Ionicons name="pricetag" size={20} color={activeSection === 'labels' ? '#1a73e8' : '#666'} />
          <Text style={[styles.tabButtonText, activeSection === 'labels' && styles.tabButtonTextActive]}>
            Etiketler
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeSection === 'colors' && renderColorSection()}
        {activeSection === 'fonts' && renderFontSection()}
        {activeSection === 'layout' && renderLayoutSection()}
        {activeSection === 'labels' && renderLabelsSection()}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1a73e8',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tabButtonTextActive: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  templateContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  templateCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardActive: {
    borderColor: '#1a73e8',
  },
  templateColors: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  templateColorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  colorGrid: {
    gap: 16,
  },
  colorItem: {
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
    gap: 12,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
});

export default DesignSettingsScreen;