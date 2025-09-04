import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJobs } from '@/hooks/useJobs';
import { Job } from '@/types/job';

export default function JobDetailPage() {
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { jobs, updateJob, deleteJob } = useJobs();

  const [job, setJob] = useState<Job | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    price: '',
    isPaid: false,
    estimatedPaymentDate: new Date(),
    paymentMethod: 'Elden' as 'Elden' | 'IBAN',
    withFather: false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
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
      setFormData({
        name: foundJob.name,
        description: foundJob.description,
        cost: foundJob.cost.toString(),
        price: foundJob.price.toString(),
        isPaid: foundJob.isPaid,
        estimatedPaymentDate: foundJob.estimatedPaymentDate ? new Date(foundJob.estimatedPaymentDate) : new Date(),
        paymentMethod: foundJob.paymentMethod,
        withFather: foundJob.withFather,
      });
    }
  }, [jobId, jobs]);

  const handleSave = async () => {
    if (!job || !formData.name.trim() || !formData.price || !formData.cost) {
      showWebAlert('Uyarı', 'Lütfen gerekli alanları doldurunuz.');
      return;
    }

    try {
      const updatedJob: Job = {
        ...job,
        name: formData.name,
        description: formData.description,
        cost: parseFloat(formData.cost) || 0,
        price: parseFloat(formData.price) || 0,
        isPaid: formData.isPaid,
        estimatedPaymentDate: !formData.isPaid ? formData.estimatedPaymentDate.toISOString() : undefined,
        paymentMethod: formData.paymentMethod,
        withFather: formData.withFather,
      };

      await updateJob(updatedJob);
      setIsEditing(false);
      showWebAlert('Başarılı', 'İş başarıyla güncellendi.');
    } catch (error) {
      showWebAlert('Hata', 'İş güncellenirken bir hata oluştu.');
    }
  };

  const handleDelete = () => {
    showWebAlert(
      'İşi Sil',
      'Bu işi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      async () => {
        try {
          await deleteJob(jobId!);
          showWebAlert('Başarılı', 'İş başarıyla silindi.', () => {
            router.back();
          });
        } catch (error) {
          showWebAlert('Hata', 'İş silinirken bir hata oluştu.');
        }
      }
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, estimatedPaymentDate: selectedDate }));
    }
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <Text>İş bulunamadı.</Text>
      </View>
    );
  }

  const PaymentMethodModal = () => (
    <Modal
      visible={paymentMethodModalVisible}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Ödeme Yöntemi Seçin</Text>
          
          <TouchableOpacity
            style={[styles.methodOption, formData.paymentMethod === 'Elden' && styles.selectedMethod]}
            onPress={() => {
              setFormData(prev => ({ ...prev, paymentMethod: 'Elden' }));
              setPaymentMethodModalVisible(false);
            }}
          >
            <MaterialIcons name="account-balance-wallet" size={24} color="#2196f3" />
            <Text style={styles.methodText}>Elden</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodOption, formData.paymentMethod === 'IBAN' && styles.selectedMethod]}
            onPress={() => {
              setFormData(prev => ({ ...prev, paymentMethod: 'IBAN' }));
              setPaymentMethodModalVisible(false);
            }}
          >
            <MaterialIcons name="account-balance" size={24} color="#2196f3" />
            <Text style={styles.methodText}>IBAN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setPaymentMethodModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <MaterialIcons 
              name={isEditing ? "close" : "edit"} 
              size={24} 
              color={isEditing ? "#f44336" : "#2196f3"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f44336' }]}
            onPress={handleDelete}
          >
            <MaterialIcons name="delete" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {isEditing ? (
          // Edit Mode
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>İş Adı *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="İş adı"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="İş detayları..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Malzeme Gideri *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.cost}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, cost: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Müşteri Ücreti *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

                        <View style={styles.switchRow}>
              <Text style={styles.label}>Ödeme alındı mı?</Text>
              <Switch
                value={formData.isPaid}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isPaid: value }))}
                trackColor={{ false: '#767577', true: '#4caf50' }}
                thumbColor={formData.isPaid ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {formData.isPaid && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ödeme Yöntemi *</Text>
                <TouchableOpacity
                  style={styles.methodButton}
                  onPress={() => setPaymentMethodModalVisible(true)}
                >
                  <MaterialIcons 
                    name={formData.paymentMethod === 'Elden' ? 'account-balance-wallet' : 'account-balance'} 
                    size={20} 
                    color="#666" 
                  />
                  <Text style={styles.methodButtonText}>{formData.paymentMethod}</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {!formData.isPaid && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tahmini Ödeme Tarihi</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <MaterialIcons name="calendar-today" size={20} color="#666" />
                    <Text style={styles.dateButtonText}>
                      {formData.estimatedPaymentDate.toLocaleDateString('tr-TR')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ödeme Yöntemi</Text>
                  <TouchableOpacity
                    style={styles.methodButton}
                    onPress={() => setPaymentMethodModalVisible(true)}
                  >
                    <MaterialIcons 
                      name={formData.paymentMethod === 'Elden' ? 'account-balance-wallet' : 'account-balance'} 
                      size={20} 
                      color="#666" 
                    />
                    <Text style={styles.methodButtonText}>{formData.paymentMethod}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.label}>Babam da vardı</Text>
              <Switch
                value={formData.withFather}
                onValueChange={(value) => setFormData(prev => ({ ...prev, withFather: value }))}
                trackColor={{ false: '#767577', true: '#2196f3' }}
                thumbColor={formData.withFather ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <MaterialIcons name="save" size={24} color="white" />
              <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // View Mode
          <View style={styles.details}>
            <View style={styles.detailCard}>
              <Text style={styles.jobTitle}>{job.name}</Text>
              <Text style={styles.jobDescription}>{job.description}</Text>
              
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <MaterialIcons 
                    name={job.isPaid ? "check-circle" : "schedule"} 
                    size={24} 
                    color={job.isPaid ? "#4caf50" : "#ff9800"} 
                  />
                  <Text style={[styles.statusText, { color: job.isPaid ? "#4caf50" : "#ff9800" }]}>
                    {job.isPaid ? 'Ödendi' : 'Bekliyor'}
                  </Text>
                </View>
                
                {job.withFather && (
                  <View style={styles.statusItem}>
                    <MaterialIcons name="people" size={24} color="#2196f3" />
                    <Text style={[styles.statusText, { color: "#2196f3" }]}>
                      Babamla Birlikte
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.amountCard}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Müşteri Ücreti:</Text>
                <Text style={styles.priceAmount}>{formatCurrency(job.price)}</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Malzeme Gideri:</Text>
                <Text style={styles.costAmount}>{formatCurrency(job.cost)}</Text>
              </View>
              <View style={[styles.amountRow, styles.profitRow]}>
                <Text style={styles.profitLabel}>Net Kar:</Text>
                <Text style={[styles.profitAmount, { color: job.price - job.cost >= 0 ? '#4caf50' : '#f44336' }]}>
                  {formatCurrency(job.price - job.cost)}
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialIcons name="calendar-today" size={20} color="#666" />
                <Text style={styles.infoText}>İş Tarihi: {formatDate(job.createdAt)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialIcons 
                  name={job.paymentMethod === 'Elden' ? 'account-balance-wallet' : 'account-balance'} 
                  size={20} 
                  color="#666" 
                />
                <Text style={styles.infoText}>Ödeme: {job.paymentMethod}</Text>
              </View>

              {!job.isPaid && job.estimatedPaymentDate && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="schedule" size={20} color="#ff9800" />
                  <Text style={styles.infoText}>
                    Tahmini Ödeme: {formatDate(job.estimatedPaymentDate)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.estimatedPaymentDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

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
    </ScrollView>
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
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  details: {
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  jobDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  costAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  profitRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginBottom: 0,
  },
  profitLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profitAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  // Form styles (copied from add-job.tsx)
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
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
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedMethod: {
    borderColor: '#2196f3',
    backgroundColor: '#e3f2fd',
  },
  methodText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
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