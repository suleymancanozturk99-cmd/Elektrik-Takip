import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useJobs } from '@/hooks/useJobs';

interface PaymentMethodCardProps {
  eldenAmount: number;
  ibanAmount: number;
}

export default function PaymentMethodCard({ eldenAmount, ibanAmount }: PaymentMethodCardProps) {
  const { jobs, timeFilter } = useJobs();
  const [withFatherFilter, setWithFatherFilter] = useState(false);
  
  // Recalculate payment methods with babam filter
  const filteredJobs = jobs.filter(job => {
    // Apply time filter
    const now = new Date();
    const jobDate = new Date(job.createdAt);
    
    let isInTimeRange = false;
    switch (timeFilter) {
      case 'daily':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const jobDay = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
        isInTimeRange = jobDay.getTime() === today.getTime();
        break;
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const jobDayWeek = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
        isInTimeRange = jobDayWeek >= weekStart && jobDayWeek <= today;
        break;
      case 'monthly':
        isInTimeRange = jobDate.getMonth() === now.getMonth() && 
                       jobDate.getFullYear() === now.getFullYear();
        break;
      default:
        isInTimeRange = true;
    }
    
    // Apply babam filter if enabled
    if (withFatherFilter) {
      return isInTimeRange && job.isPaid && job.withFather;
    }
    
    return isInTimeRange && job.isPaid;
  });
  
  const filteredEldenAmount = filteredJobs
    .filter(job => job.paymentMethod === 'Elden')
    .reduce((sum, job) => sum + job.price, 0);
  
  const filteredIbanAmount = filteredJobs
    .filter(job => job.paymentMethod === 'IBAN')  
    .reduce((sum, job) => sum + job.price, 0);
  
  const displayEldenAmount = withFatherFilter ? filteredEldenAmount : eldenAmount;
  const displayIbanAmount = withFatherFilter ? filteredIbanAmount : ibanAmount;
  const total = displayEldenAmount + displayIbanAmount;
  const eldenPercentage = total > 0 ? (displayEldenAmount / total) * 100 : 0;
  const ibanPercentage = total > 0 ? (displayIbanAmount / total) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="payment" size={24} color="#2196f3" />
        <Text style={styles.title}>Ödeme Yöntemleri</Text>
      </View>
      
      <View style={styles.fatherFilter}>
        <MaterialIcons name="people" size={20} color="#2196f3" />
        <Text style={styles.fatherFilterText}>Sadece Babamla Yapılanlar</Text>
        <Switch
          value={withFatherFilter}
          onValueChange={setWithFatherFilter}
          trackColor={{ false: '#767577', true: '#2196f3' }}
          thumbColor={withFatherFilter ? '#ffffff' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, styles.eldenFill, { width: `${eldenPercentage}%` }]} />
          <View style={[styles.progressFill, styles.ibanFill, { width: `${ibanPercentage}%` }]} />
        </View>
      </View>

      <View style={styles.breakdown}>
        <View style={styles.methodItem}>
          <View style={styles.methodHeader}>
            <View style={[styles.colorIndicator, { backgroundColor: '#4caf50' }]} />
            <MaterialIcons name="account-balance-wallet" size={16} color="#4caf50" />
            <Text style={styles.methodLabel}>Elden</Text>
          </View>
          <Text style={styles.methodAmount}>{formatCurrency(displayEldenAmount)}</Text>
          <Text style={styles.methodPercentage}>%{eldenPercentage.toFixed(1)}</Text>
        </View>

        <View style={styles.methodItem}>
          <View style={styles.methodHeader}>
            <View style={[styles.colorIndicator, { backgroundColor: '#ff9800' }]} />
            <MaterialIcons name="account-balance" size={16} color="#ff9800" />
            <Text style={styles.methodLabel}>IBAN</Text>
          </View>
          <Text style={styles.methodAmount}>{formatCurrency(displayIbanAmount)}</Text>
          <Text style={styles.methodPercentage}>%{ibanPercentage.toFixed(1)}</Text>
        </View>
      </View>
      
      <View style={styles.total}>
        <Text style={styles.totalLabel}>Toplam:</Text>
        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
  },
  eldenFill: {
    backgroundColor: '#4caf50',
  },
  ibanFill: {
    backgroundColor: '#ff9800',
  },
  breakdown: {
    marginBottom: 16,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  methodLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  methodAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  methodPercentage: {
    fontSize: 12,
    color: '#999',
    minWidth: 40,
    textAlign: 'right',
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  fatherFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  fatherFilterText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
});