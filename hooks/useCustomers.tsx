import { useContext } from 'react';
import { CustomerContext } from '@/contexts/CustomerContext';

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within CustomerProvider');
  }
  return context;
}