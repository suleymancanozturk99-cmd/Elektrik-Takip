import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { JobProvider } from '@/contexts/JobContext';
import AuthGuard from '@/components/AuthGuard';

export default function RootLayout() {
  return (
    <AuthProvider>
      <JobProvider>
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="add-job" options={{ headerShown: true, title: 'Yeni İş Ekle' }} />
            <Stack.Screen name="job-detail" options={{ headerShown: true, title: 'İş Detayı' }} />
            <Stack.Screen name="add-payment" options={{ headerShown: true, title: 'Ödeme Ekle' }} />
          </Stack>
        </AuthGuard>
      </JobProvider>
    </AuthProvider>
  );
}