import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  description?: string;
}

const Catalog = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      
      // Kategorileri çıkar
      const uniqueCategories = ['all', ...new Set(response.data.map((p: Product) => p.category).filter(Boolean))];
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('Hata', 'Ürünler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleGenerateCatalog = async () => {
    if (selectedProducts.size === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir ürün seçin.');
      return;
    }

    setPdfLoading(true);
    try {
      const productIds = Array.from(selectedProducts);
      const response = await api.post('/catalog/pdf-from-products', {
        product_ids: productIds,
      });
      
      const { pdf_base64, filename } = response.data;

      if (Platform.OS === 'web') {
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
      } else {
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, pdf_base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Katalog PDF Paylaş',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Başarılı', `Katalog kaydedildi: ${fileUri}`);
        }
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      Alert.alert('Hata', 'Katalog oluşturulamadı: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setPdfLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9c27b0" />
          <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Katalog Oluştur</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat && styles.categoryChipTextActive,
              ]}
            >
              {cat === 'all' ? 'Tümü' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selection Counter */}
      <View style={styles.selectionBar}>
        <Text style={styles.selectionText}>
          {selectedProducts.size} ürün seçildi
        </Text>
        {selectedProducts.size > 0 && (
          <TouchableOpacity onPress={() => setSelectedProducts(new Set())}>
            <Text style={styles.clearText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Henüz ürün eklemediniz</Text>
            <TouchableOpacity
              style={styles.addProductButton}
              onPress={() => router.push('/add-product')}
            >
              <Text style={styles.addProductButtonText}>Ürün Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={[
                  styles.productCard,
                  selectedProducts.has(product._id) && styles.productCardSelected,
                ]}
                onPress={() => toggleProduct(product._id)}
              >
                {selectedProducts.has(product._id) && (
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark-circle" size={28} color="#9c27b0" />
                  </View>
                )}
                
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#ccc" />
                  </View>
                )}
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>₺{product.price.toFixed(2)}</Text>
                  {product.category && (
                    <Text style={styles.productCategory}>{product.category}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Generate Button */}
      {selectedProducts.size > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.generateButton, pdfLoading && styles.generateButtonDisabled]}
            onPress={handleGenerateCatalog}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="document-text" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>
                  Katalog PDF Oluştur ({selectedProducts.size} ürün)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    backgroundColor: '#9c27b0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  categoryScroll: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxHeight: 60,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#9c27b0',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  clearText: {
    fontSize: 14,
    color: '#9c27b0',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  addProductButton: {
    backgroundColor: '#9c27b0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: '1%',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productCardSelected: {
    borderColor: '#9c27b0',
    backgroundColor: '#f3e5f5',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9c27b0',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
  },
  bottomBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  generateButton: {
    backgroundColor: '#9c27b0',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Catalog;
