import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
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
    if (job && job.id) {
      router.push({
        pathname: '/job-detail',
        params: { jobId: job.id }
      });
    }
  };

  const handleAddJob = () => {
    router.push('/add-job');
  };

  const renderJob = ({ item }: { item: Job }) => {
    // Validate item completely
    if (!item || typeof item !== 'object' || !item.id || !item.name) {
      return <View style={{ height: 0 }} />;
    }
    
    return (
      <View>
        <JobCard 
          job={item} 
          onPress={() => handleJobPress(item)}
        />
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        Henüz iş kaydı bulunmuyor
      </Text>
    </View>
  );

  // Filter and validate jobs array
  const validJobs = React.useMemo(() => {
    if (!Array.isArray(filteredJobs)) {
      return [];
    }
    
    return filteredJobs.filter(job => {
      return job && 
             typeof job === 'object' && 
             job.id && 
             typeof job.id === 'string' &&
             job.name &&
             typeof job.name === 'string';
    });
  }, [filteredJobs]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TimeFilterTabs 
        activeFilter={timeFilter} 
        onFilterChange={setTimeFilter}
      />

      <FlatList
        data={validJobs}
        renderItem={renderJob}
        keyExtractor={(item, index) => {
          if (item && item.id && typeof item.id === 'string') {
            return item.id;
          }
          return `job-fallback-${index}`;
        }}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshJobs} />
        }
        ListEmptyComponent={renderEmptyComponent}
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
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