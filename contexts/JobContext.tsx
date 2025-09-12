import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { Job, JobStats, TimeFilter, Payment, JobUtils } from '@/types/job';
import { JobService } from '@/services/jobService';
import { FirebaseJobService } from '@/services/firebaseJobService';

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
  manualBackup: () => Promise<void>;
  getCurrentDeviceId: () => string;
  importJobsFromDevice: (deviceId: string) => Promise<void>;
}

export const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time');
  const [loading, setLoading] = useState(true);

  // Firebase real-time listener
  useEffect(() => {
    const unsubscribe = FirebaseJobService.subscribeToJobs((firebaseJobs) => {
      setJobs(firebaseJobs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'payments'> & { 
    initialPayment?: { amount: number; paymentMethod: 'Elden' | 'IBAN' } 
  }) => {
    const newJob: Job = {
      ...jobData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      payments: [],
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
    
    // Save to Firebase (real-time listener will update local state)
    await FirebaseJobService.saveJob(newJob);
  };

  const updateJob = async (updatedJob: Job) => {
    await FirebaseJobService.saveJob(updatedJob);
    // Real-time listener will update local state automatically
  };

  const deleteJob = async (jobId: string) => {
    await FirebaseJobService.deleteJob(jobId);
    // Real-time listener will update local state automatically
  };

  const addPayment = async (jobId: string, paymentData: Omit<Payment, 'id' | 'paymentDate'>) => {
    const payment: Payment = {
      ...paymentData,
      id: `${jobId}_${Date.now()}`,
      paymentDate: new Date().toISOString(),
    };
    
    await FirebaseJobService.addPayment(jobId, payment);
    // Real-time listener will update local state automatically
  };

  const refreshJobs = async () => {
    // Firebase real-time listener handles this automatically
    setLoading(true);
    setTimeout(() => setLoading(false), 500); // Brief loading indicator
  };

  const importJobs = async (importedJobs: Job[]) => {
    try {
      // Save each job to Firebase
      for (const job of importedJobs) {
        await FirebaseJobService.saveJob(job);
      }
      // Real-time listener will update local state automatically
    } catch (error) {
      console.error('Error importing jobs:', error);
      throw error;
    }
  };

  const manualBackup = async () => {
    await FirebaseJobService.manualBackup();
  };

  const getCurrentDeviceId = () => {
    return FirebaseJobService.getCurrentDeviceId();
  };

  const importJobsFromDevice = async (deviceId: string) => {
    try {
      const jobs = await FirebaseJobService.importJobsFromDevice(deviceId);
      // Import all jobs from the other device
      for (const job of jobs) {
        await FirebaseJobService.saveJob(job);
      }
    } catch (error) {
      console.error('Error importing jobs from device:', error);
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
      manualBackup,
      getCurrentDeviceId,
      importJobsFromDevice,
    }}>
      {children}
    </JobContext.Provider>
  );
}