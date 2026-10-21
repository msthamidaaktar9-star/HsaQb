import { db, SubjectItem, ChapterItem, TopicItem, StimulusItem, QuestionItem, PaperItem } from './db';

// Rating Labels
export const RATING_LABELS: Record<number, string> = {
  1: 'সহজ',
  2: 'মোটামুটি',
  3: 'মাঝারি',
  4: 'ভালো',
  5: 'চ্যালেঞ্জিং',
};

export function getRatingLabel(rating: number): string {
  return RATING_LABELS[rating] || 'মাঝারি';
}

// Generate unique string ID
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'qb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

// ==========================================
// DATA READING
// ==========================================

export async function getSubjects(): Promise<SubjectItem[]> {
  const subjects = await db.subjects.toArray();
  return subjects.sort((a, b) => a.order - b.order);
}

export async function getChapters(subjectId: string): Promise<ChapterItem[]> {
  const chapters = await db.chapters.where('subjectId').equals(subjectId).toArray();
  return chapters.sort((a, b) => a.order - b.order);
}

export async function getTopics(chapterId: string): Promise<TopicItem[]> {
  const topics = await db.topics.where('chapterId').equals(chapterId).toArray();
  return topics.sort((a, b) => a.order - b.order);
}

export interface StimulusWithQuestions {
  stimulus: StimulusItem;
  questions: QuestionItem[];
}

export async function getQuestionsByTopic(topicId: string): Promise<StimulusWithQuestions[]> {
  const stimuli = await db.stimuli.where('topicId').equals(topicId).toArray();
  const allQuestions = await db.questions.where('topicId').equals(topicId).toArray();

  const result: StimulusWithQuestions[] = [];

  for (const stimulus of stimuli) {
    const questions = allQuestions
      .filter((q) => q.stimulusId === stimulus.id)
      .sort((a, b) => a.order - b.order);

    result.push({
      stimulus,
      questions,
    });
  }

  // Also include questions that might not belong to a stimulus (standalone)
  const standaloneQuestions = allQuestions
    .filter((q) => !q.stimulusId)
    .sort((a, b) => a.order - b.order);

  if (standaloneQuestions.length > 0) {
    result.push({
      stimulus: {
        id: '',
        topicId,
        text: '',
        imageIds: [],
      },
      questions: standaloneQuestions,
    });
  }

  return result;
}

export async function getStimulusById(id: string): Promise<StimulusItem | undefined> {
  return await db.stimuli.get(id);
}

export async function getQuestionById(id: string): Promise<QuestionItem | undefined> {
  return await db.questions.get(id);
}

export async function getAllPapers(): Promise<PaperItem[]> {
  const papers = await db.papers.toArray();
  return papers.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPaperById(id: string): Promise<PaperItem | undefined> {
  return await db.papers.get(id);
}

// ==========================================
// DATA WRITING (CRUD & CASCADING DELETION)
// ==========================================

export async function addSubject(name: string, order?: number): Promise<SubjectItem> {
  const count = await db.subjects.count();
  const item: SubjectItem = {
    id: generateId(),
    name,
    order: order ?? count + 1,
  };
  await db.subjects.add(item);
  return item;
}

export async function updateSubject(id: string, updates: Partial<Omit<SubjectItem, 'id'>>): Promise<void> {
  await db.subjects.update(id, updates);
}

export async function deleteSubject(subjectId: string): Promise<void> {
  const chapters = await db.chapters.where('subjectId').equals(subjectId).toArray();
  for (const chapter of chapters) {
    await deleteChapter(chapter.id);
  }
  await db.subjects.delete(subjectId);
}

export async function addChapter(subjectId: string, name: string, order?: number): Promise<ChapterItem> {
  const count = await db.chapters.where('subjectId').equals(subjectId).count();
  const item: ChapterItem = {
    id: generateId(),
    subjectId,
    name,
    order: order ?? count + 1,
  };
  await db.chapters.add(item);
  return item;
}

export async function updateChapter(id: string, updates: Partial<Omit<ChapterItem, 'id'>>): Promise<void> {
  await db.chapters.update(id, updates);
}

export async function deleteChapter(chapterId: string): Promise<void> {
  const topics = await db.topics.where('chapterId').equals(chapterId).toArray();
  for (const topic of topics) {
    await deleteTopic(topic.id);
  }
  await db.chapters.delete(chapterId);
}

export async function addTopic(chapterId: string, name: string, order?: number): Promise<TopicItem> {
  const count = await db.topics.where('chapterId').equals(chapterId).count();
  const item: TopicItem = {
    id: generateId(),
    chapterId,
    name,
    order: order ?? count + 1,
  };
  await db.topics.add(item);
  return item;
}

export async function updateTopic(id: string, updates: Partial<Omit<TopicItem, 'id'>>): Promise<void> {
  await db.topics.update(id, updates);
}

export async function deleteTopic(topicId: string): Promise<void> {
  const stimuli = await db.stimuli.where('topicId').equals(topicId).toArray();
  for (const stimulus of stimuli) {
    await deleteStimulus(stimulus.id);
  }
  // Delete any standalone questions in this topic
  const questions = await db.questions.where('topicId').equals(topicId).toArray();
  for (const q of questions) {
    await deleteQuestion(q.id);
  }
  await db.topics.delete(topicId);
}

export async function addStimulus(
  topicId: string,
  text: string,
  imageIds: string[] = [],
  boardTag?: string
): Promise<StimulusItem> {
  const item: StimulusItem = {
    id: generateId(),
    topicId,
    text,
    imageIds,
    boardTag,
  };
  await db.stimuli.add(item);
  return item;
}

export async function updateStimulus(id: string, updates: Partial<Omit<StimulusItem, 'id'>>): Promise<void> {
  await db.stimuli.update(id, updates);
}

export async function deleteStimulus(stimulusId: string): Promise<void> {
  const stimulus = await db.stimuli.get(stimulusId);
  if (stimulus?.imageIds?.length) {
    await db.images.bulkDelete(stimulus.imageIds);
  }
  const questions = await db.questions.where('stimulusId').equals(stimulusId).toArray();
  for (const q of questions) {
    await deleteQuestion(q.id);
  }
  await db.stimuli.delete(stimulusId);
}

export async function addQuestion(
  data: Omit<QuestionItem, 'id' | 'order'> & { order?: number }
): Promise<QuestionItem> {
  const siblingCount = await db.questions
    .where('stimulusId')
    .equals(data.stimulusId)
    .count();

  const item: QuestionItem = {
    ...data,
    id: generateId(),
    order: data.order ?? siblingCount + 1,
  };
  await db.questions.add(item);
  return item;
}

export async function updateQuestion(id: string, updates: Partial<Omit<QuestionItem, 'id'>>): Promise<void> {
  await db.questions.update(id, updates);
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const q = await db.questions.get(questionId);
  if (q?.solutionImageIds?.length) {
    await db.images.bulkDelete(q.solutionImageIds);
  }
  await db.questions.delete(questionId);

  // Remove from selection if selected
  const selected = await getSelectedIds();
  if (selected.includes(questionId)) {
    await reorderSelected(selected.filter((id) => id !== questionId));
  }
}

// Reordering functions
export async function reorderSubjects(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.subjects, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.subjects.update(orderedIds[i], { order: i + 1 });
    }
  });
}

