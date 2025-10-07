export interface Note {
  id: string;
  content: string;
  customerId?: string;
  jobId?: string;
  category?: 'malzeme' | 'ödeme' | 'hatırlatma' | 'genel';
  status: 'aktif' | 'tamamlandı';
  createdAt: string;
  updatedAt: string;
}

export interface NoteWithRelations extends Note {
  customerName?: string;
  jobName?: string;
}

export const NoteUtils = {
  createNote: (
    content: string, 
    customerId?: string, 
    jobId?: string, 
    category?: Note['category']
  ): Omit<Note, 'id'> => {
    return {
      content: content.trim(),
      customerId,
      jobId,
      category: category || 'genel',
      status: 'aktif',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  getCategoryIcon: (category: Note['category']): string => {
    switch (category) {
      case 'malzeme': return 'build';
      case 'ödeme': return 'payment';
      case 'hatırlatma': return 'notifications';
      default: return 'note';
    }
  },

  getCategoryColor: (category: Note['category']): string => {
    switch (category) {
      case 'malzeme': return '#ff9800';
      case 'ödeme': return '#4caf50';
      case 'hatırlatma': return '#f44336';
      default: return '#2196f3';
    }
  },

  getStatusIcon: (status: Note['status']): string => {
    return status === 'tamamlandı' ? 'check-circle' : 'radio-button-unchecked';
  }
};