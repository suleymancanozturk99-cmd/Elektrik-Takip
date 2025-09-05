import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJobs } from '@/hooks/useJobs';
import StatsCard from '@/components/ui/StatsCard';
import TimeFilterTabs from '@/components/ui/TimeFilterTabs';
import PaymentMethodCard from '@/components/ui/PaymentMethodCard';
export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { stats, timeFilter, setTimeFilter, loading, refreshJobs } = useJobs();

  const formatCurrency = (amount: number) => {
    return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  };

  const getFilterTitle = () => {
    switch (timeFilter) {
      case 'daily': return 'Günlük';
      case 'weekly': return 'Haftalık';
      case 'monthly': return 'Aylık';
      default: return 'Aylık';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshJobs} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
        <Text style={styles.subtitleText}>{getFilterTitle()} Performans Özeti</Text>
      </View>
            <TimeFilterTabs 
        activeFilter={timeFilter} 
        onFilterChange={setTimeFilter}
      />

            <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatsCard
            title="Toplam Ciro"
            value={formatCurrency(stats.totalRevenue)}
            icon="account-balance-wallet"
            color="#4caf50"
          />
          <StatsCard
            title="Malzeme Gideri"
            value={formatCurrency(stats.totalCost)}
            icon="shopping-cart"
            color="#ff9800"
          />
        </View>

        <View style={styles.statsRow}>
          <StatsCard
            title="Tamamlanan İşler"
            value={stats.completedJobs.toString()}
            icon="check-circle"
            color="#2196f3"
          />
          <StatsCard
            title="Bekleyen Ödemeler"
            value={stats.pendingPayments.toString()}
            icon="schedule"
            color="#f44336"
          />
        </View>

                <View style={styles.statsRow}>
          <StatsCard
            title="Babamla Yapılan"
            value={formatCurrency(stats.revenueWithFather)}
            subtitle={`Elden: ${formatCurrency(stats.withFatherPayments.elden)} | IBAN: ${formatCurrency(stats.withFatherPayments.iban)}`}
            icon="people"
            color="#9c27b0"
          />
          <StatsCard
            title="Tek Başıma"
            value={formatCurrency(stats.revenueWithoutFather)}
            subtitle={`Elden: ${formatCurrency(stats.withoutFatherPayments.elden)} | IBAN: ${formatCurrency(stats.withoutFatherPayments.iban)}`}
            icon="person"
            color="#607d8b"
          />
        </View>
      </View>

      <PaymentMethodCard 
        eldenAmount={stats.paymentMethods.elden}
        ibanAmount={stats.paymentMethods.iban}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Özet</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net Kar:</Text>
          <Text style={[styles.summaryValue, { color: stats.totalRevenue - stats.totalCost >= 0 ? '#4caf50' : '#f44336' }]}>
            {formatCurrency(stats.totalRevenue - stats.totalCost)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Kar Marjı:</Text>
          <Text style={styles.summaryValue}>
            {stats.totalRevenue > 0 ? `%${(((stats.totalRevenue - stats.totalCost) / stats.totalRevenue) * 100).toFixed(1)}` : `%0`}
          </Text>
        </View>
        
        <View style={styles.detailBreakdown}>
          <Text style={styles.breakdownTitle}>Detaylı Özet</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Babamla Yapılan İşler:</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(stats.revenueWithFather)}</Text>
          </View>
          <View style={styles.breakdownSubRow}>
            <Text style={styles.breakdownSubLabel}>• Elden: {formatCurrency(stats.withFatherPayments.elden)}</Text>
            <Text style={styles.breakdownSubLabel}>• IBAN: {formatCurrency(stats.withFatherPayments.iban)}</Text>
          </View>
          
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Tek Başıma Yapılan İşler:</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(stats.revenueWithoutFather)}</Text>
          </View>
          <View style={styles.breakdownSubRow}>
            <Text style={styles.breakdownSubLabel}>• Elden: {formatCurrency(stats.withoutFatherPayments.elden)}</Text>
            <Text style={styles.breakdownSubLabel}>• IBAN: {formatCurrency(stats.withoutFatherPayments.iban)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
  statsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summary: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  detailBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  breakdownSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingLeft: 16,
  },
  breakdownSubLabel: {
    fontSize: 12,
    color: '#999',
  },
});