export interface Payment {
  id: string;
  amount: number;
  paymentMethod: 'Elden' | 'IBAN';
  paymentDate: string; // ISO date string
}

export interface Job {
  id: string;
  name: string;
  description: string;
  cost: number; // Malzeme gideri
  price: number; // Müşteriye kesilen toplam ücret
  payments: Payment[]; // Yapılan ödemeler listesi
  estimatedPaymentDate?: string; // ISO date string - sadece tam ödenmemiş işler için
  withFather: boolean; // Babam var mıydı
  createdAt: string; // ISO date string
  
  // Backward compatibility - deprecated fields
  isPaid?: boolean; // Will be calculated from payments
  paymentMethod?: 'Elden' | 'IBAN'; // Will be derived from last payment
}

export interface JobStats {
  totalRevenue: number;
  totalCost: number;
  completedJobs: number;
  pendingPayments: number;
  revenueWithFather: number;
  revenueWithoutFather: number;
  paymentMethods: {
    elden: number;
    iban: number;
  };
  withFatherPayments: {
    elden: number;
    iban: number;
  };
  withoutFatherPayments: {
    elden: number;
    iban: number;
  };
}

export type TimeFilter = 'daily' | 'weekly' | 'monthly';

// Helper functions for payment calculations
export const JobUtils = {
  getTotalPaid: (job: Job): number => {
    return job.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  },
  
  getRemainingBalance: (job: Job): number => {
    return job.price - JobUtils.getTotalPaid(job);
  },
  
  isFullyPaid: (job: Job): boolean => {
    return JobUtils.getRemainingBalance(job) <= 0;
  },
  
  getLastPaymentMethod: (job: Job): 'Elden' | 'IBAN' | null => {
    if (!job.payments || job.payments.length === 0) return null;
    return job.payments[job.payments.length - 1].paymentMethod;
  },
  
  // Migration helper for old format jobs
  migrateJob: (job: Job): Job => {
    if (job.payments && job.payments.length > 0) {
      return job; // Already migrated
    }
    
    const payments: Payment[] = [];
    
    // If old format job was marked as paid, create a payment entry
    if (job.isPaid && job.paymentMethod) {
      payments.push({
        id: `${job.id}_initial`,
        amount: job.price,
        paymentMethod: job.paymentMethod,
        paymentDate: job.createdAt
      });
    }
    
    return {
      ...job,
      payments,
      // Remove deprecated fields from active use
      isPaid: undefined,
      paymentMethod: undefined
    };
  }
};