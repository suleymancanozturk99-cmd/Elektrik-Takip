import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/ui/JobCard';
import TimeFilterTabs from '@/components/ui/TimeFilterTabs';
import { Job } from '@/types/job';
import { SearchFilter } from '@/services/jobService';

export default function JobsPage() {
  const insets = useSafeAreaInsets();
  const { 
    searchResults, 
    timeFilter, 
    setTimeFilter, 
    loading, 
    refreshJobs,
    searchQuery,
    setSearchQuery,
    searchFilter,
    setSearchFilter,
    searchResultCount
  } = useJobs();

  const [searchFilterModalVisible, setSearchFilterModalVisible] = useState(false);

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
      // No alert needed for navigation
    }
  };

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
        {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz iş kaydı bulunmuyor'}
      </Text>
    </View>
  );

  const getSearchFilterLabel = () => {
    switch (searchFilter) {
      case 'name': return 'İş Adı';
      case 'description': return 'Açıklama';
      case 'all': return 'Tümü';
      default: return 'Tümü';
    }
  };

  const SearchFilterModal = () => (
    <Modal
      visible={searchFilterModalVisible}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Arama Filtresi</Text>
          
          <TouchableOpacity
            style={[styles.filterOption, searchFilter === 'all' && styles.selectedFilter]}
            onPress={() => {
              setSearchFilter('all');
              setSearchFilterModalVisible(false);
            }}
          >
            <MaterialIcons name="search" size={24} color={searchFilter === 'all' ? '#2196f3' : '#666'} />
            <Text style={[styles.filterText, searchFilter === 'all' && styles.selectedFilterText]}>
              Tümü (İsim + Açıklama)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterOption, searchFilter === 'name' && styles.selectedFilter]}
            onPress={() => {
              setSearchFilter('name');
              setSearchFilterModalVisible(false);
            }}
          >
            <MaterialIcons name="work" size={24} color={searchFilter === 'name' ? '#2196f3' : '#666'} />
            <Text style={[styles.filterText, searchFilter === 'name' && styles.selectedFilterText]}>
              Sadece İş Adı
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterOption, searchFilter === 'description' && styles.selectedFilter]}
            onPress={() => {
              setSearchFilter('description');
              setSearchFilterModalVisible(false);
            }}
          >
            <MaterialIcons name="description" size={24} color={searchFilter === 'description' ? '#2196f3' : '#666'} />
            <Text style={[styles.filterText, searchFilter === 'description' && styles.selectedFilterText]}>
              Sadece Açıklama
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setSearchFilterModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Filter and validate jobs array
  const validJobs = React.useMemo(() => {
    if (!Array.isArray(searchResults)) {
      return [];
    }
    
    return searchResults.filter(job => {
      return job && 
             typeof job === 'object' && 
             job.id && 
             typeof job.id === 'string' &&
             job.name &&
             typeof job.name === 'string';
    });
  }, [searchResults]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TimeFilterTabs 
        activeFilter={timeFilter} 
        onFilterChange={setTimeFilter}
      />

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="İş ara..."
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

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setSearchFilterModalVisible(true)}
        >
          <MaterialIcons name="filter-list" size={20} color="#2196f3" />
          <Text style={styles.filterButtonText}>{getSearchFilterLabel()}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Results Info */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            {searchResultCount} sonuç bulundu
          </Text>
          <Text style={styles.searchFilterInfo}>
            Filtre: {getSearchFilterLabel()}
          </Text>
        </View>
      )}

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

      <SearchFilterModal />

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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#2196f3',
    fontWeight: '500',
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
  searchFilterInfo: {
    fontSize: 12,
    color: '#f57c00',
    marginTop: 2,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilter: {
    borderColor: '#2196f3',
    backgroundColor: '#e3f2fd',
  },
  filterText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectedFilterText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
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