import React, { useState } from 'react';
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
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJobs } from '@/hooks/useJobs';
import { useCustomers } from '@/hooks/useCustomers';

export default function AddJobPage() {
  const insets = useSafeAreaInsets();
  const { addJob } = useJobs();
  const { customers } = useCustomers();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: '',
    price: '',
    hasInitialPayment: false,
    initialPaymentAmount: '',
    estimatedPaymentDate: new Date(),
    paymentMethod: 'Elden' as 'Elden' | 'IBAN',
    withFather: false,
    customerId: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);

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
    if (!formData.name.trim() || !formData.price || !formData.cost) {
      showWebAlert('Uyarı', 'Lütfen gerekli alanları doldurunuz.');
      return;
    }

    if (formData.hasInitialPayment && !formData.initialPaymentAmount) {
      showWebAlert('Uyarı', 'Lütfen ödenen miktarı giriniz.');
      return;
    }

    const initialPaymentAmount = parseFloat(formData.initialPaymentAmount) || 0;
    const totalPrice = parseFloat(formData.price) || 0;

    if (formData.hasInitialPayment && initialPaymentAmount > totalPrice) {
      showWebAlert('Uyarı', 'Ödeme miktarı toplam ücretden fazla olamaz.');
      return;
    }

    try {
      const jobData = {
        name: formData.name,
        description: formData.description,
        cost: parseFloat(formData.cost) || 0,
        price: totalPrice,
        withFather: formData.withFather,
        customerId: formData.customerId || undefined,
        estimatedPaymentDate: !formData.hasInitialPayment ? formData.estimatedPaymentDate.toISOString() : undefined,
        initialPayment: formData.hasInitialPayment && initialPaymentAmount > 0 ? {
          amount: initialPaymentAmount,
          paymentMethod: formData.paymentMethod
        } : undefined,
      };

      await addJob(jobData);

      showWebAlert('Başarılı', 'İş başarıyla eklendi.', () => {
        router.back();
      });
    } catch (error) {
      showWebAlert('Hata', 'İş eklenirken bir hata oluştu.');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, estimatedPaymentDate: selectedDate }));
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

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

  const CustomerModal = () => (
    <Modal
      visible={customerModalVisible}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Müşteri Seç</Text>
            <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addCustomerButton}
            onPress={() => {
              setCustomerModalVisible(false);
              router.push('/add-customer');
            }}
          >
            <MaterialIcons name="person-add" size={20} color="#2196f3" />
            <Text style={styles.addCustomerText}>Yeni Müşteri Ekle</Text>
          </TouchableOpacity>

          <ScrollView style={styles.customerList}>
            <TouchableOpacity
              style={[styles.customerOption, !formData.customerId && styles.selectedCustomer]}
              onPress={() => {
                setFormData(prev => ({ ...prev, customerId: '' }));
                setCustomerModalVisible(false);
              }}
            >
              <MaterialIcons name="clear" size={24} color="#666" />
              <Text style={styles.customerOptionText}>Müşteri yok</Text>
            </TouchableOpacity>

            {customers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={[styles.customerOption, formData.customerId === customer.id && styles.selectedCustomer]}
                onPress={() => {
                  setFormData(prev => ({ ...prev, customerId: customer.id }));
                  setCustomerModalVisible(false);
                }}
              >
                <MaterialIcons name="person" size={24} color="#2196f3" />
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerPhone}>{customer.phone}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Müşteri (İsteğe bağlı)</Text>
          <TouchableOpacity
            style={styles.customerButton}
            onPress={() => setCustomerModalVisible(true)}
          >
            <MaterialIcons name="person" size={20} color="#666" />
            <Text style={styles.customerButtonText}>
              {selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.phone}` : 'Müşteri seç'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>İş Adı *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Örn: Apartman elektrik tesisatı"
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
          <Text style={styles.label}>İlk ödeme alındı mı?</Text>
          <Switch
            value={formData.hasInitialPayment}
            onValueChange={(value) => {
              setFormData(prev => ({ 
                ...prev, 
                hasInitialPayment: value,
                initialPaymentAmount: value ? prev.price : '',
                estimatedPaymentDate: !value ? new Date() : prev.estimatedPaymentDate
              }));
            }}
            trackColor={{ false: '#767577', true: '#4caf50' }}
            thumbColor={formData.hasInitialPayment ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        {formData.hasInitialPayment && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ödenen Miktar *</Text>
              <TextInput
                style={styles.input}
                value={formData.initialPaymentAmount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, initialPaymentAmount: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

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
          </>
        )}

        {!formData.hasInitialPayment && (
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
          <Text style={styles.saveButtonText}>İşi Kaydet</Text>
        </TouchableOpacity>
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
      <CustomerModal />

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
  customerButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerButtonText: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  addCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addCustomerText: {
    fontSize: 16,
    color: '#2196f3',
    marginLeft: 8,
    fontWeight: '500',
  },
  customerList: {
    maxHeight: 300,
  },
  customerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCustomer: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  customerOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  customerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
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