import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotes } from '@/hooks/useNotes';
import { useCustomers } from '@/hooks/useCustomers';
import { useJobs } from '@/hooks/useJobs';
import { Note, NoteUtils } from '@/types/note';
import { NoteFilter, NoteCategory } from '@/services/noteService';

export default function NotesPage() {
  const insets = useSafeAreaInsets();
  const { 
    searchResults, 
    loading, 
    refreshNotes,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    toggleNoteStatus,
    getNotesWithRelations
  } = useNotes();
  const { customers } = useCustomers();
  const { jobs } = useJobs();

  const [filtersVisible, setFiltersVisible] = useState(false);

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

  const handleAddNote = () => {
    router.push('/add-note');
  };

  const handleToggleStatus = async (noteId: string) => {
    try {
      await toggleNoteStatus(noteId);
    } catch (error) {
      showWebAlert('Hata', 'Not durumu güncellenirken bir hata oluştu.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const notesWithRelations = getNotesWithRelations(customers, jobs);

  const renderNote = ({ item }: { item: Note }) => {
    const noteWithRelation = notesWithRelations.find(n => n.id === item.id);
    const categoryColor = NoteUtils.getCategoryColor(item.category);
    const isCompleted = item.status === 'tamamlandı';

    return (
      <View style={[styles.noteCard, isCompleted && styles.completedCard]}>
        <View style={styles.noteHeader}>
          <View style={[styles.categoryIndicator, { backgroundColor: categoryColor }]} />
          <View style={styles.noteInfo}>
            <Text style={styles.categoryText}>{item.category || 'genel'}</Text>
            <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleToggleStatus(item.id)}
            style={styles.statusButton}
          >
            <MaterialIcons 
              name={isCompleted ? 'check-circle' : 'radio-button-unchecked'} 
              size={24} 
              color={isCompleted ? '#4caf50' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.noteContent, isCompleted && styles.completedText]}>
          {item.content}
        </Text>

        {(noteWithRelation?.customerName || noteWithRelation?.jobName) && (
          <View style={styles.relationsContainer}>
            {noteWithRelation?.customerName && (
              <View style={styles.relationTag}>
                <MaterialIcons name="person" size={14} color="#2196f3" />
                <Text style={styles.relationText}>{noteWithRelation.customerName}</Text>
              </View>
            )}
            {noteWithRelation?.jobName && (
              <View style={styles.relationTag}>
                <MaterialIcons name="work" size={14} color="#ff9800" />
                <Text style={styles.relationText}>{noteWithRelation.jobName}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="note" size={64} color="#ccc" />
      <Text style={styles.emptyText}>
        {searchQuery ? 'Not bulunamadı' : 'Henüz not kaydı bulunmuyor'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
          <Text style={styles.addButtonText}>İlk Notu Ekle</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const FiltersModal = () => (
    <Modal
      visible={filtersVisible}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtreler</Text>
            <TouchableOpacity onPress={() => setFiltersVisible(false)}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Durum</Text>
            {(['all', 'aktif', 'tamamlandı'] as NoteFilter[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterOption, statusFilter === filter && styles.selectedFilter]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text style={[styles.filterText, statusFilter === filter && styles.selectedFilterText]}>
                  {filter === 'all' ? 'Tümü' : filter === 'aktif' ? 'Aktif' : 'Tamamlandı'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Kategori</Text>
            {(['all', 'malzeme', 'ödeme', 'hatırlatma', 'genel'] as NoteCategory[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterOption, categoryFilter === filter && styles.selectedFilter]}
                onPress={() => setCategoryFilter(filter)}
              >
                <Text style={[styles.filterText, categoryFilter === filter && styles.selectedFilterText]}>
                  {filter === 'all' ? 'Tümü' : filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Not ara..."
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
          onPress={() => setFiltersVisible(true)}
        >
          <MaterialIcons name="filter-list" size={20} color="#2196f3" />
        </TouchableOpacity>
      </View>

      {/* Active Filters Info */}
      {(statusFilter !== 'all' || categoryFilter !== 'all') && (
        <View style={styles.activeFiltersInfo}>
          <Text style={styles.activeFiltersText}>
            Aktif filtreler: {statusFilter !== 'all' && statusFilter} {categoryFilter !== 'all' && categoryFilter}
          </Text>
        </View>
      )}

      {/* Search Results Info */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            {searchResults.length} not bulundu
          </Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshNotes} />
        }
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddNote}>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>

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
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  listContainer: {
    paddingBottom: 100,
  },
  noteCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  noteInfo: {
    flex: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: 11,
    color: '#999',
  },
  statusButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  relationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  filterOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedFilter: {
    backgroundColor: '#e3f2fd',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  selectedFilterText: {
    color: '#2196f3',
    fontWeight: 'bold',
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