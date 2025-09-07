import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJobs } from '@/hooks/useJobs';
import { Job } from '@/types/job';

export default function AddPaymentPage() {
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { jobs, addPayment } = useJobs();

  const [job, setJob] = useState<Job | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Elden' | 'IBAN'>('Elden');
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);

  // Web Alert Handler
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onOk?: () => void;
  }>({ visible: false, title: '', message: '' });

  const showWebAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      setAlertConfig({ visible: true, title, message, onOk });
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'Tamam', onPress: onOk }] : undefined);
    }
  };

  useEffect(() => {
    const foundJob = jobs.find(j => j.id === jobId);
    if (foundJob) {
      setJob(foundJob);
      const totalPaid = foundJob.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const remaining = foundJob.price - totalPaid;
      setAmount(remaining.toString());
    }
  }, [jobId, jobs]);

  const handleSavePayment = async () => {
    if (!job || !amount.trim()) {
      showWebAlert('Uyarı', 'Lütfen ödeme tutarını giriniz.');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      showWebAlert('Uyarı', 'Lütfen geçerli bir tutar giriniz.');
      return;
    }

    const totalPaid = job.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = job.price - totalPaid;

    if (paymentAmount > remaining) {
      showWebAlert('Uyarı', 'Ödeme tutarı kalan bakiyeden fazla olamaz.');
      return;
    }

    try {
      await addPayment(job.id, {
        amount: paymentAmount,
        paymentMethod: paymentMethod
      });

      showWebAlert('Başarılı', 'Ödeme başarıyla kaydedildi.', () => {
        router.back();
      });
    } catch (error) {
      showWebAlert('Hata', 'Ödeme kaydedilirken bir hata oluştu.');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <Text>İş bulunamadı.</Text>
      </View>
    );
  }

  const totalPaid = job.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remaining = job.price - totalPaid;

  const PaymentMethodModal = () => (
    <Modal
      visible={paymentMethodModalVisible}
      transparent
      animationType="fade"
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setPaymentMethodModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Ödeme Yöntemi Seçin</Text>
          
          <TouchableOpacity
            style={[styles.methodOption, paymentMethod === 'Elden' && styles.selectedMethod]}
            onPress={() => {
              setPaymentMethod('Elden');
              setPaymentMethodModalVisible(false);
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-balance-wallet" size={24} color={paymentMethod === 'Elden' ? '#2196f3' : '#666'} />
            <Text style={[styles.methodText, paymentMethod === 'Elden' && styles.selectedMethodText]}>
              Elden
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodOption, paymentMethod === 'IBAN' && styles.selectedMethod]}
            onPress={() => {
              setPaymentMethod('IBAN');
              setPaymentMethodModalVisible(false);
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-balance" size={24} color={paymentMethod === 'IBAN' ? '#2196f3' : '#666'} />
            <Text style={[styles.methodText, paymentMethod === 'IBAN' && styles.selectedMethodText]}>
              IBAN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setPaymentMethodModalVisible(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{job.name}</Text>
          <Text style={styles.jobPrice}>
            Toplam Tutar: {formatCurrency(job.price)}
          </Text>
          <Text style={styles.jobPaid}>
            Ödenen: {formatCurrency(totalPaid)}
          </Text>
          <Text style={styles.jobRemaining}>
            Kalan Bakiye: {formatCurrency(remaining)}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ödeme Tutarı *</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ödeme Yöntemi *</Text>
            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => setPaymentMethodModalVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={paymentMethod === 'Elden' ? 'account-balance-wallet' : 'account-balance'} 
                size={20} 
                color="#666" 
              />
              <Text style={styles.methodButtonText}>{paymentMethod}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSavePayment}
            activeOpacity={0.7}
          >
            <MaterialIcons name="check" size={24} color="white" />
            <Text style={styles.saveButtonText}>Ödemeyi Kaydet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelFormButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelFormButtonText}>İptal</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PaymentMethodModal />

      {/* Web Alert Modal */}
      {Platform.OS === 'web' && (
        <Modal visible={alertConfig.visible} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={() => {
                  alertConfig.onOk?.();
                  setAlertConfig(prev => ({ ...prev, visible: false }));
                }}
              >
                <Text style={styles.alertButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  jobInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  jobPrice: {
    fontSize: 16,
    color: '#2196f3',
    marginBottom: 4,
  },
  jobPaid: {
    fontSize: 16,
    color: '#4caf50',
    marginBottom: 4,
  },
  jobRemaining: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  methodButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelFormButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelFormButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    minWidth: 320,
    maxWidth: 400,
    margin: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  selectedMethod: {
    borderColor: '#2196f3',
    backgroundColor: '#e3f2fd',
  },
  methodText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedMethodText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    minWidth: 280,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  alertButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});