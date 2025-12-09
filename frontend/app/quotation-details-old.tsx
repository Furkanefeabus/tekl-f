import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const QuotationDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    loadQuotation();
  }, []);

  const loadQuotation = async () => {
    try {
      const response = await api.get(`/quotations/${id}`);
      setQuotation(response.data);
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
      console.log('PDF indirme başladı...');
      const response = await api.get(`/quotations/${id}/pdf`);
      console.log('PDF verisi alındı');
      const { pdf_base64, filename } = response.data;
      
      console.log('PDF boyutu:', pdf_base64.length, 'Dosya adı:', filename);

      if (Platform.OS === 'web') {
        // Web için daha güvenilir yöntem
        try {
          // Base64'ü binary'ye çevir
          const binaryString = atob(pdf_base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Blob oluştur
          const blob = new Blob([bytes], { type: 'application/pdf' });
          console.log('Blob oluşturuldu:', blob.size, 'bytes');
          
          // URL oluştur ve indir
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);
          
          console.log('PDF indirme tamamlandı');
          Alert.alert('Başarılı', 'PDF indirildi!');
        } catch (webError) {
          console.error('Web indirme hatası:', webError);
          throw webError;
        }
      } else {
        // Mobile için file system
        console.log('Mobil indirme başlatılıyor...');
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, pdf_base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('Dosya kaydedildi:', fileUri);

        // Share the file
        if (await Sharing.isAvailableAsync()) {
          console.log('Paylaşma menüsü açılıyor...');
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

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.put(`/quotations/${id}/status?status=${status}`);
      loadQuotation();
      Alert.alert('Başarılı', 'Durum güncellendi.');
    } catch (error) {
      Alert.alert('Hata', 'Durum güncellenemedi.');
    }
  };

  const handleSendEmail = async () => {
    if (!quotation?.customer_id) {
      Alert.alert('Hata', 'Müşteri bilgisi bulunamadı.');
      return;
    }

    try {
      const customerResponse = await api.get(`/customers/${quotation.customer_id}`);
      const customer = customerResponse.data;

      if (!customer.email) {
        Alert.alert('Hata', 'Bu müşterinin e-posta adresi kayıtlı değil.');
        return;
      }

      const response = await api.post(`/quotations/${id}/send-email`, {
        quotation_id: id,
        recipient_email: customer.email,
        subject: `Teklif: ${quotation.quotation_number}`,
        message: 'Teklifiniz ektedir.'
      });

      if (response.data.demo_mode) {
        Alert.alert(
          'Demo Mod',
          'E-posta gönderme özelliği demo modda. Gerçek e-posta göndermek için SendGrid API key gereklidir.\n\nAlıcı: ' + customer.email
        );
      } else {
        Alert.alert('Başarılı', 'E-posta gönderildi!');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'E-posta gönderilemedi.');
    }
  };

  const handleSendWhatsApp = async () => {
    if (!quotation?.customer_id) {
      Alert.alert('Hata', 'Müşteri bilgisi bulunamadı.');
      return;
    }

    try {
      const customerResponse = await api.get(`/customers/${quotation.customer_id}`);
      const customer = customerResponse.data;

      if (!customer.phone) {
        Alert.alert('Hata', 'Bu müşterinin telefon numarası kayıtlı değil.');
        return;
      }

      const response = await api.post(`/quotations/${id}/send-whatsapp`, {
        quotation_id: id,
        phone_number: customer.phone,
        message: `Merhaba! ${quotation.quotation_number} numaralı teklifiniz hazır.`
      });

      if (response.data.demo_mode) {
        Alert.alert(
          'Demo Mod',
          'WhatsApp gönderme özelliği demo modda. Gerçek WhatsApp göndermek için Twilio API key gereklidir.\n\nAlıcı: ' + customer.phone
        );
      } else {
        Alert.alert('Başarılı', 'WhatsApp mesajı gönderildi!');
      }
    } catch (error: any) {
      Alert.alert('Hata', error.response?.data?.detail || 'WhatsApp gönderilemedi.');
    }
  };

  const handleShare = () => {
    Alert.alert('Paylaş', 'Teklifi nasıl paylaşmak istersiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'PDF İndir',
        onPress: handleDownloadPDF,
      },
      {
        text: 'E-posta Gönder',
        onPress: handleSendEmail,
      },
      {
        text: 'WhatsApp Gönder',
        onPress: handleSendWhatsApp,
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#ffeaa7';
      case 'sent':
        return '#74b9ff';
      case 'accepted':
        return '#55efc4';
      case 'rejected':
        return '#ff7675';
      default:
        return '#dfe6e9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Taslak';
      case 'sent':
        return 'Gönderildi';
      case 'accepted':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };

  if (loading || !quotation) {
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
        <Text style={styles.headerTitle}>Teklif Detayı</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Header Info */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.quotationNumber}>
              {quotation.quotation_number}
            </Text>
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
          </View>
          <Text style={styles.customerName}>{quotation.customer_name}</Text>
          <Text style={styles.date}>
            {format(new Date(quotation.created_at), 'dd MMMM yyyy', {
              locale: tr,
            })}
          </Text>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ürünler</Text>
          {quotation.items.map((item: any, index: number) => (
            <View key={index} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemTotal}>₺{item.total.toFixed(2)}</Text>
              </View>
              <Text style={styles.itemDetails}>
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

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendEmail}
          >
            <Ionicons name="mail-outline" size={24} color="#ea4335" />
            <Text style={styles.actionButtonText}>E-posta Gönder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.actionButtonText}>WhatsApp Gönder</Text>
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
        </View>
      </ScrollView>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34a853',
  },
  itemDetails: {
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
});

export default QuotationDetails;
