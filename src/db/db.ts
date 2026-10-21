import Dexie, { type EntityTable } from 'dexie';

export interface BoardUsage {
  board: string;
  years: number[];
}

export interface SubjectItem {
  id: string;
  name: string;
  order: number;
}

export interface ChapterItem {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export interface TopicItem {
  id: string;
  chapterId: string;
  name: string;
  order: number;
}

export interface StimulusItem {
  id: string;
  topicId: string;
  text: string;
  imageIds: string[];
  boardTag?: string;
}

export type QuestionType = 'ক' | 'খ' | 'গ' | 'ঘ';

export interface QuestionItem {
  id: string;
  stimulusId: string;
  topicId: string;
  type: QuestionType;
  marks: number;
  questionText: string;
  solutionText?: string;
  solutionImageIds: string[];
  answerText?: string;
  rating: number; // 1 - 5
  order: number;
  usedInBoards: BoardUsage[];
}

export interface PaperItem {
  id: string;
  shortName: string;
  category: string;
  createdAt: number;
  title: string;
  subjectLine?: string;
  duration?: number; // in minutes
  totalMarks?: number;
  questionIds: string[];
}

export interface ImageItem {
  id: string;
  fileName: string;
  blob: Blob;
}

export interface MetaItem {
  key: string;
  value: unknown;
}

export class QbAppDatabase extends Dexie {
  subjects!: EntityTable<SubjectItem, 'id'>;
  chapters!: EntityTable<ChapterItem, 'id'>;
  topics!: EntityTable<TopicItem, 'id'>;
  stimuli!: EntityTable<StimulusItem, 'id'>;
  questions!: EntityTable<QuestionItem, 'id'>;
  papers!: EntityTable<PaperItem, 'id'>;
  images!: EntityTable<ImageItem, 'id'>;
  meta!: EntityTable<MetaItem, 'key'>;

  constructor() {
    super('QbAppDatabase');
    this.version(1).stores({
      subjects: 'id, name, order',
      chapters: 'id, subjectId, name, order',
      topics: 'id, chapterId, name, order',
      stimuli: 'id, topicId, boardTag',
      questions: 'id, stimulusId, topicId, type, rating, order',
      papers: 'id, shortName, category, createdAt',
      images: 'id, fileName',
      meta: 'key',
    });
  }
}

export const db = new QbAppDatabase();
export default db;
