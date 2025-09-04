import { useContext } from 'react';
import { JobContext } from '@/contexts/JobContext';

export function useJobs() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within JobProvider');
  }
  return context;
}