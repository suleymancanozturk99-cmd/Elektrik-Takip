import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { Job, JobStats, TimeFilter, Payment, JobUtils } from '@/types/job';
import { JobService } from '@/services/jobService';

interface JobContextType {
  jobs: Job[];
  stats: JobStats;
  timeFilter: TimeFilter;
  filteredJobs: Job[];
  pendingPaymentJobs: Job[];
  loading: boolean;
  setTimeFilter: (filter: TimeFilter) => void;
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'payments'> & { 
    initialPayment?: { amount: number; paymentMethod: 'Elden' | 'IBAN' } 
  }) => Promise<void>;
  updateJob: (job: Job) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  addPayment: (jobId: string, payment: Omit<Payment, 'id' | 'paymentDate'>) => Promise<void>;
  refreshJobs: () => Promise<void>;
  importJobs: (jobs: Job[]) => Promise<void>;
}

export const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time');
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const loadedJobs = await JobService.getAllJobs();
      setJobs(loadedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

    const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'payments'> & { 
    initialPayment?: { amount: number; paymentMethod: 'Elden' | 'IBAN' } 
  }) => {
    const newJob: Job = {
      ...jobData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      payments: [], // Initialize empty payments array
    };
    
    // Add initial payment if provided
    if (jobData.initialPayment && jobData.initialPayment.amount > 0) {
      newJob.payments = [{
        id: `${newJob.id}_initial`,
        amount: jobData.initialPayment.amount,
        paymentMethod: jobData.initialPayment.paymentMethod,
        paymentDate: newJob.createdAt,
      }];
      
      // Remove estimated payment date if fully paid
      if (jobData.initialPayment.amount >= newJob.price) {
        newJob.estimatedPaymentDate = undefined;
      }
    }
    
    await JobService.saveJob(newJob);
    setJobs(prev => [...prev, newJob]);
  };

  const updateJob = async (updatedJob: Job) => {
    await JobService.saveJob(updatedJob);
    setJobs(prev => prev.map(job => job.id === updatedJob.id ? updatedJob : job));
  };

  const deleteJob = async (jobId: string) => {
    await JobService.deleteJob(jobId);
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const addPayment = async (jobId: string, paymentData: Omit<Payment, 'id' | 'paymentDate'>) => {
    const payment: Payment = {
      ...paymentData,
      id: `${jobId}_${Date.now()}`,
      paymentDate: new Date().toISOString(),
    };
    
    await JobService.addPayment(jobId, payment);
    
    // Update local state
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        const updatedJob = { ...job };
        if (!updatedJob.payments) updatedJob.payments = [];
        updatedJob.payments.push(payment);
        
        // Remove estimated payment date if fully paid
        if (JobUtils.isFullyPaid(updatedJob)) {
          updatedJob.estimatedPaymentDate = undefined;
        }
        
        return updatedJob;
      }
      return job;
    }));
  };

  const refreshJobs = async () => {
    await loadJobs();
  };

  const importJobs = async (importedJobs: Job[]) => {
    try {
      await JobService.importJobs(importedJobs);
      setJobs(importedJobs);
    } catch (error) {
      console.error('Error importing jobs:', error);
      throw error;
    }
  };

  const filteredJobs = JobService.filterJobsByTime(jobs, timeFilter);
  const stats = JobService.calculateStats(filteredJobs);
  const pendingPaymentJobs = JobService.getPendingPaymentJobs(jobs);

  return (
    <JobContext.Provider value={{
      jobs,
      stats,
      timeFilter,
      filteredJobs,
      pendingPaymentJobs,
      loading,
      setTimeFilter,
      addJob,
      updateJob,
      deleteJob,
      addPayment,
      refreshJobs,
      importJobs,
    }}>
      {children}
    </JobContext.Provider>
  );
}