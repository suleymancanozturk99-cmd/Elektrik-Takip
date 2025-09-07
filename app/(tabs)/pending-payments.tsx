import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/ui/JobCard';
import { Job } from '@/types/job';

export default function PendingPaymentsPage() {
  const insets = useSafeAreaInsets();
  const { pendingPaymentJobs, loading, refreshJobs, addPayment } = useJobs();

  const [paymentModal, setPaymentModal] = useState<{
    visible: boolean;
    job: Job | null;
    amount: string;
    paymentMethod: 'Elden' | 'IBAN';
  }>({
    visible: false,
    job: null,
    amount: '',
    paymentMethod: 'Elden'
  });

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

  const handleJobPress = (job: Job) => {
    router.push({
      pathname: '/job-detail',
      params: { jobId: job.id }
    });
  };

  const handleCompletePayment = (job: Job) => {
    const remainingAmount = job.price - (job.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
    setPaymentModal({
      visible: true,
      job: job,
      amount: remainingAmount.toString(),
      paymentMethod: 'Elden'
    });
  };

  const processPayment = async () => {
    const { job, amount, paymentMethod } = paymentModal;
    
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

      setPaymentModal({ visible: false, job: null, amount: '', paymentMethod: 'Elden' });
      showWebAlert('Başarılı', 'Ödeme başarıyla kaydedildi.');
    } catch (error) {
      showWebAlert('Hata', 'Ödeme kaydedilirken bir hata oluştu.');
    }
  };

  const renderJob = ({ item }: { item: Job }) => {
    const totalPaid = item.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = item.price - totalPaid;

    return (
      <View style={styles.jobContainer}>
        <JobCard 
          job={item} 
          onPress={() => handleJobPress(item)}
          showPaymentStatus={true}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.completePaymentButton}
            onPress={() => handleCompletePayment(item)}
          >
            <MaterialIcons name="check-circle" size={20} color="white" />
            <Text style={styles.completePaymentText}>Ödeme Tamamlandı</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        Bekleyen ödeme bulunmuyor 🎉
      </Text>
    </View>
  );

  const PaymentMethodModal = () => (
    <Modal
      visible={paymentModal.visible}
      transparent
      animationType="fade"
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setPaymentModal({ visible: false, job: null, amount: '', paymentMethod: 'Elden' })}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Ödeme Ekle</Text>
          
          <View style={styles.jobInfo}>
            <Text style={styles.jobInfoTitle}>{paymentModal.job?.name}</Text>
            <Text style={styles.jobInfoPrice}>
              Kalan Bakiye: ₺{((paymentModal.job?.price || 0) - ((paymentModal.job?.payments || []).reduce((sum, p) => sum + p.amount, 0))).toLocaleString('tr-TR')}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ödeme Tutarı</Text>
            <TextInput
              style={styles.amountInput}
              value={paymentModal.amount}
              onChangeText={(text) => setPaymentModal(prev => ({ ...prev, amount: text }))}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ödeme Yöntemi</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[styles.methodOption, paymentModal.paymentMethod === 'Elden' && styles.selectedMethod]}
                onPress={() => setPaymentModal(prev => ({ ...prev, paymentMethod: 'Elden' }))}
                activeOpacity={0.7}
              >
                <MaterialIcons name="account-balance-wallet" size={24} color={paymentModal.paymentMethod === 'Elden' ? '#2196f3' : '#666'} />
                <Text style={[styles.methodText, paymentModal.paymentMethod === 'Elden' && styles.selectedMethodText]}>
                  Elden
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodOption, paymentModal.paymentMethod === 'IBAN' && styles.selectedMethod]}
                onPress={() => setPaymentModal(prev => ({ ...prev, paymentMethod: 'IBAN' }))}
                activeOpacity={0.7}
              >
                <MaterialIcons name="account-balance" size={24} color={paymentModal.paymentMethod === 'IBAN' ? '#2196f3' : '#666'} />
                <Text style={[styles.methodText, paymentModal.paymentMethod === 'IBAN' && styles.selectedMethodText]}>
                  IBAN
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelModalButton]}
              onPress={() => setPaymentModal({ visible: false, job: null, amount: '', paymentMethod: 'Elden' })}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelModalButtonText}>İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmModalButton]}
              onPress={processPayment}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmModalButtonText}>Ödeme Ekle</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {pendingPaymentJobs.length} bekleyen ödeme
        </Text>
        <Text style={styles.subHeaderText}>
          Tarihe göre sıralı • Kırmızı: Gecikmiş • Sarı: Yaklaşan
        </Text>
      </View>

      <FlatList
        data={pendingPaymentJobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshJobs} />
        }
      />

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
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subHeaderText: {
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 16,
  },
  jobContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 12,
    right: 28,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  completePaymentButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  completePaymentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
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
  jobInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  jobInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  jobInfoPrice: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
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
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmModalButton: {
    backgroundColor: '#4caf50',
  },
  cancelModalButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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