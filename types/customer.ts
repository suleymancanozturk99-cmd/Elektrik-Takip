export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithStats extends Customer {
  totalJobs: number;
  totalRevenue: number;
  pendingPayments: number;
  lastJobDate?: string;
}

export const CustomerUtils = {
  formatPhone: (phone: string): string => {
    // Format phone number consistently
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }
    return phone;
  },

  validatePhone: (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },

  createCustomer: (name: string, phone: string, address?: string, notes?: string): Omit<Customer, 'id'> => {
    return {
      name: name.trim(),
      phone: CustomerUtils.formatPhone(phone),
      address: address?.trim(),
      notes: notes?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
};