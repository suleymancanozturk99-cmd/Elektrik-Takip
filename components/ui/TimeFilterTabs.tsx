import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TimeFilter } from '@/types/job';

interface TimeFilterTabsProps {
  activeFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

export default function TimeFilterTabs({ 
  activeFilter, 
  onFilterChange
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
      

    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
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

});