export async function reorderChapters(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.chapters, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.chapters.update(orderedIds[i], { order: i + 1 });
    }
  });
}

export async function reorderTopics(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.topics, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.topics.update(orderedIds[i], { order: i + 1 });
    }
  });
}

export async function reorderQuestions(orderedIds: string[]): Promise<void> {
  await db.transaction('rw', db.questions, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.questions.update(orderedIds[i], { order: i + 1 });
    }
  });
}

// ==========================================
// SELECTION STATE (STORED IN META TABLE)
// ==========================================

const META_KEY_SELECTED = 'selectedQuestionIds';
const META_KEY_CLIPBOARD = 'clipboard';

export async function getSelectedIds(): Promise<string[]> {
  const record = await db.meta.get(META_KEY_SELECTED);
  return Array.isArray(record?.value) ? (record.value as string[]) : [];
}

export async function isSelected(questionId: string): Promise<boolean> {
  const ids = await getSelectedIds();
  return ids.includes(questionId);
}

export async function toggleSelected(questionId: string): Promise<boolean> {
  const current = await getSelectedIds();
  let next: string[];
  let selectedNow: boolean;

  if (current.includes(questionId)) {
    next = current.filter((id) => id !== questionId);
    selectedNow = false;
  } else {
    next = [...current, questionId];
    selectedNow = true;
  }

  await db.meta.put({ key: META_KEY_SELECTED, value: next });
  return selectedNow;
}

export async function clearSelection(): Promise<void> {
  await db.meta.put({ key: META_KEY_SELECTED, value: [] });
}

export async function reorderSelected(newOrderedIds: string[]): Promise<void> {
  await db.meta.put({ key: META_KEY_SELECTED, value: newOrderedIds });
}

// ==========================================
// COPY / PASTE AFTER
// ==========================================

export async function copyQuestion(questionId: string): Promise<boolean> {
  const question = await db.questions.get(questionId);
  if (!question) return false;

  await db.meta.put({
    key: META_KEY_CLIPBOARD,
    value: {
      type: 'question',
      data: question,
      copiedAt: Date.now(),
    },
  });
  return true;
}

