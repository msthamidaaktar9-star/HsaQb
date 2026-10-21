import Dexie, { type Table } from 'dexie';

export interface Subject {
  id: string;
  name: string;
  order: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  order: number;
}

export interface Topic {
  id: string;
  chapterId: string;
  name: string;
  order: number;
}

export interface Stimulus {
  id: string;
  topicId: string;
  text: string;
  imageIds: string[];
  boardTag?: string;
}

export type QuestionType = 'ক' | 'খ' | 'গ' | 'ঘ';

export interface BoardUsage {
  board: string;
  years: number[];
}

export interface Question {
  id: string;
  stimulusId?: string;
  topicId: string;
  type: QuestionType;
  marks: number;
  questionText: string;
  solutionText: string;
  solutionImageIds: string[];
  answerText?: string;
  rating: number; // 1 to 5
  order: number;
  usedInBoards: BoardUsage[];
}

export interface Paper {
  id: string;
  shortName: string;
  category: string;
  createdAt: number;
  title: string;
  subjectLine?: string;
  duration?: string | number;
  totalMarks?: number;
  questionIds: string[];
}

export interface DbImage {
  id: string;
  fileName: string;
  blob: Blob;
}

export interface MetaRecord {
  key: string;
  value: any;
}

export class QbDatabase extends Dexie {
  subjects!: Table<Subject, string>;
  chapters!: Table<Chapter, string>;
  topics!: Table<Topic, string>;
  stimuli!: Table<Stimulus, string>;
  questions!: Table<Question, string>;
  papers!: Table<Paper, string>;
  images!: Table<DbImage, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super('QbExamDatabase');

    this.version(1).stores({
      subjects: 'id, name, order',
      chapters: 'id, subjectId, name, order',
      topics: 'id, chapterId, name, order',
      stimuli: 'id, topicId',
      questions: 'id, stimulusId, topicId, type, rating, order',
      papers: 'id, shortName, category, createdAt',
      images: 'id, fileName',
      meta: 'key',
    });
  }
}

export const db = new QbDatabase();
export default db;
