import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJobs } from '@/hooks/useJobs';
import JobCard from '@/components/ui/JobCard';
import TimeFilterTabs from '@/components/ui/TimeFilterTabs';
import { Job } from '@/types/job';
import { SearchFilter } from '@/services/jobService';

type SortOrder = 'newest' | 'oldest';

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
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const clearAllFilters = () => {
    setSortOrder('newest');
    setSelectedDate(null);
    setSearchQuery('');
    setSearchFilter('all');
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  // Apply sorting and date filtering
  const getFilteredAndSortedJobs = () => {
    let filteredJobs = [...searchResults];

    // Apply date filter
    if (selectedDate) {
      const selectedDateStr = selectedDate.toDateString();
      filteredJobs = filteredJobs.filter(job => {
        const jobDate = new Date(job.createdAt);
        return jobDate.toDateString() === selectedDateStr;
      });
    }

    // Apply sorting
    filteredJobs.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filteredJobs;
  };

  const finalJobList = getFilteredAndSortedJobs();

  const renderJob = ({ item }: { item: Job }) => {
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
        {searchQuery || selectedDate ? 'Arama sonucu bulunamadı' : 'Henüz iş kaydı bulunmuyor'}
      </Text>
      {(searchQuery || selectedDate) && (
        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
          <Text style={styles.clearFiltersText}>Filtreleri Temizle</Text>
        </TouchableOpacity>
      )}
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

  const FiltersModal = () => (
    <Modal
      visible={filtersModalVisible}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtreler ve Sıralama</Text>
            <TouchableOpacity onPress={() => setFiltersModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Date Filter Section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Tarih Filtresi</Text>
            
            <TouchableOpacity
              style={styles.dateFilterButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color="#2196f3" />
              <Text style={styles.dateFilterText}>
                {selectedDate ? selectedDate.toLocaleDateString('tr-TR') : 'Tarih Seç'}
              </Text>
            </TouchableOpacity>

            {selectedDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setSelectedDate(null)}
              >
                <MaterialIcons name="clear" size={16} color="#f44336" />
                <Text style={styles.clearDateText}>Tarih Filtresini Temizle</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sort Section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sıralama</Text>
            
            <TouchableOpacity
              style={[styles.sortOption, sortOrder === 'newest' && styles.selectedSort]}
              onPress={() => setSortOrder('newest')}
            >
              <MaterialIcons name="arrow-downward" size={20} color={sortOrder === 'newest' ? '#2196f3' : '#666'} />
              <Text style={[styles.sortText, sortOrder === 'newest' && styles.selectedSortText]}>
                Yeni → Eski
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortOption, sortOrder === 'oldest' && styles.selectedSort]}
              onPress={() => setSortOrder('oldest')}
            >
              <MaterialIcons name="arrow-upward" size={20} color={sortOrder === 'oldest' ? '#2196f3' : '#666'} />
              <Text style={[styles.sortText, sortOrder === 'oldest' && styles.selectedSortText]}>
                Eski → Yeni
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={() => {
              clearAllFilters();
              setFiltersModalVisible(false);
            }}
          >
            <MaterialIcons name="clear-all" size={20} color="#f44336" />
            <Text style={styles.clearAllText}>Tüm Filtreleri Temizle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const hasActiveFilters = sortOrder !== 'newest' || selectedDate !== null;

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

        <TouchableOpacity
          style={[styles.sortButton, hasActiveFilters && styles.activeFiltersButton]}
          onPress={() => setFiltersModalVisible(true)}
        >
          <MaterialIcons name="sort" size={20} color={hasActiveFilters ? '#fff' : '#2196f3'} />
        </TouchableOpacity>
      </View>

      {/* Active Filters Info */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersInfo}>
          <Text style={styles.activeFiltersText}>
            Aktif filtreler: {sortOrder === 'oldest' && 'Eski→Yeni'} {selectedDate && `Tarih: ${selectedDate.toLocaleDateString('tr-TR')}`}
          </Text>
        </View>
      )}

      {/* Search Results Info */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            {finalJobList.length} sonuç bulundu
          </Text>
          <Text style={styles.searchFilterInfo}>
            Filtre: {getSearchFilterLabel()}
          </Text>
        </View>
      )}

      <FlatList
        data={finalJobList}
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

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <SearchFilterModal />
      <FiltersModal />

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
    gap: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 11,
    color: '#2196f3',
    fontWeight: '500',
  },
  sortButton: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFiltersButton: {
    backgroundColor: '#2196f3',
  },
  activeFiltersInfo: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#2e7d32',
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
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
    minWidth: 320,
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateFilterText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  clearDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
  },
  clearDateText: {
    fontSize: 12,
    color: '#f44336',
    marginLeft: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedSort: {
    backgroundColor: '#e3f2fd',
  },
  sortText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectedSortText: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  clearAllText: {
    fontSize: 14,
    color: '#f44336',
    marginLeft: 8,
    fontWeight: '500',
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