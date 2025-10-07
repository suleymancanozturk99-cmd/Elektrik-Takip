import { 
  ref, 
  push, 
  set, 
  get, 
  remove, 
  update,
  onValue,
  off
} from 'firebase/database';
import { database } from './firebase';
import { Note, NoteUtils } from '@/types/note';

export class FirebaseNoteService {
  private static userEmail: string = '';
  
  static setUserEmail(email: string) {
    this.userEmail = email.replace(/\./g, '_');
  }

  private static getUserNotesRef() {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }
    return ref(database, `users/${this.userEmail}/notes`);
  }

  private static getNoteRef(noteId: string) {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }
    return ref(database, `users/${this.userEmail}/notes/${noteId}`);
  }

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

  static async saveNote(note: Note): Promise<void> {
    try {
      const noteRef = this.getNoteRef(note.id);
      const cleanNoteData = this.cleanData({
        ...note,
        updatedAt: new Date().toISOString()
      });
      
      await set(noteRef, cleanNoteData);
    } catch (error) {
      console.error('Error saving note to Firebase:', error);
      throw error;
    }
  }

  static async getAllNotes(): Promise<Note[]> {
    try {
      const notesRef = this.getUserNotesRef();
      const snapshot = await get(notesRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const notesData = snapshot.val();
      const notes: Note[] = [];
      
      Object.keys(notesData).forEach((noteId) => {
        const noteData = notesData[noteId];
        notes.push({
          ...noteData,
          id: noteId,
        });
      });
      
      return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting notes from Firebase:', error);
      return [];
    }
  }

  static async deleteNote(noteId: string): Promise<void> {
    try {
      const noteRef = this.getNoteRef(noteId);
      await remove(noteRef);
    } catch (error) {
      console.error('Error deleting note from Firebase:', error);
      throw error;
    }
  }

  static subscribeToNotes(callback: (notes: Note[]) => void): () => void {
    const notesRef = this.getUserNotesRef();
    
    const unsubscribe = onValue(notesRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const notesData = snapshot.val();
      const notes: Note[] = [];
      
      Object.keys(notesData).forEach((noteId) => {
        const noteData = notesData[noteId];
        notes.push({
          ...noteData,
          id: noteId,
        });
      });
      
      const sortedNotes = notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(sortedNotes);
    });
    
    return () => off(notesRef, 'value', unsubscribe);
  }
}