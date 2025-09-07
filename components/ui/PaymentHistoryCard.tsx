import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Payment } from '@/types/job';

interface PaymentHistoryCardProps {
  payments: Payment[];
  totalAmount: number;
}

export default function PaymentHistoryCard({ payments, totalAmount }: PaymentHistoryCardProps) {
  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = totalAmount - totalPaid;

  const renderPayment = ({ item, index }: { item: Payment; index: number }) => (
    <View style={styles.paymentItem}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <MaterialIcons 
            name={item.paymentMethod === 'Elden' ? 'account-balance-wallet' : 'account-balance'} 
            size={20} 
            color={item.paymentMethod === 'Elden' ? '#4caf50' : '#2196f3'} 
          />
          <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
        </View>
        <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
      </View>
      <Text style={styles.paymentDate}>{formatDate(item.paymentDate)}</Text>
    </View>
  );

  if (!payments || payments.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Ödeme Geçmişi</Text>
        <View style={styles.emptyState}>
          <MaterialIcons name="payment" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Henüz ödeme yapılmamış</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ödeme Geçmişi</Text>
      
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Toplam Tutar:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ödenen:</Text>
          <Text style={[styles.summaryValue, { color: '#4caf50' }]}>{formatCurrency(totalPaid)}</Text>
        </View>
        {remaining > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kalan:</Text>
            <Text style={[styles.summaryValue, { color: '#f44336' }]}>{formatCurrency(remaining)}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summary: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentItem: {
    paddingVertical: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  paymentDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 28,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
});