import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from '../src/components/Toast';
import { useToast } from '../src/hooks/useToast';
import api from '../src/services/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

const QuotationDetailsNew = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    loadQuotation();
  }, []);

  const loadQuotation = async () => {
    try {
      const response = await api.get(`/quotations/${id}`);
      setQuotation(response.data);
      setPaymentAmount(response.data.total.toFixed(2));
    } catch (error) {
      console.error('Failed to load quotation:', error);
      Alert.alert('Hata', 'Teklif yüklenemedi.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await api.get(`/quotations/${id}/pdf`);
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
        
        Alert.alert('Başarılı', 'PDF indirildi!');
      } else {
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, pdf_base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'PDF Paylaş',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Başarılı', `PDF kaydedildi: ${fileUri}`);
        }
      }
    } catch (error: any) {
      console.error('PDF indirme hatası:', error);
      Alert.alert('Hata', 'PDF indirilemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setPdfLoading(false);
    }
  };

  const { toast, showToast, hideToast } = useToast();
  
  const handleUpdateStatus = async (status: string) => {
    try {
      await api.put(`/quotations/${id}/status?status=${status}`);
      loadQuotation();
      showToast('✅ Durum Güncellendi!', 'success');
    } catch (error) {
      Alert.alert('Hata', 'Durum güncellenemedi.');
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await api.put(`/quotations/${id}/payment`, {
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        payment_amount: parseFloat(paymentAmount),
        payment_notes: 'Ödeme alındı',
      });
      setShowPaymentModal(false);
      loadQuotation();
      showToast('✅ Ödeme Kaydedildi!', 'success');
    } catch (error) {
      Alert.alert('Hata', 'Ödeme kaydedilemedi.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#ffeaa7';
      case 'sent': return '#74b9ff';
      case 'accepted': return '#55efc4';
      case 'rejected': return '#ff7675';
      default: return '#dfe6e9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Taslak';
      case 'sent': return 'Gönderildi';
      case 'accepted': return 'Kabul Edildi';
      case 'rejected': return 'Reddedildi';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#34a853';
      case 'pending': return '#fbbc04';
      case 'overdue': return '#ea4335';
      default: return '#999';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Ödendi';
      case 'pending': return 'Ödeme Bekliyor';
      case 'overdue': return 'Gecikmiş';
      default: return status;
    }
  };

  if (loading || !quotation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Toast {...toast} onHide={hideToast} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Teklif Detayı</Text>
        <TouchableOpacity onPress={() => router.push('/design-settings')}>
          <Ionicons name="color-palette-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Header Info with Payment Status */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.quotationNumber}>
              {quotation.quotation_number}
            </Text>
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(quotation.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(quotation.status)}
                </Text>
              </View>
              
              {quotation.status === 'accepted' && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getPaymentStatusColor(quotation.payment_status || 'pending') },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getPaymentStatusText(quotation.payment_status || 'pending')}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.customerName}>{quotation.customer_name}</Text>
          <Text style={styles.date}>
            {format(new Date(quotation.created_at), 'dd MMMM yyyy', {
              locale: tr,
            })}
          </Text>
        </View>

        {/* Items with Specifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ürünler</Text>
          {quotation.items.map((item: any, index: number) => (
            <View key={index} style={styles.productItem}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{item.product_name}</Text>
                <Text style={styles.productTotal}>₺{item.total.toFixed(2)}</Text>
              </View>
              
              {/* Specifications List */}
              {item.specifications && (
                <View style={styles.specsContainer}>
                  <Text style={styles.specsTitle}>Özellikler:</Text>
                  {item.specifications.split('-').filter(spec => spec.trim()).map((spec, idx) => (
                    <View key={idx} style={styles.specItem}>
                      <Text style={styles.specBullet}>•</Text>
                      <Text style={styles.specText}>{spec.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              <Text style={styles.productDetails}>
                {item.quantity} {item.unit} x ₺{item.unit_price.toFixed(2)}
                {item.discount_percent > 0 &&
                  ` (${item.discount_percent}% indirim)`}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Ara Toplam:</Text>
            <Text style={styles.totalValue}>
              ₺{quotation.subtotal.toFixed(2)}
            </Text>
          </View>
          {quotation.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>İndirim:</Text>
              <Text style={styles.totalValue}>
                -₺{quotation.discount_amount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              KDV (%{quotation.tax_rate.toFixed(0)}):
            </Text>
            <Text style={styles.totalValue}>
              ₺{quotation.tax_amount.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.totalRowFinal]}>
            <Text style={styles.totalLabelFinal}>Genel Toplam:</Text>
            <Text style={styles.totalValueFinal}>
              ₺{quotation.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {quotation.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notlar</Text>
            <Text style={styles.notes}>{quotation.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>İşlemler</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDownloadPDF}
            disabled={pdfLoading}
          >
            <Ionicons 
              name={pdfLoading ? "hourglass-outline" : "download-outline"} 
              size={24} 
              color={pdfLoading ? "#999" : "#1a73e8"} 
            />
            <Text style={[styles.actionButtonText, pdfLoading && { color: '#999' }]}>
              {pdfLoading ? 'PDF Oluşturuluyor...' : 'PDF İndir'}
            </Text>
          </TouchableOpacity>

          {quotation.status === 'draft' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleUpdateStatus('sent')}
            >
              <Ionicons name="send-outline" size={24} color="#34a853" />
              <Text style={styles.actionButtonText}>Gönderildi Olarak İşaretle</Text>
            </TouchableOpacity>
          )}

          {quotation.status === 'sent' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleUpdateStatus('accepted')}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color="#34a853"
                />
                <Text style={styles.actionButtonText}>Kabul Edildi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleUpdateStatus('rejected')}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={24}
                  color="#ea4335"
                />
                <Text style={styles.actionButtonText}>Reddedildi</Text>
              </TouchableOpacity>
            </>
          )}

          {quotation.status === 'accepted' && quotation.payment_status !== 'paid' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.paymentButton]}
              onPress={() => setShowPaymentModal(true)}
            >
              <Ionicons name="cash-outline" size={24} color="#fff" />
              <Text style={[styles.actionButtonText, styles.paymentButtonText]}>
                Ödeme Alındı Olarak İşaretle
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ödeme Kaydı</Text>
            <Text style={styles.modalLabel}>Ödenen Tutar:</Text>
            <Text style={styles.modalAmount}>₺{paymentAmount}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleMarkAsPaid}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  Onayla
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badgeContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  quotationNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  productItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  productTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34a853',
  },
  specsContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  specsTitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666',
    marginBottom: 4,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
    paddingLeft: 4,
  },
  specBullet: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  specText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
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
    fontWeight: '500',
    color: '#333',
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
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  paymentButton: {
    backgroundColor: '#34a853',
  },
  paymentButtonText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  modalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34a853',
    marginBottom: 24,
    textAlign: 'center',
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
    backgroundColor: '#34a853',
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

export default QuotationDetailsNew;
