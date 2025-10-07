import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotes } from '@/hooks/useNotes';
import { useCustomers } from '@/hooks/useCustomers';
import { useJobs } from '@/hooks/useJobs';

export default function AddNotePage() {
  const insets = useSafeAreaInsets();
  const { addNote } = useNotes();
  const { customers } = useCustomers();
  const { jobs } = useJobs();

  const [formData, setFormData] = useState({
    content: '',
    customerId: '',
    jobId: '',
    category: 'genel' as 'malzeme' | 'ödeme' | 'hatırlatma' | 'genel',
  });

  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

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

  const handleSave = async () => {
    if (!formData.content.trim()) {
      showWebAlert('Uyarı', 'Lütfen not içeriğini girin.');
      return;
    }

    try {
      await addNote({
        content: formData.content,
        customerId: formData.customerId || undefined,
        jobId: formData.jobId || undefined,
        category: formData.category,
      });

      showWebAlert('Başarılı', 'Not başarıyla eklendi.', () => {
        router.back();
      });
    } catch (error: any) {
      showWebAlert('Hata', error.message || 'Not eklenirken bir hata oluştu.');
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const selectedJob = jobs.find(j => j.id === formData.jobId);
  const filteredJobs = formData.customerId 
    ? jobs.filter(j => j.customerId === formData.customerId)
    : jobs;

  const categories = [
    { key: 'genel', label: 'Genel', icon: 'note', color: '#2196f3' },
    { key: 'malzeme', label: 'Malzeme', icon: 'build', color: '#ff9800' },
    { key: 'ödeme', label: 'Ödeme', icon: 'payment', color: '#4caf50' },
    { key: 'hatırlatma', label: 'Hatırlatma', icon: 'notifications', color: '#f44336' },
  ];

  const selectedCategory = categories.find(c => c.key === formData.category);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Not İçeriği *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.content}
            onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
            placeholder="Not içeriğini yazın..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kategori</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setCategoryModalVisible(true)}
          >
            <MaterialIcons 
              name={selectedCategory?.icon as any} 
              size={20} 
              color={selectedCategory?.color} 
            />
            <Text style={styles.selectorButtonText}>{selectedCategory?.label}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Müşteri (İsteğe bağlı)</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setCustomerModalVisible(true)}
          >
            <MaterialIcons name="person" size={20} color="#666" />
            <Text style={styles.selectorButtonText}>
              {selectedCustomer ? selectedCustomer.name : 'Müşteri seç'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {formData.customerId && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>İş (İsteğe bağlı)</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setJobModalVisible(true)}
            >
              <MaterialIcons name="work" size={20} color="#666" />
              <Text style={styles.selectorButtonText}>
                {selectedJob ? selectedJob.name : 'İş seç'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <MaterialIcons name="note-add" size={24} color="white" />
          <Text style={styles.saveButtonText}>Notu Kaydet</Text>
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kategori Seç</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[styles.modalOption, formData.category === category.key && styles.selectedOption]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, category: category.key as any }));
                  setCategoryModalVisible(false);
                }}
              >
                <MaterialIcons name={category.icon as any} size={24} color={category.color} />
                <Text style={styles.modalOptionText}>{category.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Customer Modal */}
      <Modal visible={customerModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Müşteri Seç</Text>
            <TouchableOpacity
              style={[styles.modalOption, !formData.customerId && styles.selectedOption]}
              onPress={() => {
                setFormData(prev => ({ ...prev, customerId: '', jobId: '' }));
                setCustomerModalVisible(false);
              }}
            >
              <MaterialIcons name="clear" size={24} color="#666" />
              <Text style={styles.modalOptionText}>Müşteri yok</Text>
            </TouchableOpacity>
            {customers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={[styles.modalOption, formData.customerId === customer.id && styles.selectedOption]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, customerId: customer.id, jobId: '' }));
                  setCustomerModalVisible(false);
                }}
              >
                <MaterialIcons name="person" size={24} color="#2196f3" />
                <Text style={styles.modalOptionText}>{customer.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCustomerModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Job Modal */}
      <Modal visible={jobModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>İş Seç</Text>
            <TouchableOpacity
              style={[styles.modalOption, !formData.jobId && styles.selectedOption]}
              onPress={() => {
                setFormData(prev => ({ ...prev, jobId: '' }));
                setJobModalVisible(false);
              }}
            >
              <MaterialIcons name="clear" size={24} color="#666" />
              <Text style={styles.modalOptionText}>İş yok</Text>
            </TouchableOpacity>
            {filteredJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={[styles.modalOption, formData.jobId === job.id && styles.selectedOption]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, jobId: job.id }));
                  setJobModalVisible(false);
                }}
              >
                <MaterialIcons name="work" size={24} color="#ff9800" />
                <Text style={styles.modalOptionText}>{job.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setJobModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    height: 100,
    textAlignVertical: 'top',
  },
  selectorButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorButtonText: {
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
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
  },
  modalOptionText: {
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