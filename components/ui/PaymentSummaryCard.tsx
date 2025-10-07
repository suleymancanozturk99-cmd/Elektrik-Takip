import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PaymentSummaryCardProps {
  paymentStats: any;
  timeFilterLabel: string;
}

export default function PaymentSummaryCard({ paymentStats, timeFilterLabel }: PaymentSummaryCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const renderPaymentDetail = ({ item }: { item: any }) => (
    <View style={styles.detailItem}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailJobName}>{item.jobName}</Text>
        <Text style={styles.detailAmount}>{formatCurrency(item.amount)}</Text>
      </View>
      <View style={styles.detailInfo}>
        <View style={styles.detailRow}>
          <MaterialIcons 
            name={item.paymentMethod === 'Elden' ? 'account-balance-wallet' : 'account-balance'} 
            size={16} 
            color={item.paymentMethod === 'Elden' ? '#4caf50' : '#2196f3'} 
          />
          <Text style={styles.detailText}>{item.paymentMethod}</Text>
        </View>
        <Text style={styles.detailDate}>{formatDate(item.paymentDate)}</Text>
      </View>
      {item.withFather && (
        <View style={styles.detailBadge}>
          <MaterialIcons name="people" size={14} color="#2196f3" />
          <Text style={styles.detailBadgeText}>Babamla</Text>
        </View>
      )}
      {item.isOldJob && (
        <View style={[styles.detailBadge, { backgroundColor: '#fff3e0' }]}>
          <MaterialIcons name="history" size={14} color="#f57c00" />
          <Text style={[styles.detailBadgeText, { color: '#f57c00' }]}>Geçmiş İş</Text>
        </View>
      )}
    </View>
  );

  if (paymentStats.totalReceived === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyHeader}>
          <MaterialIcons name="payments" size={24} color="#ccc" />
          <Text style={styles.title}>Alınan Paralar Özeti</Text>
        </View>
        <Text style={styles.emptyText}>
          {timeFilterLabel} tarih aralığında ödeme bulunmuyor.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="payments" size={24} color="#4caf50" />
        <Text style={styles.title}>Alınan Paralar Özeti</Text>
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>
          {timeFilterLabel} toplam {formatCurrency(paymentStats.totalReceived)} ödeme alındı.
        </Text>
        <Text style={styles.paymentCount}>
          {paymentStats.paymentCount} ödeme işlemi
        </Text>
      </View>

      <View style={styles.breakdown}>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <MaterialIcons name="account-balance-wallet" size={16} color="#4caf50" />
            <Text style={styles.breakdownLabel}>Elden:</Text>
          </View>
          <Text style={styles.breakdownValue}>
            {formatCurrency(paymentStats.eldenAmount)}
          </Text>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <MaterialIcons name="account-balance" size={16} color="#2196f3" />
            <Text style={styles.breakdownLabel}>IBAN:</Text>
          </View>
          <Text style={styles.breakdownValue}>
            {formatCurrency(paymentStats.ibanAmount)}
          </Text>
        </View>

        {paymentStats.oldJobsAmount > 0 && (
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <MaterialIcons name="history" size={16} color="#f57c00" />
              <Text style={styles.breakdownLabel}>Geçmiş işler:</Text>
            </View>
            <Text style={styles.breakdownValue}>
              {formatCurrency(paymentStats.oldJobsAmount)}
            </Text>
          </View>
        )}

        {paymentStats.withFatherAmount > 0 && (
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <MaterialIcons name="people" size={16} color="#a855f7" />
              <Text style={styles.breakdownLabel}>Babamla yapılan işler:</Text>
            </View>
            <Text style={styles.breakdownValue}>
              {formatCurrency(paymentStats.withFatherAmount)}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.detailsButton}
        onPress={() => setShowDetails(true)}
      >
        <Text style={styles.detailsButtonText}>Detayları Gör</Text>
        <MaterialIcons name="chevron-right" size={20} color="#2196f3" />
      </TouchableOpacity>

      {/* Payment Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {timeFilterLabel} Ödeme Detayları
            </Text>
            <TouchableOpacity 
              onPress={() => setShowDetails(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={paymentStats.paymentDetails}
            renderItem={renderPaymentDetail}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  totalSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 4,
  },
  paymentCount: {
    fontSize: 12,
    color: '#666',
  },
  breakdown: {
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '500',
    marginRight: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    padding: 16,
  },
  detailItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailJobName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  detailAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  detailInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  detailDate: {
    fontSize: 12,
    color: '#999',
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  detailBadgeText: {
    fontSize: 12,
    color: '#2196f3',
    marginLeft: 4,
  },
  separator: {
    height: 12,
  },
});