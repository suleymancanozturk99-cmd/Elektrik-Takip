
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface MetricCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBackgroundColor: string;
  subtitle?: string;
}

export default function MetricCard({ 
  title, 
  value, 
  icon, 
  iconColor, 
  iconBackgroundColor,
  subtitle 
}: MetricCardProps) {
  // Dynamic font size based on value length
  const getDynamicFontSize = (text: string) => {
    const length = text.length;
    if (length <= 4) return 24;      // ₺100
    if (length <= 6) return 22;      // ₺1.000
    if (length <= 8) return 20;      // ₺10.000
    if (length <= 10) return 18;     // ₺100.000
    return 16;                       // ₺1.000.000+
  };

  const dynamicFontSize = getDynamicFontSize(value);

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>
      
      <Text style={[styles.value, { fontSize: dynamicFontSize }]}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
});
