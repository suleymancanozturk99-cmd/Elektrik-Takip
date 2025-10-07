import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { Customer, CustomerWithStats, CustomerUtils } from '@/types/customer';
import { CustomerService } from '@/services/customerService';
import { FirebaseCustomerService } from '@/services/firebaseCustomerService';
import { useAuth } from '@/hooks/useAuth';

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  searchQuery: string;
  searchResults: Customer[];
  setSearchQuery: (query: string) => void;
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  getCustomerById: (customerId: string) => Customer | undefined;
  getCustomerWithStats: (customerId: string, jobs: any[]) => CustomerWithStats | undefined;
  refreshCustomers: () => Promise<void>;
}

export const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, isAuthenticated } = useAuth();

  // Firebase real-time listener - only when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    // Set user email for Firebase operations
    FirebaseCustomerService.setUserEmail(user.email);

    const unsubscribe = FirebaseCustomerService.subscribeToCustomers((firebaseCustomers) => {
      setCustomers(firebaseCustomers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated, user]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const validationError = CustomerService.validateCustomer(customerData);
    if (validationError) {
      throw new Error(validationError);
    }

    const isDuplicate = CustomerService.isDuplicateCustomer(customers, customerData.name, customerData.phone);
    if (isDuplicate) {
      throw new Error('Bu isim veya telefon numarası ile bir müşteri zaten kayıtlı');
    }

    const newCustomer: Customer = {
      ...CustomerUtils.createCustomer(customerData.name, customerData.phone, customerData.address, customerData.notes),
      id: Date.now().toString(),
    };

    await FirebaseCustomerService.saveCustomer(newCustomer);
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    const validationError = CustomerService.validateCustomer(updatedCustomer);
    if (validationError) {
      throw new Error(validationError);
    }

    const isDuplicate = CustomerService.isDuplicateCustomer(
      customers, 
      updatedCustomer.name, 
      updatedCustomer.phone, 
      updatedCustomer.id
    );
    if (isDuplicate) {
      throw new Error('Bu isim veya telefon numarası ile başka bir müşteri zaten kayıtlı');
    }

    const customerToUpdate = {
      ...updatedCustomer,
      phone: CustomerUtils.formatPhone(updatedCustomer.phone),
      updatedAt: new Date().toISOString(),
    };

    await FirebaseCustomerService.saveCustomer(customerToUpdate);
  };

  const deleteCustomer = async (customerId: string) => {
    await FirebaseCustomerService.deleteCustomer(customerId);
  };

  const getCustomerById = (customerId: string): Customer | undefined => {
    return customers.find(customer => customer.id === customerId);
  };

  const getCustomerWithStats = (customerId: string, jobs: any[]): CustomerWithStats | undefined => {
    const customer = getCustomerById(customerId);
    if (!customer) return undefined;
    return CustomerService.getCustomerWithStats(customer, jobs);
  };

  const refreshCustomers = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  // Search functionality
  const searchResults = CustomerService.searchCustomers(customers, searchQuery);

  return (
    <CustomerContext.Provider value={{
      customers,
      loading,
      searchQuery,
      searchResults,
      setSearchQuery,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      getCustomerById,
      getCustomerWithStats,
      refreshCustomers,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}