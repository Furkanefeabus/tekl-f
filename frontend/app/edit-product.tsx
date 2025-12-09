import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  ActionSheetIOS,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import Toast from '../src/components/Toast';
import { useToast } from '../src/hooks/useToast';
import api from '../src/services/api';
import { pickImage, takePicture } from '../src/utils/imageUtils';

const EditProduct = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    unit: 'adet',
    sku: '',
    specifications: '',
    image_base64: '',
  });

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, []);

  const loadProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      const product = response.data;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        unit: product.unit || 'adet',
        sku: product.sku || '',
        specifications: product.specifications || '',
        image_base64: product.image_base64 || '',
      });
    } catch (error) {
      console.error('Failed to load product:', error);
      Alert.alert('Hata', 'Ürün yüklenemedi.');
      router.back();
    } finally {
      setPageLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/catalog/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['İptal', 'Fotoğraf Çek', 'Galeriden Seç'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const image = await takePicture();
            if (image) setFormData({ ...formData, image_base64: image });
          } else if (buttonIndex === 2) {
            const image = await pickImage();
            if (image) setFormData({ ...formData, image_base64: image });
          }
        }
      );
    } else {
      Alert.alert('Resim Seç', 'Resim kaynağını seçin', [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Fotoğraf Çek',
          onPress: async () => {
            const image = await takePicture();
            if (image) setFormData({ ...formData, image_base64: image });
          },
        },
        {
          text: 'Galeriden Seç',
          onPress: async () => {
            const image = await pickImage();
            if (image) setFormData({ ...formData, image_base64: image });
          },
        },
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/products/${id}`, {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category || undefined,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        unit: formData.unit,
        sku: formData.sku || undefined,
        specifications: formData.specifications || undefined,
        image_base64: formData.image_base64 || undefined,
      });
      
      showToast('✅ Ürün Güncellendi!', 'success');
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      Alert.alert(
        'Hata',
        error.response?.data?.detail || 'Ürün güncellenemedi.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ürünü Düzenle</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Ürünü Düzenle</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={handleImagePicker}
          >
            {formData.image_base64 ? (
              <Image
                source={{ uri: formData.image_base64 }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={48} color="#999" />
                <Text style={styles.imageText}>Ürün Resmi Ekle</Text>
              </View>
            )}
          </TouchableOpacity>

          <Input
            label="Ürün Adı *"
            placeholder="Ürün adını girin"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <Input
            label="Açıklama"
            placeholder="Ürün açıklaması"
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategori</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={[styles.dropdownText, !formData.category && styles.dropdownPlaceholder]}>
                {formData.category || 'Kategori seçin'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Category Picker Modal */}
          <Modal
            visible={showCategoryPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCategoryPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Kategori Seç</Text>
                  <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.categoryList}>
                  <TouchableOpacity
                    style={styles.addCategoryButton}
                    onPress={() => {
                      setShowCategoryPicker(false);
                      setTimeout(() => setShowAddCategory(true), 300);
                    }}
                  >
                    <Ionicons name="add-circle" size={24} color="#1a73e8" />
                    <Text style={styles.addCategoryText}>Yeni Kategori Ekle</Text>
                  </TouchableOpacity>

                  {categories.map((cat, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.categoryItem,
                        formData.category === cat && styles.categoryItemSelected,
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, category: cat });
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryItemText,
                          formData.category === cat && styles.categoryItemTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                      {formData.category === cat && (
                        <Ionicons name="checkmark" size={20} color="#1a73e8" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Add Category Modal */}
          <Modal
            visible={showAddCategory}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAddCategory(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Yeni Kategori Ekle</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Kategori adı (örn: Elektronik)"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setShowAddCategory(false);
                      setNewCategoryName('');
                    }}
                  >
                    <Text style={styles.modalButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={() => {
                      if (newCategoryName.trim()) {
                        setFormData({ ...formData, category: newCategoryName.trim() });
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }
                    }}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Ekle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Input
            label="SKU / Stok Kodu"
            placeholder="Ürün kodu"
            value={formData.sku}
            onChangeText={(text) => setFormData({ ...formData, sku: text })}
          />

          <Input
            label="Özellikler"
            placeholder="Örn: Renk: Siyah, Boyut: 15.6 inch, RAM: 16GB"
            value={formData.specifications}
            onChangeText={(text) =>
              setFormData({ ...formData, specifications: text })
            }
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          <View style={styles.row}>
            <Input
              label="Fiyat *"
              placeholder="0.00"
              value={formData.price}
              onChangeText={(text) =>
                setFormData({ ...formData, price: text })
              }
              keyboardType="decimal-pad"
              containerStyle={styles.halfInput}
            />

            <Input
              label="Stok Miktarı *"
              placeholder="0"
              value={formData.stock}
              onChangeText={(text) =>
                setFormData({ ...formData, stock: text })
              }
              keyboardType="number-pad"
              containerStyle={styles.halfInput}
            />
          </View>

          <View>
            <Text style={styles.label}>Birim</Text>
            <View style={styles.unitContainer}>
              {['adet', 'kg', 'lt', 'm', 'm²', 'm³'].map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    formData.unit === unit && styles.unitButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, unit })}
                >
                  <Text
                    style={[
                      styles.unitText,
                      formData.unit === unit && styles.unitTextActive,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Değişiklikleri Kaydet"
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
    backgroundColor: '#1a73e8',
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  unitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  unitButtonActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  unitText: {
    fontSize: 14,
    color: '#666',
  },
  unitTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholder: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemSelected: {
    backgroundColor: '#f8f9ff',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  categoryItemTextSelected: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  addCategoryText: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '600',
    marginLeft: 12,
  },
  modalInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonConfirm: {
    backgroundColor: '#1a73e8',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalButtonTextConfirm: {
    color: '#fff',
  },
});

export default EditProduct;