export async function pasteAfter(targetQuestionId: string): Promise<QuestionItem | null> {
  const clip = await db.meta.get(META_KEY_CLIPBOARD);
  if (!clip || !clip.value || (clip.value as { type: string }).type !== 'question') {
    return null;
  }

  const originalQuestion = (clip.value as { data: QuestionItem }).data;
  const targetQuestion = await db.questions.get(targetQuestionId);
  if (!targetQuestion) return null;

  const targetStimulusId = targetQuestion.stimulusId;
  const targetTopicId = targetQuestion.topicId;
  const insertOrder = targetQuestion.order + 1;

  // Shift subsequent questions in the same stimulus
  const siblings = await db.questions
    .where('stimulusId')
    .equals(targetStimulusId)
    .toArray();

  await db.transaction('rw', db.questions, async () => {
    for (const sib of siblings) {
      if (sib.order >= insertOrder) {
        await db.questions.update(sib.id, { order: sib.order + 1 });
      }
    }
  });

  const clonedQuestion: QuestionItem = {
    ...originalQuestion,
    id: generateId(),
    stimulusId: targetStimulusId,
    topicId: targetTopicId,
    order: insertOrder,
  };

  await db.questions.add(clonedQuestion);
  return clonedQuestion;
}

// ==========================================
// PAPER USAGE COUNT
// ==========================================

export interface QuestionUsageInfo {
  totalCount: number;
  papers: Array<{
    id: string;
    shortName: string;
    title: string;
    count: number;
  }>;
}

export async function getQuestionUsageCount(questionId: string): Promise<QuestionUsageInfo> {
  const allPapers = await db.papers.toArray();
  const papersWithQuestion: QuestionUsageInfo['papers'] = [];
  let totalCount = 0;

  for (const paper of allPapers) {
    const occurrences = paper.questionIds.filter((id) => id === questionId).length;
    if (occurrences > 0) {
      totalCount += occurrences;
      papersWithQuestion.push({
        id: paper.id,
        shortName: paper.shortName,
        title: paper.title,
        count: occurrences,
      });
    }
  }

  return {
    totalCount,
    papers: papersWithQuestion,
  };
}

// ==========================================
// INITIAL DATABASE SEEDING
// ==========================================

export async function seedInitialData(): Promise<boolean> {
  const subjectCount = await db.subjects.count();
  if (subjectCount > 0) {
    return false; // Already seeded
  }

  await db.transaction('rw', [db.subjects, db.chapters, db.topics, db.stimuli, db.questions], async () => {
    // 1. Primary Subject
    const subject1 = await addSubject('পদার্থবিজ্ঞান ১ম পত্র', 1);

    // Chapter 1: মহাকর্ষ ও অভিকর্ষ
    const chapter1 = await addChapter(subject1.id, 'মহাকর্ষ ও অভিকর্ষ', 1);

    // Topic 1: মহাকর্ষীয় বিভব
    const topic1 = await addTopic(chapter1.id, 'মহাকর্ষীয় বিভব', 1);

    // Stimulus for Topic 1
    const stimulusText =
      'চিত্রে AB = BC = CA = 15 m। D বিন্দু BC এর মধ্যবিন্দু। $m_B = 60\\ \\text{kg}$, $m_C = 70\\ \\text{kg}$';
    const stimulus1 = await addStimulus(topic1.id, stimulusText, [], "DB'২৫");

    // Question গ)
    await addQuestion({
      stimulusId: stimulus1.id,
      topicId: topic1.id,
      type: 'গ',
      marks: 3,
      rating: 3,
      order: 1,
      questionText: 'A বিন্দুতে বিভবের মান কত? বের করো।',
      solutionText:
        '$V_A = V_{BA} + V_{CA} = -\\frac{Gm_B}{AB} - \\frac{Gm_C}{AC} = -\\frac{G}{15}(m_B + m_C) = -\\frac{6.673 \\times 10^{-11}}{15}(60+70) = -5.7833 \\times 10^{-10}\\ \\text{J kg}^{-1}$',
      solutionImageIds: [],
      usedInBoards: [{ board: 'DB', years: [2025] }],
    });

    // Question ঘ)
    await addQuestion({
      stimulusId: stimulus1.id,
      topicId: topic1.id,
      type: 'ঘ',
      marks: 4,
      rating: 4,
      order: 2,
      questionText: 'A ও D বিন্দুর প্রাবল্যের মানের তুলনা করো।',
      solutionText:
        '$E_1 = \\frac{Gm_B}{BD^2} = \\frac{6.673\\times10^{-11}\\times60}{(7.5)^2} = 7.12\\times10^{-11}\\ \\text{N kg}^{-1}$, $E_2 = \\frac{Gm_C}{CD^2} = 8.3\\times10^{-11}\\ \\text{N kg}^{-1}$, লব্ধি প্রাবল্য $E_D = E_2 - E_1 = 1.18\\times10^{-11}\\ \\text{N kg}^{-1}$',
      solutionImageIds: [],
      usedInBoards: [{ board: 'DB', years: [2025] }],
    });

    // Additional Sample Chapters & Topics as requested
    const chapter2 = await addChapter(subject1.id, 'নিউটনীয় বলবিদ্যা', 2);
    await addTopic(chapter2.id, 'ভরবেগ ও ঘাতবল', 1);

    const chapter3 = await addChapter(subject1.id, 'কাজ, শক্তি ও ক্ষমতা', 3);
    await addTopic(chapter3.id, 'গতিশক্তি ও কাজ-শক্তি উপপাদ্য', 1);
  });

  return true;
}
