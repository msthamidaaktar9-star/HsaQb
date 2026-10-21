import Dexie, { type EntityTable } from 'dexie';

export interface QuestionItem {
  id?: number;
  title: string;
  subject?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: 'mcq' | 'cq' | 'short';
  content?: string;
  options?: string[];
  answer?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CollectionItem {
  id?: number;
  name: string;
  description?: string;
  category?: string;
  questionIds: number[];
  createdAt: number;
  updatedAt: number;
}

export interface ExamRecord {
  id?: number;
  title: string;
  collectionId?: number;
  totalMarks: number;
  durationMinutes: number;
  status: 'draft' | 'completed' | 'ongoing';
  createdAt: number;
}

export class QbDatabase extends Dexie {
  questions!: EntityTable<QuestionItem, 'id'>;
  collections!: EntityTable<CollectionItem, 'id'>;
  exams!: EntityTable<ExamRecord, 'id'>;

  constructor() {
    super('QbCollectionAndExamDB');
    this.version(1).stores({
      questions: '++id, title, subject, topic, difficulty, type, createdAt',
      collections: '++id, name, category, createdAt',
      exams: '++id, title, collectionId, status, createdAt',
    });
  }
}

export const db = new QbDatabase();
