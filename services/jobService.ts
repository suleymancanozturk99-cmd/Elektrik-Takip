import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job, JobStats, TimeFilter } from '@/types/job';

const JOBS_STORAGE_KEY = 'electrician_jobs';

export class JobService {
  static async getAllJobs(): Promise<Job[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(JOBS_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading jobs:', error);
      return [];
    }
  }

  static async saveJob(job: Job): Promise<void> {
    try {
      const jobs = await this.getAllJobs();
      const existingIndex = jobs.findIndex(j => j.id === job.id);
      
      if (existingIndex >= 0) {
        jobs[existingIndex] = job;
      } else {
        jobs.push(job);
      }
      
      await AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch (error) {
      console.error('Error saving job:', error);
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
    const paidJobs = jobs.filter(job => job.isPaid);
    
    return {
      totalRevenue: paidJobs.reduce((sum, job) => sum + job.price, 0),
      totalCost: jobs.reduce((sum, job) => sum + job.cost, 0),
      completedJobs: paidJobs.length,
      pendingPayments: jobs.filter(job => !job.isPaid).length,
      revenueWithFather: paidJobs.filter(job => job.withFather).reduce((sum, job) => sum + job.price, 0),
      revenueWithoutFather: paidJobs.filter(job => !job.withFather).reduce((sum, job) => sum + job.price, 0),
      paymentMethods: {
        elden: paidJobs.filter(job => job.paymentMethod === 'Elden').reduce((sum, job) => sum + job.price, 0),
        iban: paidJobs.filter(job => job.paymentMethod === 'IBAN').reduce((sum, job) => sum + job.price, 0),
      },
    };
  }

  static getPendingPaymentJobs(jobs: Job[]): Job[] {
    const unpaidJobs = jobs.filter(job => !job.isPaid);
    
    return unpaidJobs.sort((a, b) => {
      if (!a.estimatedPaymentDate) return 1;
      if (!b.estimatedPaymentDate) return -1;
      return new Date(a.estimatedPaymentDate).getTime() - new Date(b.estimatedPaymentDate).getTime();
    });
  }

  static isPaymentOverdue(job: Job): boolean {
    if (!job.estimatedPaymentDate || job.isPaid) return false;
    const today = new Date();
    const paymentDate = new Date(job.estimatedPaymentDate);
    return paymentDate < today;
  }

  static isPaymentDueSoon(job: Job): boolean {
    if (!job.estimatedPaymentDate || job.isPaid) return false;
    const today = new Date();
    const paymentDate = new Date(job.estimatedPaymentDate);
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }
}