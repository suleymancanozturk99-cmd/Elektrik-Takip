import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl, TouchableOpacity, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/ui/JobCard';
import { Job } from '@/types/job';

export default function PendingPaymentsPage() {
  const insets = useSafeAreaInsets();
  const { pendingPaymentJobs, loading, refreshJobs } = useJobs();

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
      // Alert is not used since we don't need it for navigation
    }
  };

  const handleJobPress = (job: Job) => {
    router.push({
      pathname: '/job-detail',
      params: { jobId: job.id }
    });
  };

  const handleAddPayment = (job: Job) => {
    router.push({
      pathname: '/add-payment',
      params: { jobId: job.id }
    });
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
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.completePaymentButton}
            onPress={() => handleAddPayment(item)}
            activeOpacity={0.7}
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
    marginBottom: 16,
  },
  buttonRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  completePaymentButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  completePaymentText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
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