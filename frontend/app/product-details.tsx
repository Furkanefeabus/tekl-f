import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';

const ProductDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to load product:', error);
      Alert.alert('Hata', 'Ürün yüklenemedi.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Ürünü Sil',
      `${product.name} ürününü silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${id}`);
              Alert.alert('Başarılı', 'Ürün silindi.', [
                { text: 'Tamam', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Hata', 'Ürün silinemedi.');
            }
          },
        },
      ]
    );
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürün Detayı</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => router.push(`/edit-product?id=${id}`)}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {product.image_base64 ? (
          <Image
            source={{ uri: product.image_base64 }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={64} color="#999" />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.name}>{product.name}</Text>
          {product.category && (
            <Text style={styles.category}>{product.category}</Text>
          )}
          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Fiyat</Text>
            <Text style={styles.price}>₺{product.price.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Stok</Text>
            <Text style={styles.value}>
              {product.stock} {product.unit}
            </Text>
          </View>
          {product.sku && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>SKU</Text>
              <Text style={styles.value}>{product.sku}</Text>
            </View>
          )}
          {product.specifications && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Özellikler</Text>
              <Text style={styles.value}>{product.specifications}</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  editButton: {
    marginRight: 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#1a73e8',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34a853',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default ProductDetails;