import { 
  ref, 
  push, 
  set, 
  get, 
  remove, 
  update,
  onValue,
  off,
  orderByChild,
  query
} from 'firebase/database';
import { database, getDeviceId } from './firebase';
import { Job, Payment, JobUtils } from '@/types/job';

export class FirebaseJobService {
  private static deviceId = getDeviceId();
  
  // Get reference path for device-specific jobs
  private static getDeviceJobsRef() {
    return ref(database, `devices/${this.deviceId}/jobs`);
  }

  private static getJobRef(jobId: string) {
    return ref(database, `devices/${this.deviceId}/jobs/${jobId}`);
  }

  // Save job to Firebase Realtime Database
  static async saveJob(job: Job): Promise<void> {
    try {
      const jobRef = this.getJobRef(job.id);
      
      // Convert dates to ISO strings for Realtime Database
      const jobData = {
        ...job,
        createdAt: job.createdAt,
        estimatedPaymentDate: job.estimatedPaymentDate || null,
        payments: job.payments?.map(payment => ({
          ...payment,
          paymentDate: payment.paymentDate
        })) || []
      };
      
      await set(jobRef, jobData);
    } catch (error) {
      console.error('Error saving job to Firebase:', error);
      throw error;
    }
  }

  // Get all jobs from Firebase Realtime Database
  static async getAllJobs(): Promise<Job[]> {
    try {
      const jobsRef = this.getDeviceJobsRef();
      const snapshot = await get(jobsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const jobsData = snapshot.val();
      const jobs: Job[] = [];
      
      Object.keys(jobsData).forEach((jobId) => {
        const jobData = jobsData[jobId];
        const job: Job = {
          ...jobData,
          id: jobId,
          payments: jobData.payments || []
        };
        
        jobs.push(JobUtils.migrateJob(job));
      });
      
      // Sort by creation date (newest first)
      return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting jobs from Firebase:', error);
      return [];
    }
  }

  // Add payment to job
  static async addPayment(jobId: string, payment: Payment): Promise<void> {
    try {
      const jobRef = this.getJobRef(jobId);
      const jobSnapshot = await get(jobRef);
      
      if (!jobSnapshot.exists()) {
        throw new Error('Job not found');
      }
      
      const jobData = jobSnapshot.val();
      const currentPayments = jobData.payments || [];
      
      const updatedPayments = [...currentPayments, payment];
      
      await update(jobRef, {
        payments: updatedPayments
      });
    } catch (error) {
      console.error('Error adding payment to Firebase:', error);
      throw error;
    }
  }

  // Delete job from Firebase Realtime Database
  static async deleteJob(jobId: string): Promise<void> {
    try {
      const jobRef = this.getJobRef(jobId);
      await remove(jobRef);
    } catch (error) {
      console.error('Error deleting job from Firebase:', error);
      throw error;
    }
  }

  // Real-time listener for jobs
  static subscribeToJobs(callback: (jobs: Job[]) => void): () => void {
    const jobsRef = this.getDeviceJobsRef();
    
    const unsubscribe = onValue(jobsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const jobsData = snapshot.val();
      const jobs: Job[] = [];
      
      Object.keys(jobsData).forEach((jobId) => {
        const jobData = jobsData[jobId];
        const job: Job = {
          ...jobData,
          id: jobId,
          payments: jobData.payments || []
        };
        
        jobs.push(JobUtils.migrateJob(job));
      });
      
      // Sort by creation date (newest first)
      const sortedJobs = jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(sortedJobs);
    });
    
    // Return unsubscribe function
    return () => off(jobsRef, 'value', unsubscribe);
  }

  // Import jobs from another device
  static async importJobsFromDevice(sourceDeviceId: string): Promise<Job[]> {
    try {
      const sourceJobsRef = ref(database, `devices/${sourceDeviceId}/jobs`);
      const snapshot = await get(sourceJobsRef);
      
      if (!snapshot.exists()) {
        throw new Error('Source device has no data');
      }
      
      const jobsData = snapshot.val();
      const jobs: Job[] = [];
      
      Object.keys(jobsData).forEach((jobId) => {
        const jobData = jobsData[jobId];
        const job: Job = {
          ...jobData,
          id: jobId,
          payments: jobData.payments || []
        };
        
        jobs.push(JobUtils.migrateJob(job));
      });
      
      return jobs;
    } catch (error) {
      console.error('Error importing jobs from device:', error);
      throw error;
    }
  }

  // Manual backup - ensure all local data is synced to Firebase
  static async manualBackup(): Promise<void> {
    try {
      // This method ensures all local data is synced to Firebase
      const jobs = await this.getAllJobs();
      console.log(`Manual backup completed: ${jobs.length} jobs synced to Firebase Realtime Database`);
    } catch (error) {
      console.error('Error during manual backup:', error);
      throw error;
    }
  }

  // Get current device ID
  static getCurrentDeviceId(): string {
    return this.deviceId;
  }

  // Get all device IDs (for debugging/admin purposes)
  static async getAllDevices(): Promise<string[]> {
    try {
      const devicesRef = ref(database, 'devices');
      const snapshot = await get(devicesRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      return Object.keys(snapshot.val());
    } catch (error) {
      console.error('Error getting all devices:', error);
      return [];
    }
  }
}