import React from 'react';
import { View, StyleSheet, FlatList, Text, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/ui/JobCard';
import { Job } from '@/types/job';

export default function PendingPaymentsPage() {
  const insets = useSafeAreaInsets();
  const { pendingPaymentJobs, loading, refreshJobs } = useJobs();

  const handleJobPress = (job: Job) => {
    router.push({
      pathname: '/job-detail',
      params: { jobId: job.id }
    });
  };

  const renderJob = ({ item }: { item: Job }) => (
    <JobCard 
      job={item} 
      onPress={() => handleJobPress(item)}
      showPaymentStatus={true}
    />
  );

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
});