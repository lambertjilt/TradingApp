import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trading Dashboard</Text>
        <Text style={styles.subtitle}>Welcome to your trading dashboard</Text>
      </View>
      
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Portfolio Value</Text>
          <Text style={styles.cardValue}>$10,000</Text>
          <Text style={styles.cardSubtitle}>+2.5% today</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Cash</Text>
          <Text style={[styles.cardValue, { color: '#2563eb' }]}>$5,000</Text>
          <Text style={styles.cardSubtitle}>50% of portfolio</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Holdings</Text>
          <Text style={[styles.cardValue, { color: '#9333ea' }]}>5</Text>
          <Text style={styles.cardSubtitle}>Different stocks</Text>
        </View>
      </View>
    </ScrollView>
  );
}
