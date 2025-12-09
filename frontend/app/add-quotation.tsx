import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import api from '../src/services/api';

interface Customer {
  id: string;
  name: string;
  company?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
}

interface QuotationItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  total: number;
}

const AddQuotation = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(20);
  
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [customProductModalVisible, setCustomProductModalVisible] = useState(false);
  const [customProduct, setCustomProduct] = useState({
    name: '',
    specifications: '',
    unit: 'adet',
    unit_price: '',
  });

  useEffect(() => {
    loadCustomers();
    loadProducts();
    loadDefaultTaxRate();
  }, []);

  const loadDefaultTaxRate = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.default_tax_rate) {
        setTaxRate(response.data.default_tax_rate);
      }
    } catch (error) {
      console.error('Failed to load default tax rate:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const addProduct = (product: Product) => {
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      Alert.alert('Uyarı', 'Bu ürün zaten eklendi.');
      return;
    }

    const newItem: QuotationItem = {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit: product.unit,
      unit_price: product.price,
      discount_percent: 0,
      total: product.price,
      specifications: product.specifications || undefined,
      is_custom: false,
    };

    setItems([...items, newItem]);
    setProductModalVisible(false);
  };

  const addCustomProduct = () => {
    if (!customProduct.name || !customProduct.unit_price) {
      Alert.alert('Hata', 'Ürün adı ve fiyat zorunludur.');
      return;
    }

    const newItem: QuotationItem = {
      product_id: null,
      product_name: customProduct.name,
      quantity: 1,
      unit: customProduct.unit,
      unit_price: parseFloat(customProduct.unit_price),
      discount_percent: 0,
      total: parseFloat(customProduct.unit_price),
      specifications: customProduct.specifications || undefined,
      is_custom: true,
    };

    setItems([...items, newItem]);
    setCustomProductModalVisible(false);
    setCustomProduct({ name: '', specifications: '', unit: 'adet', unit_price: '' });
    Alert.alert('Başarılı', 'Özel ürün eklendi.');
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === 'quantity') {
      item.quantity = parseFloat(value) || 0;
    } else if (field === 'unit_price') {
      item.unit_price = parseFloat(value) || 0;
    } else if (field === 'discount_percent') {
      item.discount_percent = parseFloat(value) || 0;
    }

    // Calculate total
    const subtotal = item.quantity * item.unit_price;
    item.total = subtotal - (subtotal * item.discount_percent) / 100;

    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = parseFloat(discount) || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const total = taxableAmount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Alert.alert('Hata', 'Lütfen müşteri seçin.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir ürün ekleyin.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/quotations', {
        customer_id: selectedCustomer.id,
        items: items,
        discount_amount: parseFloat(discount) || 0,
        tax_rate: taxRate,
        notes: notes || undefined,
      });

      // Başarı mesajı göster ve teklifler sayfasına dön
      router.replace('/(tabs)/quotations');
      setTimeout(() => {
        Alert.alert('✅ Başarılı!', 'Teklif başarıyla oluşturuldu.');
      }, 500);
    } catch (error: any) {
      Alert.alert(
        'Hata',
        error.response?.data?.detail || 'Teklif oluşturulamadı.'
      );
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Teklif</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Customer Selection */}
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setCustomerModalVisible(true)}
        >
          <View style={styles.selectButtonContent}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.selectButtonText}>
              {selectedCustomer
                ? selectedCustomer.company || selectedCustomer.name
                : 'Müşteri Seç'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ürünler</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Ionicons name="close-circle" size={24} color="#ea4335" />
                </TouchableOpacity>
              </View>

              <View style={styles.itemRow}>
                <Input
                  label="Miktar"
                  value={item.quantity.toString()}
                  onChangeText={(text) => updateItem(index, 'quantity', text)}
                  keyboardType="decimal-pad"
                  containerStyle={styles.itemInput}
                />
                <Input
                  label="Birim Fiyat"
                  value={item.unit_price.toString()}
                  onChangeText={(text) => updateItem(index, 'unit_price', text)}
                  keyboardType="decimal-pad"
                  containerStyle={styles.itemInput}
                />
              </View>

              <View style={styles.itemRow}>
                <Input
                  label="İndirim %"
                  value={item.discount_percent.toString()}
                  onChangeText={(text) =>
                    updateItem(index, 'discount_percent', text)
                  }
                  keyboardType="decimal-pad"
                  containerStyle={styles.itemInput}
                />
                <View style={styles.itemInput}>
                  <Text style={styles.itemLabel}>Toplam</Text>
                  <Text style={styles.itemTotal}>₺{item.total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.addButtonsRow}>
            <TouchableOpacity
              style={[styles.addButton, styles.addButtonHalf]}
              onPress={() => setProductModalVisible(true)}
            >
              <Ionicons name="list" size={20} color="#1a73e8" />
              <Text style={styles.addButtonText}>Stoktan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addButton, styles.addButtonHalf, styles.customButton]}
              onPress={() => setCustomProductModalVisible(true)}
            >
              <Ionicons name="create" size={20} color="#9c27b0" />
              <Text style={[styles.addButtonText, { color: '#9c27b0' }]}>Özel Ürün</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Discount & Notes */}
        <Input
          label="Genel İndirim (₺)"
          placeholder="0.00"
          value={discount}
          onChangeText={setDiscount}
          keyboardType="decimal-pad"
        />

        <Input
          label="Notlar"
          placeholder="Teklif ile ilgili notlar..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ara Toplam:</Text>
            <Text style={styles.totalValue}>₺{totals.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>İndirim:</Text>
            <Text style={styles.totalValue}>
              -₺{totals.discountAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>KDV (%{taxRate}):</Text>
            <Text style={styles.totalValue}>₺{totals.taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelFinal}>Genel Toplam:</Text>
            <Text style={styles.totalValueFinal}>
              ₺{totals.total.toFixed(2)}
            </Text>
          </View>
        </View>

        <Button
          title="Teklifi Oluştur"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>

      {/* Customer Modal */}
      <Modal
        visible={customerModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Müşteri Seç</Text>
              <TouchableOpacity
                onPress={() => setCustomerModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={customers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCustomer(item);
                    setCustomerModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemTitle}>
                    {item.company || item.name}
                  </Text>
                  <Text style={styles.modalItemSubtitle}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Müşteri bulunamadı</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Product Modal */}
      <Modal
        visible={productModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ürün Seç</Text>
              <TouchableOpacity
                onPress={() => setProductModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => addProduct(item)}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    <Text style={styles.modalItemSubtitle}>
                      Stok: {item.stock} {item.unit}
                    </Text>
                  </View>
                  <Text style={styles.productPrice}>₺{item.price.toFixed(2)}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Ürün bulunamadı</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Custom Product Modal */}
      <Modal
        visible={customProductModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Özel Ürün Ekle</Text>
              <TouchableOpacity
                onPress={() => setCustomProductModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              <Input
                label="Ürün Adı *"
                placeholder="Ürün adını girin"
                value={customProduct.name}
                onChangeText={(text) =>
                  setCustomProduct({ ...customProduct, name: text })
                }
              />

              <Input
                label="Özellikler"
                placeholder="Örn: Renk: Siyah, Boyut: XL"
                value={customProduct.specifications}
                onChangeText={(text) =>
                  setCustomProduct({ ...customProduct, specifications: text })
                }
                multiline
                numberOfLines={2}
                style={{ height: 60, textAlignVertical: 'top' }}
              />

              <View style={styles.modalRow}>
                <Input
                  label="Fiyat *"
                  placeholder="0.00"
                  value={customProduct.unit_price}
                  onChangeText={(text) =>
                    setCustomProduct({ ...customProduct, unit_price: text })
                  }
                  keyboardType="decimal-pad"
                  containerStyle={styles.modalHalfInput}
                />

                <View style={styles.modalHalfInput}>
                  <Text style={styles.modalLabel}>Birim</Text>
                  <View style={styles.unitPicker}>
                    {['adet', 'kg', 'lt', 'm'].map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitOption,
                          customProduct.unit === unit && styles.unitOptionActive,
                        ]}
                        onPress={() =>
                          setCustomProduct({ ...customProduct, unit })
                        }
                      >
                        <Text
                          style={[
                            styles.unitOptionText,
                            customProduct.unit === unit &&
                              styles.unitOptionTextActive,
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Button
                title="Ürünü Ekle"
                onPress={addCustomProduct}
                style={styles.modalButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fbbc04',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fbbc04',
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInput: {
    width: '48%',
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34a853',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    color: '#1a73e8',
    fontWeight: '600',
    marginLeft: 8,
  },
  totalsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRowFinal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValueFinal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34a853',
  },
  submitButton: {
    backgroundColor: '#fbbc04',
    marginBottom: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  productInfo: {
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34a853',
  },
  emptyText: {
    textAlign: 'center',
    padding: 32,
    color: '#999',
  },
  addButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButtonHalf: {
    width: '48%',
  },
  customButton: {
    borderColor: '#9c27b0',
  },
  modalForm: {
    padding: 16,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalHalfInput: {
    width: '48%',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  unitPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  unitOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  unitOptionActive: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  unitOptionText: {
    fontSize: 12,
    color: '#666',
  },
  unitOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  taxRateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  taxRateButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
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
});

export default AddQuotation;
