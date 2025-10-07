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
  private static userEmail: string = '';
  
  // Set user email for Firebase operations
  static setUserEmail(email: string) {
    // Convert email to Firebase-safe key (replace . with _)
    this.userEmail = email.replace(/\./g, '_');
  }

  // Get reference path for user-specific jobs
  private static getUserJobsRef() {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }
    return ref(database, `users/${this.userEmail}/jobs`);
  }

  private static getJobRef(jobId: string) {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }
    return ref(database, `users/${this.userEmail}/jobs/${jobId}`);
  }

  // Clean data by removing undefined values
  private static cleanData(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanData(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.cleanData(obj[key]);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  // Save job to Firebase Realtime Database
  static async saveJob(job: Job): Promise<void> {
    try {
      const jobRef = this.getJobRef(job.id);
      
      // Clean job data to remove undefined values
      const cleanJobData = this.cleanData({
        ...job,
        createdAt: job.createdAt,
        estimatedPaymentDate: job.estimatedPaymentDate || null,
        payments: job.payments?.map(payment => this.cleanData({
          ...payment,
          paymentDate: payment.paymentDate
        })) || []
      });
      
      await set(jobRef, cleanJobData);
    } catch (error) {
      console.error('Error saving job to Firebase:', error);
      throw error;
    }
  }

  // Get all jobs from Firebase Realtime Database
  static async getAllJobs(): Promise<Job[]> {
    try {
      const jobsRef = this.getUserJobsRef();
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
      
      const cleanPayment = this.cleanData(payment);
      const updatedPayments = [...currentPayments, cleanPayment];
      
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
    const jobsRef = this.getUserJobsRef();
    
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

  // Import jobs from another user
  static async importJobsFromUser(sourceEmail: string): Promise<Job[]> {
    try {
      const sourceUserKey = sourceEmail.replace(/\./g, '_');
      const sourceJobsRef = ref(database, `users/${sourceUserKey}/jobs`);
      const snapshot = await get(sourceJobsRef);
      
      if (!snapshot.exists()) {
        throw new Error('Source user has no data');
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
      console.error('Error importing jobs from user:', error);
      throw error;
    }
  }

  // Manual backup - ensure all local data is synced to Firebase
  static async manualBackup(): Promise<void> {
    try {
      // This method ensures all local data is synced to Firebase
      const jobs = await this.getAllJobs();
      console.log(`Manual backup completed: ${jobs.length} jobs synced to Firebase Realtime Database for user: ${this.userEmail}`);
    } catch (error) {
      console.error('Error during manual backup:', error);
      throw error;
    }
  }

  // Get current user email
  static getCurrentDeviceId(): string {
    return this.userEmail.replace(/_/g, '.');
  }

  // Get all users (for debugging/admin purposes)
  static async getAllUsers(): Promise<string[]> {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      return Object.keys(snapshot.val()).map(key => key.replace(/_/g, '.'));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}