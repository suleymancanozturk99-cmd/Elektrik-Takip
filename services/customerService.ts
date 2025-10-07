import { Customer, CustomerWithStats, CustomerUtils } from '@/types/customer';
import { Job } from '@/types/job';

export class CustomerService {
  static searchCustomers(customers: Customer[], searchQuery: string): Customer[] {
    if (!searchQuery.trim()) {
      return customers;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.address?.toLowerCase().includes(query) ||
      customer.notes?.toLowerCase().includes(query)
    );
  }

  static getCustomerWithStats(customer: Customer, jobs: Job[]): CustomerWithStats {
    const customerJobs = jobs.filter(job => job.customerId === customer.id);
    
    const totalRevenue = customerJobs.reduce((sum, job) => {
      const paidAmount = job.payments?.reduce((paidSum, payment) => paidSum + payment.amount, 0) || 0;
      return sum + paidAmount;
    }, 0);

    const pendingPayments = customerJobs.filter(job => {
      const paidAmount = job.payments?.reduce((paidSum, payment) => paidSum + payment.amount, 0) || 0;
      return paidAmount < job.price;
    }).length;

    const lastJob = customerJobs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      ...customer,
      totalJobs: customerJobs.length,
      totalRevenue,
      pendingPayments,
      lastJobDate: lastJob?.createdAt
    };
  }

  static getTopCustomers(customers: Customer[], jobs: Job[], limit: number = 5): CustomerWithStats[] {
    const customersWithStats = customers.map(customer => 
      this.getCustomerWithStats(customer, jobs)
    );

    return customersWithStats
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  static validateCustomer(customer: Partial<Customer>): string | null {
    if (!customer.name?.trim()) {
      return 'Müşteri adı gereklidir';
    }

    if (!customer.phone?.trim()) {
      return 'Telefon numarası gereklidir';
    }

    if (!CustomerUtils.validatePhone(customer.phone)) {
      return 'Geçerli bir telefon numarası girin';
    }

    return null;
  }

  static isDuplicateCustomer(customers: Customer[], name: string, phone: string, excludeId?: string): boolean {
    const normalizedName = name.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, '');

    return customers.some(customer => {
      if (excludeId && customer.id === excludeId) {
        return false;
      }

      const customerNormalizedName = customer.name.trim().toLowerCase();
      const customerNormalizedPhone = customer.phone.replace(/\D/g, '');

      return customerNormalizedName === normalizedName || customerNormalizedPhone === normalizedPhone;
    });
  }
}