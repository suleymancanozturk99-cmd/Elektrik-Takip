import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCustomers } from '@/hooks/useCustomers';
import { useJobs } from '@/hooks/useJobs';
import { useNotes } from '@/hooks/useNotes';
import JobCard from '@/components/ui/JobCard';
import { Customer } from '@/types/customer';

export default function CustomerDetailPage() {
  const insets = useSafeAreaInsets();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { getCustomerById, getCustomerWithStats } = useCustomers();
  const { jobs } = useJobs();
  const { getCustomerNotes } = useNotes();

  const [customer, setCustomer] = useState<Customer | null>(null);

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
    if (customerId) {
      const foundCustomer = getCustomerById(customerId);
      setCustomer(foundCustomer || null);
    }
  }, [customerId, getCustomerById]);

  if (!customer) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Müşteri bulunamadı.</Text>
      </View>
    );
  }

  const customerWithStats = getCustomerWithStats(customer.id, jobs);
  const customerJobs = jobs.filter(job => job.customerId === customer.id);
  const customerNotes = getCustomerNotes(customer.id);

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const handleJobPress = (job: any) => {
    router.push({
      pathname: '/job-detail',
      params: { jobId: job.id }
    });
  };

  const handleAddJob = () => {
    router.push({
      pathname: '/add-job',
      params: { preSelectedCustomerId: customer.id }
    });
  };

  const handleAddNote = () => {
    router.push({
      pathname: '/add-note',
      params: { preSelectedCustomerId: customer.id }
    });
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Customer Info Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <MaterialIcons name="person" size={48} color="#2196f3" />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerPhone}>{customer.phone}</Text>
              {customer.address && (
                <Text style={styles.customerAddress}>{customer.address}</Text>
              )}
            </View>
          </View>
          
          {customer.notes && (
            <View style={styles.customerNotes}>
              <Text style={styles.notesTitle}>Notlar:</Text>
              <Text style={styles.notesContent}>{customer.notes}</Text>
            </View>
          )}
        </View>

        {/* Stats Card */}
        {customerWithStats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>İstatistikler</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{customerWithStats.totalJobs}</Text>
                <Text style={styles.statLabel}>Toplam İş</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#4caf50' }]}>
                  {formatCurrency(customerWithStats.totalRevenue)}
                </Text>
                <Text style={styles.statLabel}>Toplam Gelir</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#ff9800' }]}>
                  {customerWithStats.pendingPayments}
                </Text>
                <Text style={styles.statLabel}>Bekleyen Ödeme</Text>
              </View>
            </View>
            {customerWithStats.lastJobDate && (
              <Text style={styles.lastJobDate}>
                Son İş: {formatDate(customerWithStats.lastJobDate)}
              </Text>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddJob}>
            <MaterialIcons name="work" size={24} color="#2196f3" />
            <Text style={styles.actionButtonText}>Yeni İş Ekle</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleAddNote}>
            <MaterialIcons name="note-add" size={24} color="#4caf50" />
            <Text style={styles.actionButtonText}>Not Ekle</Text>
          </TouchableOpacity>
        </View>

        {/* Jobs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İşler ({customerJobs.length})</Text>
          {customerJobs.length > 0 ? (
            customerJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => handleJobPress(job)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="work-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Henüz iş kaydı bulunmuyor</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddJob}>
                <Text style={styles.addButtonText}>İlk İşi Ekle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notlar ({customerNotes.length})</Text>
          {customerNotes.length > 0 ? (
            customerNotes.map((note) => (
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
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="note" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Henüz not bulunmuyor</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
                <Text style={styles.addButtonText}>İlk Notu Ekle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

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
    padding: 16,
  },
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 16,
    color: '#2196f3',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#666',
  },
  customerNotes: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  lastJobDate: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
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