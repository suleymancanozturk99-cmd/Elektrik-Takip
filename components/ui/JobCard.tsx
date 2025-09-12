
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Job, JobUtils } from '@/types/job';
import { JobService } from '@/services/jobService';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  showPaymentStatus?: boolean;
}

export default function JobCard({ job, onPress, showPaymentStatus = false }: JobCardProps) {
  const totalPaid = JobUtils.getTotalPaid(job);
  const remainingBalance = JobUtils.getRemainingBalance(job);
  const isFullyPaid = JobUtils.isFullyPaid(job);
  const lastPaymentMethod = JobUtils.getLastPaymentMethod(job);

  const getCardColor = () => {
    if (!showPaymentStatus || isFullyPaid) return '#fff';
    if (JobService.isPaymentOverdue(job)) return '#ffebee'; // Kırmızı
    if (JobService.isPaymentDueSoon(job)) return '#fff8e1'; // Sarı
    return '#fff3e0'; // Turuncu
  };

  const getBorderColor = () => {
    if (!showPaymentStatus || isFullyPaid) return '#e0e0e0';
    if (JobService.isPaymentOverdue(job)) return '#f44336';
    if (JobService.isPaymentDueSoon(job)) return '#ff9800';
    return '#ffc107';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { 
        backgroundColor: getCardColor(),
        borderColor: getBorderColor(),
      }]} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.jobName}>{job.name}</Text>
        <View style={styles.statusContainer}>
          {job.withFather && (
            <MaterialIcons name="people" size={16} color="#2196f3" style={styles.statusIcon} />
          )}
          {lastPaymentMethod && (
            <MaterialIcons 
              name={lastPaymentMethod === 'Elden' ? 'account-balance-wallet' : 'account-balance'} 
              size={16} 
              color={isFullyPaid ? "#4caf50" : "#ff9800"} 
              style={styles.statusIcon}
            />
          )}
          <MaterialIcons 
            name={isFullyPaid ? "check-circle" : "schedule"} 
            size={16} 
            color={isFullyPaid ? "#4caf50" : "#ff9800"} 
          />
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {job.description || ''}
      </Text>
      
      <View style={styles.amounts}>
        <Text style={styles.price}>
          {formatCurrency(job.price)}
        </Text>
        <Text style={styles.cost}>
          {`Maliyet: ${formatCurrency(job.cost)}`}
        </Text>
      </View>

      {/* Payment Progress */}
      <View style={styles.paymentProgress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${job.price > 0 ? (totalPaid / job.price) * 100 : 0}%`,
                backgroundColor: isFullyPaid ? '#4caf50' : '#ff9800'
              }
            ]} 
          />
        </View>
        <Text style={styles.paymentText}>
          {isFullyPaid ? 
            'Tamamen Ödendi' : 
            `${formatCurrency(totalPaid)} / ${formatCurrency(job.price)}`
          }
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>
          {formatDate(job.createdAt)}
        </Text>
        <Text style={[styles.paymentStatus, { 
          color: isFullyPaid ? '#4caf50' : '#ff9800' 
        }]}>
          {isFullyPaid ? 'Tamamen Ödendi' : 
           totalPaid > 0 ? 'Kısmi Ödeme' : 'Ödeme Bekliyor'}
        </Text>
      </View>

      {showPaymentStatus && !isFullyPaid && job.estimatedPaymentDate && (
        <View style={styles.paymentDate}>
          <MaterialIcons name="schedule" size={14} color="#666" />
          <Text style={styles.paymentDateText}>
            {`Tahmini: ${formatDate(job.estimatedPaymentDate)}`}
          </Text>
        </View>
      )}

      {!isFullyPaid && remainingBalance > 0 && (
        <View style={styles.remainingBalance}>
          <Text style={styles.remainingText}>
            {`Kalan: ${formatCurrency(remainingBalance)}`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    card: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  cost: {
    fontSize: 14,
    color: '#ff9800',
  },
  paymentProgress: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  paymentText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  paymentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paymentDateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  remainingBalance: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f44336',
  },
});
