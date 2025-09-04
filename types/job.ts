export interface Job {
  id: string;
  name: string;
  description: string;
  cost: number; // Malzeme gideri
  price: number; // Müşteriye kesilen ücret
  isPaid: boolean;
  estimatedPaymentDate?: string; // ISO date string
  paymentMethod: 'Elden' | 'IBAN';
  withFather: boolean; // Babam var mıydı
  createdAt: string; // ISO date string
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
}

export type TimeFilter = 'daily' | 'weekly' | 'monthly';