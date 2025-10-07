import { Note, NoteWithRelations, NoteUtils } from '@/types/note';
import { Customer } from '@/types/customer';
import { Job } from '@/types/job';

export type NoteFilter = 'all' | 'aktif' | 'tamamlandı';
export type NoteCategory = 'all' | 'malzeme' | 'ödeme' | 'hatırlatma' | 'genel';

export class NoteService {
  static searchNotes(notes: Note[], searchQuery: string): Note[] {
    if (!searchQuery.trim()) {
      return notes;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return notes.filter(note => 
      note.content.toLowerCase().includes(query)
    );
  }

  static filterNotes(
    notes: Note[], 
    statusFilter: NoteFilter = 'all',
    categoryFilter: NoteCategory = 'all'
  ): Note[] {
    let filtered = notes;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(note => note.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(note => note.category === categoryFilter);
    }

    return filtered;
  }

  static getNotesWithRelations(
    notes: Note[], 
    customers: Customer[], 
    jobs: Job[]
  ): NoteWithRelations[] {
    return notes.map(note => {
      const customer = note.customerId ? customers.find(c => c.id === note.customerId) : undefined;
      const job = note.jobId ? jobs.find(j => j.id === note.jobId) : undefined;

      return {
        ...note,
        customerName: customer?.name,
        jobName: job?.name
      };
    });
  }

  static getCustomerNotes(notes: Note[], customerId: string): Note[] {
    return notes.filter(note => note.customerId === customerId);
  }

  static getJobNotes(notes: Note[], jobId: string): Note[] {
    return notes.filter(note => note.jobId === jobId);
  }

  static validateNote(note: Partial<Note>): string | null {
    if (!note.content?.trim()) {
      return 'Not içeriği gereklidir';
    }

    if (note.content.trim().length < 3) {
      return 'Not en az 3 karakter olmalıdır';
    }

    return null;
  }

  static sortNotes(notes: Note[], sortBy: 'date' | 'status' | 'category' = 'date'): Note[] {
    switch (sortBy) {
      case 'date':
        return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'status':
        return notes.sort((a, b) => {
          if (a.status === 'aktif' && b.status === 'tamamlandı') return -1;
          if (a.status === 'tamamlandı' && b.status === 'aktif') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      case 'category':
        return notes.sort((a, b) => {
          const categoryOrder = ['hatırlatma', 'ödeme', 'malzeme', 'genel'];
          const aIndex = categoryOrder.indexOf(a.category || 'genel');
          const bIndex = categoryOrder.indexOf(b.category || 'genel');
          if (aIndex !== bIndex) return aIndex - bIndex;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      default:
        return notes;
    }
  }
}