import { 
  ref, 
  push, 
  set, 
  get, 
  remove, 
  update,
  onValue,
  off
} from 'firebase/database';
import { database } from './firebase';
import { Customer, CustomerUtils } from '@/types/customer';

export class FirebaseCustomerService {
  private static userEmail: string = '';
  
  static setUserEmail(email: string) {
    this.userEmail = email.replace(/\./g, '_');
  }

  private static getUserCustomersRef() {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }
    return ref(database, `users/${this.userEmail}/customers`);
  }

  private static getCustomerRef(customerId: string) {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }
    return ref(database, `users/${this.userEmail}/customers/${customerId}`);
  }

  private static cleanData(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanData(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.cleanData(obj[key]);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  static async saveCustomer(customer: Customer): Promise<void> {
    try {
      const customerRef = this.getCustomerRef(customer.id);
      const cleanCustomerData = this.cleanData({
        ...customer,
        updatedAt: new Date().toISOString()
      });
      
      await set(customerRef, cleanCustomerData);
    } catch (error) {
      console.error('Error saving customer to Firebase:', error);
      throw error;
    }
  }

  static async getAllCustomers(): Promise<Customer[]> {
    try {
      const customersRef = this.getUserCustomersRef();
      const snapshot = await get(customersRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const customersData = snapshot.val();
      const customers: Customer[] = [];
      
      Object.keys(customersData).forEach((customerId) => {
        const customerData = customersData[customerId];
        customers.push({
          ...customerData,
          id: customerId,
        });
      });
      
      return customers.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
    } catch (error) {
      console.error('Error getting customers from Firebase:', error);
      return [];
    }
  }

  static async deleteCustomer(customerId: string): Promise<void> {
    try {
      const customerRef = this.getCustomerRef(customerId);
      await remove(customerRef);
    } catch (error) {
      console.error('Error deleting customer from Firebase:', error);
      throw error;
    }
  }

  static subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    const customersRef = this.getUserCustomersRef();
    
    const unsubscribe = onValue(customersRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const customersData = snapshot.val();
      const customers: Customer[] = [];
      
      Object.keys(customersData).forEach((customerId) => {
        const customerData = customersData[customerId];
        customers.push({
          ...customerData,
          id: customerId,
        });
      });
      
      const sortedCustomers = customers.sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
      callback(sortedCustomers);
    });
    
    return () => off(customersRef, 'value', unsubscribe);
  }
}