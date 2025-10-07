import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { Note, NoteWithRelations, NoteUtils } from '@/types/note';
import { NoteService, NoteFilter, NoteCategory } from '@/services/noteService';
import { FirebaseNoteService } from '@/services/firebaseNoteService';
import { useAuth } from '@/hooks/useAuth';

interface NoteContextType {
  notes: Note[];
  loading: boolean;
  searchQuery: string;
  statusFilter: NoteFilter;
  categoryFilter: NoteCategory;
  filteredNotes: Note[];
  searchResults: Note[];
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: NoteFilter) => void;
  setCategoryFilter: (filter: NoteCategory) => void;
  addNote: (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  toggleNoteStatus: (noteId: string) => Promise<void>;
  getNotesWithRelations: (customers: any[], jobs: any[]) => NoteWithRelations[];
  getCustomerNotes: (customerId: string) => Note[];
  getJobNotes: (jobId: string) => Note[];
  refreshNotes: () => Promise<void>;
}

export const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<NoteFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory>('all');

  const { user, isAuthenticated } = useAuth();

  // Firebase real-time listener - only when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    // Set user email for Firebase operations
    FirebaseNoteService.setUserEmail(user.email);

    const unsubscribe = FirebaseNoteService.subscribeToNotes((firebaseNotes) => {
      setNotes(firebaseNotes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated, user]);

  const addNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const validationError = NoteService.validateNote(noteData);
    if (validationError) {
      throw new Error(validationError);
    }

    const newNote: Note = {
      ...NoteUtils.createNote(noteData.content, noteData.customerId, noteData.jobId, noteData.category),
      id: Date.now().toString(),
    };

    await FirebaseNoteService.saveNote(newNote);
  };

  const updateNote = async (updatedNote: Note) => {
    const validationError = NoteService.validateNote(updatedNote);
    if (validationError) {
      throw new Error(validationError);
    }

    const noteToUpdate = {
      ...updatedNote,
      updatedAt: new Date().toISOString(),
    };

    await FirebaseNoteService.saveNote(noteToUpdate);
  };

  const deleteNote = async (noteId: string) => {
    await FirebaseNoteService.deleteNote(noteId);
  };

  const toggleNoteStatus = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const updatedNote = {
      ...note,
      status: note.status === 'aktif' ? 'tamamlandı' as const : 'aktif' as const,
      updatedAt: new Date().toISOString(),
    };

    await FirebaseNoteService.saveNote(updatedNote);
  };

  const getNotesWithRelations = (customers: any[], jobs: any[]): NoteWithRelations[] => {
    return NoteService.getNotesWithRelations(notes, customers, jobs);
  };

  const getCustomerNotes = (customerId: string): Note[] => {
    return NoteService.getCustomerNotes(notes, customerId);
  };

  const getJobNotes = (jobId: string): Note[] => {
    return NoteService.getJobNotes(notes, jobId);
  };

  const refreshNotes = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  // Filter and search functionality
  const filteredNotes = NoteService.filterNotes(notes, statusFilter, categoryFilter);
  const searchResults = NoteService.searchNotes(filteredNotes, searchQuery);

  return (
    <NoteContext.Provider value={{
      notes,
      loading,
      searchQuery,
      statusFilter,
      categoryFilter,
      filteredNotes,
      searchResults,
      setSearchQuery,
      setStatusFilter,
      setCategoryFilter,
      addNote,
      updateNote,
      deleteNote,
      toggleNoteStatus,
      getNotesWithRelations,
      getCustomerNotes,
      getJobNotes,
      refreshNotes,
    }}>
      {children}
    </NoteContext.Provider>
  );
}