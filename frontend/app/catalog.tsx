import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const Catalog = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/catalog/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      Alert.alert('Hata', 'Kategoriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCatalog = async (category?: string, customerVersion = false) => {
    setPdfLoading(true);
    try {
      const endpoint = customerVersion ? '/catalog/customer-pdf' : '/catalog/pdf';
      const url = category ? `${endpoint}?category=${encodeURIComponent(category)}` : endpoint;
      const response = await api.get(url);
      const { pdf_base64, filename } = response.data;

      if (Platform.OS === 'web') {
        // Web için download
        try {
          const binaryString = atob(pdf_base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);
          
          Alert.alert('Başarılı', 'Katalog PDF indirildi!');
        } catch (webError) {
          console.error('Web indirme hatası:', webError);
          throw webError;
        }
      } else {
        // Mobile için file system
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, pdf_base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Katalog Paylaş',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Başarılı', `Katalog kaydedildi: ${filename}`);
        }
      }
    } catch (error: any) {
      console.error('Katalog oluşturma hatası:', error);
      Alert.alert('Hata', 'Katalog oluşturulamadı.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PDF Katalog Oluştur</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Müşteri Kataloğu (Resimli)</Text>
          <Text style={styles.sectionDescription}>
            Müşterilerinize göndermek için resimli ve fiyatlı görsel katalog.
          </Text>
          <TouchableOpacity
            style={[styles.mainButton, styles.customerButton]}
            onPress={() => handleGenerateCatalog(undefined, true)}
            disabled={pdfLoading}
          >
            <Ionicons name="images" size={32} color="#fff" />
            <Text style={styles.mainButtonText}>
              {pdfLoading ? 'Oluşturuluyor...' : 'Müşteri Kataloğu'}
            </Text>
            <Text style={styles.mainButtonSubtext}>
              Resimler + Fiyatlar + Açıklamalar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stok Kataloğu (Tablolu)</Text>
          <Text style={styles.sectionDescription}>
            Kendi kullanımınız için detaylı tablo formatında katalog.
          </Text>
          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => handleGenerateCatalog()}
            disabled={pdfLoading}
          >
            <Ionicons name="document-text" size={32} color="#fff" />
            <Text style={styles.mainButtonText}>
              {pdfLoading ? 'Oluşturuluyor...' : 'Stok Kataloğu'}
            </Text>
            <Text style={styles.mainButtonSubtext}>
              Kategorilere göre tablo formatı
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriye Göre</Text>
          <Text style={styles.sectionDescription}>
            Belirli bir kategorideki ürünler için katalog oluşturun.
          </Text>
          
          {loading ? (
            <Text style={styles.loadingText}>Kategoriler yükleniyor...</Text>
          ) : categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>
                Henüz kategori yok.{'\n'}
                Ürün eklerken kategori belirtin.
              </Text>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.categoryCard}
                  onPress={() => handleGenerateCatalog(category)}
                  disabled={pdfLoading}
                >
                  <Ionicons name="folder" size={24} color="#1a73e8" />
                  <Text style={styles.categoryName}>{category}</Text>
                  <Ionicons name="download-outline" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#1a73e8" />
          <Text style={styles.infoText}>
            Katalog PDF'ler otomatik olarak kategorilere göre gruplandırılır ve
            her ürünün resmi, açıklaması, fiyatı ve stok bilgisi gösterilir.
          </Text>
        </View>
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
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  mainButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  mainButtonSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  customerButton: {
    backgroundColor: '#9c27b0',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginVertical: 8,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1a73e8',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565c0',
    marginLeft: 12,
    lineHeight: 18,
  },
});

export default Catalog;
