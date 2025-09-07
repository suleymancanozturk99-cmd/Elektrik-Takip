import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job, JobStats, TimeFilter, Payment, JobUtils } from '@/types/job';

const JOBS_STORAGE_KEY = 'electrician_jobs';

export class JobService {
  static async getAllJobs(): Promise<Job[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
      const jobs = jsonValue != null ? JSON.parse(jsonValue) : [];
      
      // Migrate old format jobs to new payment system
      return jobs.map((job: Job) => JobUtils.migrateJob(job));
    } catch (error) {
      console.error('Error loading jobs:', error);
      return [];
    }
  }

  static async saveJob(job: Job): Promise<void> {
    try {
      const jobs = await this.getAllJobs();
      const existingIndex = jobs.findIndex(j => j.id === job.id);
      
      // Ensure job is properly formatted
      const migratedJob = JobUtils.migrateJob(job);
      
      if (existingIndex >= 0) {
        jobs[existingIndex] = migratedJob;
      } else {
        jobs.push(migratedJob);
      }
      
      await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch (error) {
      console.error('Error saving job:', error);
      throw error;
    }
  }

  static async addPayment(jobId: string, payment: Payment): Promise<void> {
    try {
      const jobs = await this.getAllJobs();
      const jobIndex = jobs.findIndex(j => j.id === jobId);
      
      if (jobIndex === -1) {
        throw new Error('Job not found');
      }
      
      const job = jobs[jobIndex];
      if (!job.payments) {
        job.payments = [];
      }
      
      job.payments.push(payment);
      
      // Remove estimated payment date if job is fully paid
      if (JobUtils.isFullyPaid(job)) {
        job.estimatedPaymentDate = undefined;
      }
      
      await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  }

  static async deleteJob(jobId: string): Promise<void> {
    try {
      const jobs = await this.getAllJobs();
      const filteredJobs = jobs.filter(job => job.id !== jobId);
      await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(filteredJobs));
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  static async importJobs(jobs: Job[]): Promise<void> {
    try {
      const migratedJobs = jobs.map(job => JobUtils.migrateJob(job));
      await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(migratedJobs));
    } catch (error) {
      console.error('Error importing jobs:', error);
      throw error;
    }
  }

  static async exportJobs(): Promise<Job[]> {
    try {
      return await this.getAllJobs();
    } catch (error) {
      console.error('Error exporting jobs:', error);
      throw error;
    }
  }

  static filterJobsByTime(jobs: Job[], filter: TimeFilter): Job[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return jobs.filter(job => {
      const jobDate = new Date(job.createdAt);
      const jobDay = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
      
      switch (filter) {
        case 'daily':
          return jobDay.getTime() === today.getTime();
        case 'weekly':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return jobDay >= weekStart && jobDay <= today;
        case 'monthly':
          return jobDate.getMonth() === now.getMonth() && 
                 jobDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }

  static calculateStats(jobs: Job[]): JobStats {
    const fullyPaidJobs = jobs.filter(job => JobUtils.isFullyPaid(job));
    const withFatherPaidJobs = fullyPaidJobs.filter(job => job.withFather);
    const withoutFatherPaidJobs = fullyPaidJobs.filter(job => !job.withFather);
    
    // Calculate totals from all payments
    const allPayments = jobs.flatMap(job => job.payments || []);
    const eldenPayments = allPayments.filter(p => p.paymentMethod === 'Elden');
    const ibanPayments = allPayments.filter(p => p.paymentMethod === 'IBAN');
    
    // Calculate payments by father presence
    const withFatherPayments = jobs
      .filter(job => job.withFather)
      .flatMap(job => job.payments || []);
    
    const withoutFatherPayments = jobs
      .filter(job => !job.withFather)
      .flatMap(job => job.payments || []);
    
    return {
      totalRevenue: allPayments.reduce((sum, payment) => sum + payment.amount, 0),
      totalCost: jobs.reduce((sum, job) => sum + job.cost, 0),
      completedJobs: fullyPaidJobs.length,
      pendingPayments: jobs.filter(job => !JobUtils.isFullyPaid(job)).length,
      revenueWithFather: withFatherPayments.reduce((sum, payment) => sum + payment.amount, 0),
      revenueWithoutFather: withoutFatherPayments.reduce((sum, payment) => sum + payment.amount, 0),
      paymentMethods: {
        elden: eldenPayments.reduce((sum, payment) => sum + payment.amount, 0),
        iban: ibanPayments.reduce((sum, payment) => sum + payment.amount, 0),
      },
      withFatherPayments: {
        elden: withFatherPayments.filter(p => p.paymentMethod === 'Elden').reduce((sum, p) => sum + p.amount, 0),
        iban: withFatherPayments.filter(p => p.paymentMethod === 'IBAN').reduce((sum, p) => sum + p.amount, 0),
      },
      withoutFatherPayments: {
        elden: withoutFatherPayments.filter(p => p.paymentMethod === 'Elden').reduce((sum, p) => sum + p.amount, 0),
        iban: withoutFatherPayments.filter(p => p.paymentMethod === 'IBAN').reduce((sum, p) => sum + p.amount, 0),
      },
    };
  }

  static getPendingPaymentJobs(jobs: Job[]): Job[] {
    const partiallyPaidJobs = jobs.filter(job => !JobUtils.isFullyPaid(job));
    
    return partiallyPaidJobs.sort((a, b) => {
      if (!a.estimatedPaymentDate) return 1;
      if (!b.estimatedPaymentDate) return -1;
      return new Date(a.estimatedPaymentDate).getTime() - new Date(b.estimatedPaymentDate).getTime();
    });
  }

  static isPaymentOverdue(job: Job): boolean {
    if (!job.estimatedPaymentDate || JobUtils.isFullyPaid(job)) return false;
    const today = new Date();
    const paymentDate = new Date(job.estimatedPaymentDate);
    return paymentDate < today;
  }

  static isPaymentDueSoon(job: Job): boolean {
    if (!job.estimatedPaymentDate || JobUtils.isFullyPaid(job)) return false;
    const today = new Date();
    const paymentDate = new Date(job.estimatedPaymentDate);
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }
}