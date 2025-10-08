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
import { useCustomers } from '@/hooks/useCustomers';
import { useNotes } from '@/hooks/useNotes';
import { Job } from '@/types/job';
import PaymentHistoryCard from '@/components/ui/PaymentHistoryCard';

export default function JobDetailPage() {
  const insets = useSafeAreaInsets();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { jobs, updateJob, deleteJob } = useJobs();
  const { getCustomerById } = useCustomers();
  const { getJobNotes } = useNotes();

  const [job, setJob] = useState<Job | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    price: '',
    estimatedPaymentDate: new Date(),
    withFather: false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

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
        estimatedPaymentDate: foundJob.estimatedPaymentDate ? new Date(foundJob.estimatedPaymentDate) : new Date(),
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
        estimatedPaymentDate: formData.estimatedPaymentDate.toISOString(),
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
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
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

  // Get customer and notes data
  const customer = job.customerId ? getCustomerById(job.customerId) : null;
  const jobNotes = getJobNotes(job.id);
  const totalPaid = job.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remaining = job.price - totalPaid;
  const isFullyPaid = totalPaid >= job.price;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Customer Info Section */}        
        {customer && (
          <TouchableOpacity 
            style={styles.customerCard}
            onPress={() => router.push({
              pathname: '/customer-detail',
              params: { customerId: customer.id }
            })}
          >
            <View style={styles.customerHeader}>
              <MaterialIcons name="person" size={24} color="#2196f3" />
              <Text style={styles.customerTitle}>Müşteri Bilgileri</Text>
              <MaterialIcons name="chevron-right" size={24} color="#ccc" />
            </View>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerPhone}>{customer.phone}</Text>
            {customer.address && (
              <Text style={styles.customerAddress}>{customer.address}</Text>
            )}
          </TouchableOpacity>
        )}

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

            {!isFullyPaid && (
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

            <TouchableOpacity
              style={[styles.bottomActionButton, styles.cancelButton]}
              onPress={() => setIsEditing(false)}
            >
              <MaterialIcons name="close" size={24} color="white" />
              <Text style={styles.bottomActionButtonText}>İptal</Text>
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
                    name={isFullyPaid ? "check-circle" : "schedule"} 
                    size={24} 
                    color={isFullyPaid ? "#4caf50" : "#ff9800"} 
                  />
                  <Text style={[styles.statusText, { color: isFullyPaid ? "#4caf50" : "#ff9800" }]}>
                    {isFullyPaid ? 'Tamamen Ödendi' : 'Ödeme Bekliyor'}
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

              {!isFullyPaid && job.estimatedPaymentDate && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="schedule" size={20} color="#ff9800" />
                  <Text style={styles.infoText}>
                    Tahmini Ödeme: {formatDate(job.estimatedPaymentDate)}
                  </Text>
                </View>
              )}
            </View>

            {/* Payment History */}
            <PaymentHistoryCard 
              payments={job.payments || []}
              totalAmount={job.price}
            />

            {/* Job Notes Section */}
            {jobNotes.length > 0 && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>İş Notları ({jobNotes.length})</Text>
                {jobNotes.map((note) => (
                  <View key={note.id} style={styles.noteCard}>
                    <View style={styles.noteHeader}>
                      <Text style={styles.noteCategory}>{note.category || 'genel'}</Text>
                      <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                    </View>
                    <Text style={styles.noteContent}>{note.content}</Text>
                    <View style={styles.noteStatus}>
                      <MaterialIcons 
                        name={note.status === 'tamamlandı' ? 'check-circle' : 'radio-button-unchecked'} 
                        size={16} 
                        color={note.status === 'tamamlandı' ? '#4caf50' : '#ccc'} 
                      />
                      <Text style={[styles.noteStatusText, { 
                        color: note.status === 'tamamlandı' ? '#4caf50' : '#666' 
                      }]}>
                        {note.status === 'tamamlandı' ? 'Tamamlandı' : 'Aktif'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push({
                  pathname: '/add-note',
                  params: { preSelectedJobId: job.id }
                })}
              >
                <MaterialIcons name="note-add" size={24} color="#4caf50" />
                <Text style={styles.actionText}>Not Ekle</Text>
              </TouchableOpacity>
              
              {!isFullyPaid && (
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push({
                    pathname: '/add-payment',
                    params: { jobId: job.id }
                  })}
                >
                  <MaterialIcons name="payment" size={24} color="#ff9800" />
                  <Text style={styles.actionText}>Ödeme Ekle</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.bottomActionButton, styles.editButton]}
                onPress={() => setIsEditing(!isEditing)}
              >
                <MaterialIcons name="edit" size={24} color="white" />
                <Text style={styles.bottomActionButtonText}>Düzenle</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.bottomActionButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <MaterialIcons name="delete" size={24} color="white" />
                <Text style={styles.bottomActionButtonText}>Sil</Text>
              </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  customerCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#2196f3',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 12,
    color: '#666',
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
    marginBottom: 16,
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
  notesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  noteCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196f3',
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  noteContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  noteStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteStatusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
  // Form styles
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
  saveButton: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  bottomActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196f3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  bottomActionButtonText: {
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