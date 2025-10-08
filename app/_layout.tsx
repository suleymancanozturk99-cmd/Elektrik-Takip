import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { JobProvider } from '@/contexts/JobContext';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { NoteProvider } from '@/contexts/NoteContext';
import AuthGuard from '@/components/AuthGuard';

export default function RootLayout() {
  return (
    <AuthProvider>
      <JobProvider>
        <CustomerProvider>
          <NoteProvider>
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="add-job" options={{ headerShown: true, title: 'Yeni İş Ekle' }} />
                <Stack.Screen name="job-detail" options={{ headerShown: true, title: 'İş Detayı' }} />
                <Stack.Screen name="add-payment" options={{ headerShown: true, title: 'Ödeme Ekle' }} />
                <Stack.Screen name="add-customer" options={{ headerShown: true, title: 'Müşteri Ekle' }} />
                <Stack.Screen name="customer-detail" options={{ headerShown: true, title: 'Müşteri Detayı' }} />
                <Stack.Screen name="add-note" options={{ headerShown: true, title: 'Not Ekle' }} />
              </Stack>
            </AuthGuard>
          </NoteProvider>
        </CustomerProvider>
      </JobProvider>
    </AuthProvider>
  );
}