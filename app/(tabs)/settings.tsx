import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useJobs } from '@/hooks/useJobs';

export default function SettingsPage() {
  const insets = useSafeAreaInsets();
    const { jobs, importJobs, loading, manualBackup, getCurrentDeviceId, importJobsFromDevice } = useJobs();
  const { user, logout } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [deviceImportLoading, setDeviceImportLoading] = useState(false);
  const [sourceEmail, setSourceEmail] = useState('');

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

  const handleManualBackup = async () => {
    try {
      setBackupLoading(true);
      await manualBackup();
      showWebAlert('Başarılı', 'Veriler Firebase\'e yedeklendi.');
    } catch (error) {
      console.error('Backup error:', error);
      showWebAlert('Hata', 'Yedekleme sırasında hata oluştu.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImportFromUser = async () => {
    if (!sourceEmail.trim()) {
      showWebAlert('Uyarı', 'Lütfen kaynak email adresini girin.');
      return;
    }

    try {
      setDeviceImportLoading(true);
      await importJobsFromDevice(sourceEmail.trim());
      showWebAlert('Başarılı', 'Veriler başarıyla aktarıldı.');
      setSourceEmail('');
    } catch (error) {
      console.error('User import error:', error);
      showWebAlert('Hata', 'Veri aktarımında hata oluştu. Email adresini kontrol edin.');
    } finally {
      setDeviceImportLoading(false);
    }
  };

  const handleLogout = () => {
    showWebAlert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      async () => {
        try {
          await logout();
          showWebAlert('Başarılı', 'Çıkış yapıldı.');
        } catch (error) {
          showWebAlert('Hata', 'Çıkış yapılırken bir hata oluştu.');
        }
      }
    );
  };

  const exportToJSON = async () => {
    try {
      setExportLoading(true);
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        jobs: jobs,
        totalJobs: jobs.length
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `elektrikci_yedek_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.json`;

      if (Platform.OS === 'web') {
        // Web için download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showWebAlert('Başarılı', 'Veriler başarıyla indirildi.');
      } else {
        // Mobile için file system
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          showWebAlert('Başarılı', `Veriler kaydedildi: ${fileName}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      showWebAlert('Hata', 'Veri dışa aktarırken hata oluştu.');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      setExportLoading(true);
      
      const csvHeader = 'İş Adı,Açıklama,Malzeme Gideri,Müşteri Ücreti,Ödeme Durumu,Ödeme Yöntemi,Babam Vardı,İş Tarihi,Tahmini Ödeme Tarihi\n';
      
      const csvRows = jobs.map(job => {
        const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR');
        return [
          `"${job.name.replace(/"/g, '""')}"`,
          `"${job.description.replace(/"/g, '""')}"`,
          job.cost,
          job.price,
          job.isPaid ? 'Ödendi' : 'Bekliyor',
          job.paymentMethod,
          job.withFather ? 'Evet' : 'Hayır',
          formatDate(job.createdAt),
          job.estimatedPaymentDate ? formatDate(job.estimatedPaymentDate) : ''
        ].join(',');
      }).join('\n');

      const csvContent = csvHeader + csvRows;
      const fileName = `elektrikci_rapor_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.csv`;

      if (Platform.OS === 'web') {
        // Web için download
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showWebAlert('Başarılı', 'CSV raporu başarıyla indirildi.');
      } else {
        // Mobile için file system
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          showWebAlert('Başarılı', `CSV raporu kaydedildi: ${fileName}`);
        }
      }
    } catch (error) {
      console.error('CSV Export error:', error);
      showWebAlert('Hata', 'CSV dışa aktarırken hata oluştu.');
    } finally {
      setExportLoading(false);
    }
  };

  const importFromFile = async () => {
    try {
      setImportLoading(true);
      
      if (Platform.OS === 'web') {
        // Web için file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const text = await file.text();
            await processImportData(text);
          }
        };
        input.click();
      } else {
        // Mobile için document picker
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/json'],
          copyToCacheDirectory: true
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
          await processImportData(fileContent);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      showWebAlert('Hata', 'Dosya içe aktarılırken hata oluştu.');
    } finally {
      setImportLoading(false);
    }
  };

  const processImportData = async (jsonContent: string) => {
    try {
      const importData = JSON.parse(jsonContent);
      
      // Veri validasyonu
      if (!importData.jobs || !Array.isArray(importData.jobs)) {
        showWebAlert('Hata', 'Geçersiz dosya formatı.');
        return;
      }

      // İş verilerini validate et
      const validJobs = importData.jobs.filter((job: any) => 
        job.id && job.name && typeof job.cost === 'number' && typeof job.price === 'number'
      );

      if (validJobs.length === 0) {
        showWebAlert('Hata', 'Dosyada geçerli iş verisi bulunamadı.');
        return;
      }

      // Onay al
      showWebAlert(
        'Veri İçe Aktarma',
        `${validJobs.length} iş kaydı bulundu. Mevcut veriler üzerine yazılacak. Devam etmek istiyor musunuz?`,
        async () => {
          try {
            await importJobs(validJobs);
            showWebAlert('Başarılı', `${validJobs.length} iş kaydı başarıyla içe aktarıldı.`);
          } catch (error) {
            showWebAlert('Hata', 'Veriler içe aktarılırken hata oluştu.');
          }
        }
      );
    } catch (error) {
      showWebAlert('Hata', 'Dosya formatı geçersiz. Lütfen geçerli bir JSON dosyası seçin.');
    }
  };

  const currentUserEmail = getCurrentDeviceId();

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Firebase Backup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Firebase Yedekleme</Text>
          <Text style={styles.sectionDescription}>
            Verileriniz otomatik olarak Firebase'e kaydediliyor
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.firebaseButton]}
            onPress={handleManualBackup}
            disabled={backupLoading}
          >
            <MaterialIcons name="cloud-upload" size={24} color="#ff5722" />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Firebase'e Manuel Yedekle</Text>
              <Text style={styles.buttonSubtitle}>
                Tüm veriler • Anlık yedekleme
              </Text>
            </View>
            {backupLoading && <MaterialIcons name="refresh" size={20} color="#666" />}
          </TouchableOpacity>
        </View>

        {/* User Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Kullanıcı Yönetimi</Text>
          <Text style={styles.sectionDescription}>
            Mevcut kullanıcı ve diğer kullanıcılardan veri aktarımı
          </Text>

          <View style={styles.deviceIdContainer}>
            <MaterialIcons name="email" size={20} color="#2196f3" />
            <View style={styles.deviceIdContent}>
              <Text style={styles.deviceIdLabel}>Mevcut Email:</Text>
              <Text style={styles.deviceIdValue}>{currentUserEmail}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Başka Kullanıcıdan Veri Aktar:</Text>
            <TextInput
              style={styles.deviceIdInput}
              value={sourceEmail}
              onChangeText={setSourceEmail}
              placeholder="Kaynak email adresini girin"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.importDeviceButton, !sourceEmail.trim() && styles.disabledButton]}
              onPress={handleImportFromUser}
              disabled={deviceImportLoading || !sourceEmail.trim()}
            >
              <MaterialIcons name="get-app" size={20} color="white" />
              <Text style={styles.importDeviceButtonText}>Veri Aktar</Text>
              {deviceImportLoading && <MaterialIcons name="refresh" size={16} color="white" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="white" />
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* Local Backup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Yerel Yedekleme</Text>
          <Text style={styles.sectionDescription}>
            İş verilerinizi yerel dosya olarak kaydedin
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={exportToJSON}
            disabled={exportLoading}
          >
            <MaterialIcons name="cloud-download" size={24} color="#2196f3" />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>JSON Olarak Dışa Aktar</Text>
              <Text style={styles.buttonSubtitle}>
                Tüm veriler • Yedekleme için önerilen
              </Text>
            </View>
            {exportLoading && <MaterialIcons name="refresh" size={20} color="#666" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={exportToCSV}
            disabled={exportLoading}
          >
            <MaterialIcons name="table-chart" size={24} color="#4caf50" />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>CSV Olarak Dışa Aktar</Text>
              <Text style={styles.buttonSubtitle}>
                Excel uyumlu • Rapor için uygun
              </Text>
            </View>
            {exportLoading && <MaterialIcons name="refresh" size={20} color="#666" />}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📂 Veri Geri Yükleme</Text>
          <Text style={styles.sectionDescription}>
            Daha önce yedeklediğiniz verileri geri yükleyin
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, styles.importButton]}
            onPress={importFromFile}
            disabled={importLoading}
          >
            <MaterialIcons name="cloud-upload" size={24} color="#ff9800" />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Dosyadan İçe Aktar</Text>
              <Text style={styles.buttonSubtitle}>
                JSON dosyası seçin • Mevcut veriler silinir
              </Text>
            </View>
            {importLoading && <MaterialIcons name="refresh" size={20} color="#666" />}
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Veri İstatistikleri</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="work" size={32} color="#2196f3" />
              <Text style={styles.statValue}>{jobs.length}</Text>
              <Text style={styles.statLabel}>Toplam İş</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="check-circle" size={32} color="#4caf50" />
              <Text style={styles.statValue}>
                {jobs.filter(job => job.isPaid).length}
              </Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="schedule" size={32} color="#ff9800" />
              <Text style={styles.statValue}>
                {jobs.filter(job => !job.isPaid).length}
              </Text>
              <Text style={styles.statLabel}>Bekleyen</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <MaterialIcons name="info" size={20} color="#ff5722" />
          <Text style={styles.infoText}>
            🔥 Firebase entegrasyonu aktif. Verileriniz bulutta güvende saklanıyor ve anlık olarak senkronize ediliyor.
          </Text>
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
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
  },
  firebaseButton: {
    borderColor: '#ff5722',
    backgroundColor: '#fff3e0',
  },
  importButton: {
    borderColor: '#ff9800',
    backgroundColor: '#fff8f0',
  },
  buttonContent: {
    flex: 1,
    marginLeft: 12,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  deviceIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 16,
  },
  deviceIdContent: {
    marginLeft: 12,
    flex: 1,
  },
  deviceIdLabel: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 2,
  },
  deviceIdValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d47a1',
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  deviceIdInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  importDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  importDeviceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#e65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
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
    maxWidth: 320,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
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