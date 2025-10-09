import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { Job, JobStats, TimeFilter, Payment, JobUtils } from '@/types/job';
import { JobService, SearchFilter } from '@/services/jobService';
import { FirebaseJobService } from '@/services/firebaseJobService';
import { useAuth } from '@/hooks/useAuth';

interface JobContextType {
  jobs: Job[];
  stats: JobStats;
  timeFilter: TimeFilter;
  filteredJobs: Job[];
  pendingPaymentJobs: Job[];
  loading: boolean;
  searchQuery: string;
  searchFilter: SearchFilter;
  searchResults: Job[];
  searchResultCount: number;
  paymentStats: any;
  setTimeFilter: (filter: TimeFilter) => void;
  setSearchQuery: (query: string) => void;
  setSearchFilter: (filter: SearchFilter) => void;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');

  const { user, isAuthenticated } = useAuth();

  // Firebase real-time listener - only when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setJobs([]);
      setLoading(false);
      return;
    }

    // Set user email for Firebase operations
    FirebaseJobService.setUserEmail(user.email);

    const unsubscribe = FirebaseJobService.subscribeToJobs((firebaseJobs) => {
      setJobs(firebaseJobs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated, user]);

  const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'payments'> & { 
    initialPayment?: { amount: number; paymentMethod: 'Elden' | 'IBAN' } 
  }) => {
    // Clean the job data to remove undefined values and include customerId
    const cleanJobData: any = {
      name: jobData.name || '',
      description: jobData.description || '',
      cost: jobData.cost || 0,
      price: jobData.price || 0,
      withFather: jobData.withFather || false,
      customerId: jobData.customerId || null, // ✅ FIX: customerId eklendi
    };

    // Only add estimatedPaymentDate if it's defined
    if (jobData.estimatedPaymentDate) {
      cleanJobData.estimatedPaymentDate = jobData.estimatedPaymentDate;
    }

    const newJob: Job = {
      ...cleanJobData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      payments: [],
    };
    
    // Add initial payment if provided and amount > 0
    if (jobData.initialPayment && jobData.initialPayment.amount > 0) {
      newJob.payments = [{
        id: `${newJob.id}_initial`,
        amount: jobData.initialPayment.amount,
        paymentMethod: jobData.initialPayment.paymentMethod,
        paymentDate: newJob.createdAt,
      }];
      
      // Remove estimated payment date if fully paid
      if (jobData.initialPayment.amount >= newJob.price) {
        delete newJob.estimatedPaymentDate;
      }
    }
    
    // Save to Firebase (real-time listener will update local state)
    await FirebaseJobService.saveJob(newJob);
  };

  const updateJob = async (updatedJob: Job) => {
    // Clean the job data before saving
    const cleanJob = {
      ...updatedJob,
      name: updatedJob.name || '',
      description: updatedJob.description || '',
      cost: updatedJob.cost || 0,
      price: updatedJob.price || 0,
      withFather: updatedJob.withFather || false,
      payments: updatedJob.payments || [],
      customerId: updatedJob.customerId || null, // ✅ customerId korundu
    };

    // Only include estimatedPaymentDate if it exists
    if (updatedJob.estimatedPaymentDate) {
      cleanJob.estimatedPaymentDate = updatedJob.estimatedPaymentDate;
    }

    await FirebaseJobService.saveJob(cleanJob);
    // Real-time listener will update local state automatically
  };

  const deleteJob = async (jobId: string) => {
    await FirebaseJobService.deleteJob(jobId);
    // Real-time listener will update local state automatically
  };

  const addPayment = async (jobId: string, paymentData: Omit<Payment, 'id' | 'paymentDate'>) => {
    const payment: Payment = {
      id: `${jobId}_${Date.now()}`,
      amount: paymentData.amount || 0,
      paymentMethod: paymentData.paymentMethod || 'Elden',
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
        // Clean job data before saving
        const cleanJob = {
          ...job,
          name: job.name || '',
          description: job.description || '',
          cost: job.cost || 0,
          price: job.price || 0,
          withFather: job.withFather || false,
          payments: job.payments || [],
          customerId: job.customerId || null, // ✅ customerId korundu
        };

        // Only include estimatedPaymentDate if it exists
        if (job.estimatedPaymentDate) {
          cleanJob.estimatedPaymentDate = job.estimatedPaymentDate;
        }

        await FirebaseJobService.saveJob(cleanJob);
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

  const getCurrentUserEmail = () => {
    return user?.email || '';
  };

  const importJobsFromUser = async (sourceEmail: string) => {
    try {
      const jobs = await FirebaseJobService.importJobsFromUser(sourceEmail);
      // Import all jobs from the other user
      for (const job of jobs) {
        // Clean job data before saving
        const cleanJob = {
          ...job,
          name: job.name || '',
          description: job.description || '',
          cost: job.cost || 0,
          price: job.price || 0,
          withFather: job.withFather || false,
          payments: job.payments || [],
          customerId: job.customerId || null, // ✅ customerId korundu
        };

        // Only include estimatedPaymentDate if it exists
        if (job.estimatedPaymentDate) {
          cleanJob.estimatedPaymentDate = job.estimatedPaymentDate;
        }

        await FirebaseJobService.saveJob(cleanJob);
      }
    } catch (error) {
      console.error('Error importing jobs from user:', error);
      throw error;
    }
  };

  const filteredJobs = JobService.filterJobsByTime(jobs, timeFilter);
  const stats = JobService.calculateStats(filteredJobs);
  const pendingPaymentJobs = JobService.getPendingPaymentJobs(jobs);
  
  // Search functionality
  const searchResults = JobService.searchJobs(filteredJobs, searchQuery, searchFilter);
  const searchResultCount = searchResults.length;

  // Payment stats calculation
  const paymentStats = JobService.calculatePaymentStats(jobs, timeFilter);

  return (
    <JobContext.Provider value={{
      jobs,
      stats,
      timeFilter,
      filteredJobs,
      pendingPaymentJobs,
      loading,
      searchQuery,
      searchFilter,
      searchResults,
      searchResultCount,
      paymentStats,
      setTimeFilter,
      setSearchQuery,
      setSearchFilter,
      addJob,
      updateJob,
      deleteJob,
      addPayment,
      refreshJobs,
      importJobs,
      manualBackup,
      getCurrentDeviceId: getCurrentUserEmail,
      importJobsFromDevice: importJobsFromUser,
    }}>
      {children}
    </JobContext.Provider>
  );
}