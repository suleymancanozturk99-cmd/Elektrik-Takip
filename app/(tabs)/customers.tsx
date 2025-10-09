import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCustomers } from '@/hooks/useCustomers';
import { useJobs } from '@/hooks/useJobs';
import { Customer } from '@/types/customer';

export default function CustomersPage() {
  const insets = useSafeAreaInsets();
  const { 
    searchResults, 
    loading, 
    refreshCustomers,
    searchQuery,
    setSearchQuery,
    getCustomerWithStats,
    deleteCustomer
  } = useCustomers();
  const { jobs } = useJobs();

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
    }
  };

  const handleCustomerPress = (customer: Customer) => {
    if (customer && customer.id) {
      router.push({
        pathname: '/customer-detail',
        params: { customerId: customer.id }
      });
    }
  };

  const handleAddCustomer = () => {
    router.push('/add-customer');
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      showWebAlert('Başarılı', 'Müşteri başarıyla silindi.');
    } catch (error) {
      showWebAlert('Hata', 'Müşteri silinirken bir hata oluştu.');
    }
  };

  const confirmDeleteCustomer = (customer: Customer) => {
    const customerJobs = jobs.filter(job => job.customerId === customer.id);
    const message = customerJobs.length > 0 
      ? `${customer.name} müşterisini silmek istediğinizden emin misiniz?\n\nBu müşteriye ait ${customerJobs.length} iş kaydı da silinecek.`
      : `${customer.name} müşterisini silmek istediğinizden emin misiniz?`;
    
    showWebAlert('Müşteriyi Sil', message, () => handleDeleteCustomer(customer.id));
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  };

  const renderCustomer = ({ item }: { item: Customer }) => {
    const customerWithStats = getCustomerWithStats(item.id, jobs);
    if (!customerWithStats) return null;

    return (
      <View style={styles.customerCardContainer}>
        <TouchableOpacity 
          style={styles.customerCard} 
          onPress={() => handleCustomerPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.customerHeader}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.customerPhone}>{item.phone}</Text>
              {item.address && (
                <Text style={styles.customerAddress} numberOfLines={1}>{item.address}</Text>
              )}
            </View>
            <View style={styles.customerStats}>
              <Text style={styles.statValue}>{customerWithStats.totalJobs}</Text>
              <Text style={styles.statLabel}>İş</Text>
            </View>
          </View>

          <View style={styles.customerFooter}>
            <View style={styles.revenueInfo}>
              <MaterialIcons name="account-balance-wallet" size={16} color="#4caf50" />
              <Text style={styles.revenueText}>
                {formatCurrency(customerWithStats.totalRevenue)}
              </Text>
            </View>
            
            {customerWithStats.pendingPayments > 0 && (
              <View style={styles.pendingInfo}>
                <MaterialIcons name="schedule" size={16} color="#ff9800" />
                <Text style={styles.pendingText}>
                  {customerWithStats.pendingPayments} bekleyen
                </Text>
              </View>
            )}

            {customerWithStats.lastJobDate && (
              <Text style={styles.lastJobDate}>
                Son iş: {new Date(customerWithStats.lastJobDate).toLocaleDateString('tr-TR')}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeleteCustomer(item)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>
        {searchQuery ? 'Müşteri bulunamadı' : 'Henüz müşteri kaydı bulunmuyor'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomer}>
          <Text style={styles.addButtonText}>İlk Müşteriyi Ekle</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Müşteri ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <MaterialIcons name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results Info */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            {searchResults.length} müşteri bulundu
          </Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshCustomers} />
        }
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddCustomer}>
        <MaterialIcons name="person-add" size={24} color="white" />
      </TouchableOpacity>

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
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  searchResultsInfo: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchResultsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e65100',
  },
  listContainer: {
    paddingBottom: 100,
  },
  customerCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  customerCard: {
    flex: 1,
    backgroundColor: 'white',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
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
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 12,
    color: '#999',
  },
  customerStats: {
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  statLabel: {
    fontSize: 12,
    color: '#2196f3',
  },
  customerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  revenueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
    marginLeft: 4,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 12,
    color: '#ff9800',
    marginLeft: 4,
  },
  lastJobDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196f3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
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