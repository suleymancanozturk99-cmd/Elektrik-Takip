import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TimeFilter } from '@/types/job';

interface TimeFilterTabsProps {
  activeFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
  withFatherFilter: boolean;
  onWithFatherFilterChange: (value: boolean) => void;
}
export default function TimeFilterTabs({ 
  activeFilter, 
  onFilterChange, 
  withFatherFilter, 
  onWithFatherFilterChange 
}: TimeFilterTabsProps) {
  const filters = [
    { key: 'daily' as TimeFilter, label: 'Günlük' },
    { key: 'weekly' as TimeFilter, label: 'Haftalık' },
    { key: 'monthly' as TimeFilter, label: 'Aylık' },
  ];
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.tab,
              activeFilter === filter.key && styles.activeTab,
            ]}
            onPress={() => onFilterChange(filter.key)}
          >
            <Text style={[
              styles.tabText,
              activeFilter === filter.key && styles.activeTabText,
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.fatherFilter}>
        <MaterialIcons name="people" size={20} color="#2196f3" />
        <Text style={styles.fatherFilterText}>Sadece Babamla Yapılanlar</Text>
        <Switch
          value={withFatherFilter}
          onValueChange={onWithFatherFilterChange}
          trackColor={{ false: '#767577', true: '#2196f3' }}
          thumbColor={withFatherFilter ? '#ffffff' : '#f4f3f4'}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2196f3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },  activeTabText: {
    color: 'white',
  },
  fatherFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fatherFilterText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginRight: 12,
    flex: 1,
  },
});