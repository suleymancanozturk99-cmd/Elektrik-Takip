import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { Job, JobStats, TimeFilter } from '@/types/job';
import { JobService } from '@/services/jobService';

interface JobContextType {
  jobs: Job[];
  stats: JobStats;
  timeFilter: TimeFilter;
  filteredJobs: Job[];
  pendingPaymentJobs: Job[];
  loading: boolean;
  setTimeFilter: (filter: TimeFilter) => void;
  addJob: (job: Omit<Job, 'id' | 'createdAt'>) => Promise<void>;
  updateJob: (job: Job) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
}

export const JobContext = createContext<JobContextType | undefined>(undefined);
export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
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

  const addJob = async (jobData: Omit<Job, 'id' | 'createdAt'>) => {
    const newJob: Job = {
      ...jobData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
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

  const refreshJobs = async () => {
    await loadJobs();
  };
  const filteredJobs = JobService.filterJobsByTime(jobs, timeFilter);
  const stats = JobService.calculateStats(filteredJobs);
  const pendingPaymentJobs = JobService.getPendingPaymentJobs(jobs);

  return (    <JobContext.Provider value={{
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
      refreshJobs,
    }}>
      {children}
    </JobContext.Provider>
  );
}