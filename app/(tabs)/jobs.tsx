import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/ui/JobCard';
import TimeFilterTabs from '@/components/ui/TimeFilterTabs';
import { Job } from '@/types/job';

export default function JobsPage() {
  const insets = useSafeAreaInsets();
    const { filteredJobs, timeFilter, setTimeFilter, loading, refreshJobs } = useJobs();

  const handleJobPress = (job: Job) => {
    router.push({
      pathname: '/job-detail',
      params: { jobId: job.id }
    });
  };

  const handleAddJob = () => {
    router.push('/add-job');
  };

    const renderJob = ({ item }: { item: Job }) => {
    if (!item || !item.id) {
      return null;
    }
    return (
      <JobCard 
        job={item} 
        onPress={() => handleJobPress(item)}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>      <TimeFilterTabs 
        activeFilter={timeFilter} 
        onFilterChange={setTimeFilter}
      />

      <FlatList
        data={filteredJobs || []}
        renderItem={renderJob}
        keyExtractor={(item, index) => item?.id || `job-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshJobs} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Henüz iş kaydı bulunmuyor</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddJob}>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    paddingBottom: 100,
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
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});