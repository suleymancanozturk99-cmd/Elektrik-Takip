import { useContext } from 'react';
import { NoteContext } from '@/contexts/NoteContext';

export function useNotes() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error('useNotes must be used within NoteProvider');
  }
  return context;
}