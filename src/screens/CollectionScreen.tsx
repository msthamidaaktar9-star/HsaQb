import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '../components/Header';
import { useToast } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PromptDialog } from '../components/PromptDialog';
import { QuestionFormModal } from '../components/QuestionFormModal';
import { ImportCollectionModal } from '../components/ImportCollectionModal';
import { exportQuestionCollection } from '../utils/collectionTransfer';
import { RichText } from '../components/RichText';
import { KebabMenu, type MenuItem } from '../components/KebabMenu';
import { toBn, toBnPad2 } from '../utils/toBn';
import { useNavigation } from '../utils/navigation';
import {
  seedInitialDataIfNeeded,
  getSubjects,
  getChapters,
  getTopics,
  getQuestionsByTopicGrouped,
  getHierarchyStats,
  getSelectedIds,
  toggleSelected,
  clearSelection,
  copyQuestion,
  pasteAfter,
  getClipboard,
  getRatingStarsText,
  getQuestionPaperUsage,
  getImageBlobUrl,
  addSubject,
  updateSubject,
  deleteSubject,
  reorderSubjects,
  addChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  addTopic,
  updateTopic,
  deleteTopic,
  reorderTopics,
  deleteQuestion,
  reorderQuestions,
  type Subject,
  type Chapter,
  type Topic,
  type Question,
  type StimulusWithQuestions,
  type HierarchyStats,
  type QuestionPaperUsage,
} from '../db/api';
import {
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Check,
  Search,
  CheckSquare,
  Square,
  Plus,
  RefreshCw,
  FolderOpen,
  Eye,
  EyeOff,
  Copy,
  PlusCircle,
  FileEdit,
  Trash2,
  Tag,
  Award,
  Layers,
  Upload,
  Download,
} from 'lucide-react';

type DrillView =
  | { level: 'subjects' }
  | { level: 'chapters'; subject: Subject }
  | { level: 'topics'; subject: Subject; chapter: Chapter }
  | { level: 'questions'; subject: Subject; chapter: Chapter; topic: Topic };

export const CollectionScreen: React.FC = () => {
  const { showToast } = useToast();
  const { registerBackHandler } = useNavigation();

  // Navigation Drill-down View State
  const [currentView, setCurrentView] = useState<DrillView>({ level: 'subjects' });

  // Data states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questionGroups, setQuestionGroups] = useState<StimulusWithQuestions[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stats, setStats] = useState<HierarchyStats>({
    subjectStats: {},
    chapterStats: {},
    topicStats: {},
  });
  const [questionUsages, setQuestionUsages] = useState<Record<string, QuestionPaperUsage[]>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Loading & Modes
  const [loading, setLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  // Dialog States
  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    title: string;
    initialValue: string;
    onConfirm: (val: string) => void;
  }>({
    isOpen: false,
    title: '',
    initialValue: '',
    onConfirm: () => {},
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [questionFormState, setQuestionFormState] = useState<{
    isOpen: boolean;
    initialTopicId?: string;
    editQuestionId?: string | null;
  }>({
    isOpen: false,
    initialTopicId: undefined,
    editQuestionId: null,
  });

  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Load Hierarchy Data based on current view
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await seedInitialDataIfNeeded();

      const [subList, statsData, selIds] = await Promise.all([
        getSubjects(),
        getHierarchyStats(),
        getSelectedIds(),
      ]);

      setSubjects(subList);
      setStats(statsData);
      setSelectedIds(selIds);

      if (currentView.level === 'chapters') {
        const chList = await getChapters(currentView.subject.id);
        setChapters(chList);
      } else if (currentView.level === 'topics') {
        const topList = await getTopics(currentView.chapter.id);
        setTopics(topList);
      } else if (currentView.level === 'questions') {
        const grpList = await getQuestionsByTopicGrouped(currentView.topic.id);
        setQuestionGroups(grpList);

        // Fetch usages and image blobs for questions & stimuli
        const usages: Record<string, QuestionPaperUsage[]> = {};
        const urls: Record<string, string> = {};

        for (const grp of grpList) {
          if (grp.stimulus?.imageIds) {
            for (const imgId of grp.stimulus.imageIds) {
              const url = await getImageBlobUrl(imgId);
              if (url) urls[imgId] = url;
            }
          }
          for (const q of grp.questions) {
            usages[q.id] = await getQuestionPaperUsage(q.id);
            if (q.solutionImageIds) {
              for (const imgId of q.solutionImageIds) {
                const url = await getImageBlobUrl(imgId);
                if (url) urls[imgId] = url;
              }
            }
          }
        }
        setQuestionUsages(usages);
        setImageUrls(urls);
      }
    } catch (err: any) {
      console.error('Error loading collection data:', err);
      showToast('ডাটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }, [currentView, showToast]);

  useEffect(() => {
    loadData();
    setIsReordering(false);
  }, [loadData]);

  // Handle hardware & UI Back Navigation
  const handleGoBack = useCallback((): boolean => {
    if (isReordering) {
      setIsReordering(false);
      return true;
    }

    if (currentView.level === 'questions') {
      setCurrentView({
        level: 'topics',
        subject: currentView.subject,
        chapter: currentView.chapter,
      });
      return true;
    }

    if (currentView.level === 'topics') {
      setCurrentView({
        level: 'chapters',
        subject: currentView.subject,
      });
      return true;
    }

    if (currentView.level === 'chapters') {
      setCurrentView({ level: 'subjects' });
      return true;
    }

    return false; // Already at Subjects level
  }, [currentView, isReordering]);

  // Register with Capacitor Back Button listener
  useEffect(() => {
    const unregister = registerBackHandler(() => {
      return handleGoBack();
    });
    return unregister;
  }, [handleGoBack, registerBackHandler]);

  // Reorder Item Up / Down
  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (currentView.level === 'subjects') {
      if (targetIndex < 0 || targetIndex >= subjects.length) return;
      const newList = [...subjects];
      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;
      setSubjects(newList);
    } else if (currentView.level === 'chapters') {
      if (targetIndex < 0 || targetIndex >= chapters.length) return;
      const newList = [...chapters];
      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;
      setChapters(newList);
    } else if (currentView.level === 'topics') {
      if (targetIndex < 0 || targetIndex >= topics.length) return;
      const newList = [...topics];
      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;
      setTopics(newList);
    }
  };

  // Save new reorder order to DB
  const handleSaveReorder = async () => {
    try {
      if (currentView.level === 'subjects') {
        await reorderSubjects(subjects.map((s) => s.id));
      } else if (currentView.level === 'chapters') {
        await reorderChapters(chapters.map((c) => c.id));
      } else if (currentView.level === 'topics') {
        await reorderTopics(topics.map((t) => t.id));
      }
      setIsReordering(false);
      showToast('নতুন ক্রম সংরক্ষিত হয়েছে');
      loadData();
    } catch {
      showToast('ক্রম সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  // Toggle question selection
  const handleToggleSelect = async (questionId: string) => {
    try {
      const next = await toggleSelected(questionId);
      setSelectedIds(next);
      const isSelected = next.includes(questionId);
      showToast(isSelected ? 'প্রশ্ন নির্বাচন করা হয়েছে' : 'নির্বাচন বাতিল করা হয়েছে');
      // refresh stats
      const statsData = await getHierarchyStats();
      setStats(statsData);
    } catch {
      showToast('নির্বাচন আপডেট করা যায়নি');
    }
  };

  // Clear all selections
  const handleClearAllSelection = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'সব নির্বাচন মুছবেন?',
      message: 'নির্বাচিত সকল প্রশ্নের তালিকা মুছে ফেলতে চান?',
      onConfirm: async () => {
        await clearSelection();
        setSelectedIds([]);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('সব নির্বাচন সফলভাবে মোছা হয়েছে');
        const statsData = await getHierarchyStats();
        setStats(statsData);
      },
    });
  };

  // Copy Question
  const handleCopyQuestion = async (questionId: string) => {
    try {
      await copyQuestion(questionId);
      showToast('কপি হয়েছে');
    } catch {
      showToast('কপি করতে ব্যর্থ হয়েছে');
    }
  };

  // Paste after Question
  const handlePasteAfterQuestion = async (targetQuestionId: string) => {
    try {
      const clip = await getClipboard();
      if (!clip) {
        showToast('আগে Copy করুন');
        return;
      }
      const created = await pasteAfter(targetQuestionId);
      if (created) {
        showToast('পেস্ট করা হয়েছে');
        loadData();
      }
    } catch {
      showToast('পেস্ট করতে ব্যর্থ হয়েছে');
    }
  };

  // Delete Question
  const handleDeleteQuestion = (questionId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'প্রশ্ন মুছবেন?',
      message: 'আপনি কি নিশ্চিত যে এই প্রশ্নটি মুছে ফেলতে চান?',
      onConfirm: async () => {
        await deleteQuestion(questionId);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('প্রশ্ন মুছে ফেলা হয়েছে');
        loadData();
      },
    });
  };

  // Add Item Dialog Handler
  const handleOpenAddDialog = () => {
    if (currentView.level === 'subjects') {
      setPromptDialog({
        isOpen: true,
        title: 'নতুন বিষয় যোগ করুন',
        initialValue: '',
        onConfirm: async (val) => {
          await addSubject(val);
          setPromptDialog((prev) => ({ ...prev, isOpen: false }));
          showToast('নতুন বিষয় যোগ হয়েছে');
          loadData();
        },
      });
    } else if (currentView.level === 'chapters') {
      const subject = currentView.subject;
      setPromptDialog({
        isOpen: true,
        title: 'নতুন অধ্যায় যোগ করুন',
        initialValue: '',
        onConfirm: async (val) => {
          await addChapter(subject.id, val);
          setPromptDialog((prev) => ({ ...prev, isOpen: false }));
          showToast('নতুন অধ্যায় যোগ হয়েছে');
          loadData();
        },
      });
    } else if (currentView.level === 'topics') {
      const chapter = currentView.chapter;
      setPromptDialog({
        isOpen: true,
        title: 'নতুন টপিক যোগ করুন',
        initialValue: '',
        onConfirm: async (val) => {
          await addTopic(chapter.id, val);
          setPromptDialog((prev) => ({ ...prev, isOpen: false }));
          showToast('নতুন টপিক যোগ হয়েছে');
          loadData();
        },
      });
    } else if (currentView.level === 'questions') {
      setQuestionFormState({
        isOpen: true,
        initialTopicId: currentView.topic.id,
        editQuestionId: null,
      });
    }
  };

  // Rename Level Parent / Self Item
  const handleRenameItem = (type: 'subject' | 'chapter' | 'topic', id: string, currentName: string) => {
    setPromptDialog({
      isOpen: true,
      title: 'নাম পরিবর্তন করুন',
      initialValue: currentName,
      onConfirm: async (newName) => {
        if (type === 'subject') await updateSubject(id, newName);
        else if (type === 'chapter') await updateChapter(id, newName);
        else if (type === 'topic') await updateTopic(id, newName);

        setPromptDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('নাম সফলভাবে পরিবর্তন হয়েছে');
        loadData();
      },
    });
  };

  // Delete Level Item
  const handleDeleteItem = (type: 'subject' | 'chapter' | 'topic', id: string, name: string) => {
    const label = type === 'subject' ? 'বিষয়' : type === 'chapter' ? 'অধ্যায়' : 'টপিক';
    setConfirmDialog({
      isOpen: true,
      title: `${label} মুছবেন?`,
      message: `"${name}" ${label}টি মুছে ফেললে এর ভেতরের সকল তথ্য ও প্রশ্ন স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?`,
      onConfirm: async () => {
        if (type === 'subject') await deleteSubject(id);
        else if (type === 'chapter') await deleteChapter(id);
        else if (type === 'topic') await deleteTopic(id);

        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`${label} মুছে ফেলা হয়েছে`);

        if (
          (type === 'chapter' && currentView.level === 'topics' && currentView.chapter.id === id) ||
          (type === 'topic' && currentView.level === 'questions' && currentView.topic.id === id)
        ) {
          handleGoBack();
        } else {
          loadData();
        }
      },
    });
  };

  // Top Bar Breadcrumb path string
  const breadcrumbString = useMemo(() => {
    if (currentView.level === 'subjects') {
      return '';
    }
    if (currentView.level === 'chapters') {
      return `${toBnPad2(currentView.subject.order)}. ${currentView.subject.name}`;
    }
    if (currentView.level === 'topics') {
      return `${toBnPad2(currentView.subject.order)}. ${currentView.subject.name} › ${toBnPad2(
        currentView.chapter.order
      )}. ${currentView.chapter.name}`;
    }
    if (currentView.level === 'questions') {
      return `${toBnPad2(currentView.subject.order)}. ${currentView.subject.name} › ${toBnPad2(
        currentView.chapter.order
      )}. ${currentView.chapter.name} › ${toBnPad2(currentView.topic.order)}. ${currentView.topic.name}`;
    }
    return '';
  }, [currentView]);

  // Current view title
  const currentTitle = useMemo(() => {
    if (currentView.level === 'subjects') return 'বিষয় তালিকা (Subjects)';
    if (currentView.level === 'chapters') return currentView.subject.name;
    if (currentView.level === 'topics') return currentView.chapter.name;
    if (currentView.level === 'questions') return currentView.topic.name;
    return 'কালেকশন';
  }, [currentView]);

  // Header KebabMenu Items
  const headerMenuItems = useMemo((): MenuItem[] => {
    const items: MenuItem[] = [];

    // Add Action
    let addLabel = 'নতুন বিষয় যোগ করুন';
    if (currentView.level === 'chapters') addLabel = 'নতুন অধ্যায় যোগ করুন';
    if (currentView.level === 'topics') addLabel = 'নতুন টপিক যোগ করুন';
    if (currentView.level === 'questions') addLabel = 'নতুন প্রশ্ন যোগ করুন';

    items.push({
      id: 'add',
      label: addLabel,
      icon: <PlusCircle className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: handleOpenAddDialog,
    });

    // Rename & Delete for active screen container (if inside a chapter/topic/subject)
    if (currentView.level === 'chapters') {
      items.push({
        id: 'rename-subj',
        label: 'বিষয়ের নাম পরিবর্তন',
        icon: <FileEdit className="w-4 h-4 text-[#1B1F2A]" />,
        onClick: () => handleRenameItem('subject', currentView.subject.id, currentView.subject.name),
      });
      items.push({
        id: 'delete-subj',
        label: 'বিষয় মুছে ফেলুন',
        icon: <Trash2 className="w-4 h-4 text-red-500" />,
        isDestructive: true,
        onClick: () => handleDeleteItem('subject', currentView.subject.id, currentView.subject.name),
      });
    } else if (currentView.level === 'topics') {
      items.push({
        id: 'rename-chap',
        label: 'অধ্যায়ের নাম পরিবর্তন',
        icon: <FileEdit className="w-4 h-4 text-[#1B1F2A]" />,
        onClick: () => handleRenameItem('chapter', currentView.chapter.id, currentView.chapter.name),
      });
      items.push({
        id: 'delete-chap',
        label: 'অধ্যায় মুছে ফেলুন',
        icon: <Trash2 className="w-4 h-4 text-red-500" />,
        isDestructive: true,
        onClick: () => handleDeleteItem('chapter', currentView.chapter.id, currentView.chapter.name),
      });
    } else if (currentView.level === 'questions') {
      items.push({
        id: 'rename-top',
        label: 'টপিকের নাম পরিবর্তন',
        icon: <FileEdit className="w-4 h-4 text-[#1B1F2A]" />,
        onClick: () => handleRenameItem('topic', currentView.topic.id, currentView.topic.name),
      });
      items.push({
        id: 'delete-top',
        label: 'টপিক মুছে ফেলুন',
        icon: <Trash2 className="w-4 h-4 text-red-500" />,
        isDestructive: true,
        onClick: () => handleDeleteItem('topic', currentView.topic.id, currentView.topic.name),
      });
    }

    // Subjects level extras
    if (currentView.level === 'subjects') {
      items.push({
        id: 'import',
        label: 'Import Question Collection',
        icon: <Upload className="w-4 h-4 text-[#3B4FD8]" />,
        onClick: () => setShowImportModal(true),
      });
      items.push({
        id: 'export',
        label: 'Export Question Collection',
        icon: <Download className="w-4 h-4 text-[#3B4FD8]" />,
        onClick: async () => {
          try {
            const ok = await exportQuestionCollection();
            if (ok) {
              showToast('প্রশ্ন কালেকশন সফলভাবে এক্সপোর্ট হয়েছে');
            } else {
              showToast('কালেকশন এক্সপোর্ট করা যায়নি');
            }
          } catch {
            showToast('কালেকশন এক্সপোর্ট ব্যর্থ হয়েছে');
          }
        },
      });
    }

    // Clear Selection
    items.push({
      id: 'clear-sel',
      label: 'সব নির্বাচন মুছুন',
      icon: <Square className="w-4 h-4 text-red-500" />,
      isDestructive: true,
      onClick: handleClearAllSelection,
    });

    return items;
  }, [currentView, showToast]);

  // Filter questions by search query
  const filteredQuestionGroups = useMemo(() => {
    if (!searchQuery.trim()) return questionGroups;
    const query = searchQuery.toLowerCase().trim();

    return questionGroups
      .map((grp) => {
        const stimulusMatches =
          (grp.stimulus?.text && grp.stimulus.text.toLowerCase().includes(query)) ||
          (grp.stimulus?.boardTag && grp.stimulus.boardTag.toLowerCase().includes(query));

        const matchedQuestions = grp.questions.filter((q) => {
          const textMatch = q.questionText.toLowerCase().includes(query);
          const solMatch = q.solutionText && q.solutionText.toLowerCase().includes(query);
          const boardMatch = q.usedInBoards.some(
            (b) =>
              b.board.toLowerCase().includes(query) ||
              b.years.some((y) => String(y).includes(query) || toBn(y).includes(query))
          );
          return textMatch || solMatch || boardMatch || stimulusMatches;
        });

        if (matchedQuestions.length > 0) {
          return {
            ...grp,
            questions: matchedQuestions,
          };
        }
        return null;
      })
      .filter(Boolean) as StimulusWithQuestions[];
  }, [questionGroups, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-h-full pb-20 bg-[#F2F4F8]">
      {/* Top Header */}
      <Header
        title={currentTitle}
        showBack={currentView.level !== 'subjects'}
        onBack={handleGoBack}
        menuItems={headerMenuItems}
      />

      {/* Top Control Bar (Breadcrumbs, Reorder, Selection Counter) */}
      <div className="bg-white border-b border-[#D5D9E2] px-3.5 py-2.5 shadow-2xs space-y-2">
        {/* Breadcrumb Path (when inside hierarchy) */}
        {breadcrumbString && (
          <div className="flex items-center gap-1.5 text-xs text-[#2A3BB0] font-medium overflow-x-auto whitespace-nowrap no-scrollbar py-0.5">
            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#3B4FD8]" />
            <span className="truncate">{breadcrumbString}</span>
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Reorder button (for lists) or Selection info */}
          {currentView.level !== 'questions' ? (
            <button
              type="button"
              aria-label={isReordering ? 'ক্রম সংরক্ষণ করুন' : 'ক্রম পরিবর্তন করুন'}
              onClick={isReordering ? handleSaveReorder : () => setIsReordering(true)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isReordering
                  ? 'bg-[#3B4FD8] text-white border-[#3B4FD8]'
                  : 'bg-[#EEF2FF] text-[#2A3BB0] border-[#D5D9E2] hover:bg-[#E0E7FF]'
              }`}
            >
              {isReordering ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-[#3B4FD8]" />
                  <span>Reorder</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#2A3BB0] text-xs font-bold border border-[#D5D9E2]">
                {toBn(selectedIds.length)} নির্বাচিত
              </span>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllSelection}
                  className="min-h-[44px] text-xs text-red-600 hover:text-red-700 font-semibold px-2"
                >
                  Clear all selection
                </button>
              )}
            </div>
          )}

          {/* Right: Quick Total Counter */}
          <div className="text-xs text-[#64748B] font-medium">
            {currentView.level === 'subjects' && `মোট বিষয়: ${toBn(subjects.length)}টি`}
            {currentView.level === 'chapters' && `মোট অধ্যায়: ${toBn(chapters.length)}টি`}
            {currentView.level === 'topics' && `মোট টপিক: ${toBn(topics.length)}টি`}
            {currentView.level === 'questions' && `মোট গ্রুপ: ${toBn(filteredQuestionGroups.length)}টি`}
          </div>
        </div>

        {/* Search Box on Questions Screen */}
        {currentView.level === 'questions' && (
          <div className="relative pt-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রশ্ন, উদ্দীপক বা বোর্ড ট্যাগ খুঁজুন..."
              className="w-full min-h-[44px] pl-9 pr-8 py-2 rounded-xl bg-[#F2F4F8] border border-[#D5D9E2] text-xs text-[#1B1F2A] focus:outline-none focus:ring-2 focus:ring-[#3B4FD8] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="অনুসন্ধান মুছুন"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#1B1F2A] p-1 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 space-y-3">
        {loading && (
          <div className="py-16 text-center text-xs text-[#64748B] flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#3B4FD8]" />
            <span>ডাটা লোড হচ্ছে...</span>
          </div>
        )}

        {/* ---------------- LEVEL 0: SUBJECTS ---------------- */}
        {!loading && currentView.level === 'subjects' && (
          <div className="space-y-2.5">
            {subjects.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#D5D9E2] space-y-3">
                <p className="text-sm text-[#64748B]">কোনো বিষয় যুক্ত করা হয়নি</p>
                <button
                  type="button"
                  onClick={handleOpenAddDialog}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#3B4FD8] text-white text-xs font-semibold"
                >
                  + বিষয় যোগ করুন
                </button>
              </div>
            ) : (
              subjects.map((subject, index) => {
                const subStat = stats.subjectStats[subject.id] || { total: 0, selected: 0 };
                const padOrder = toBnPad2(subject.order || index + 1);

                return (
                  <div
                    key={subject.id}
                    className="bg-white rounded-2xl p-3.5 border border-[#D5D9E2] shadow-xs flex items-center justify-between gap-3 hover:border-[#3B4FD8] transition-all cursor-pointer select-none"
                    onClick={() => {
                      if (!isReordering) {
                        setCurrentView({ level: 'chapters', subject });
                      }
                    }}
                  >
                    {/* Left: Blue Square with Bengali Serial */}
                    <div className="w-10 h-10 rounded-xl bg-[#3B4FD8] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {padOrder}
                    </div>

                    {/* Middle: Name & Count Subtitle */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-[#1B1F2A] truncate leading-snug">
                        {subject.name}
                      </h2>
                      <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
                        {toBn(subStat.total)}টি প্রশ্ন · {toBn(subStat.selected)} নির্বাচিত
                      </p>
                    </div>

                    {/* Right: Reorder Buttons or Kebab Menu + Chevron */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isReordering ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="উপরে সরান"
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, 'up')}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#F2F4F8] hover:bg-[#EEF2FF] text-[#1B1F2A] disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="নিচে সরান"
                            disabled={index === subjects.length - 1}
                            onClick={() => handleMoveItem(index, 'down')}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#F2F4F8] hover:bg-[#EEF2FF] text-[#1B1F2A] disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <KebabMenu
                            items={[
                              {
                                id: 'rename',
                                label: 'নাম পরিবর্তন',
                                onClick: () => handleRenameItem('subject', subject.id, subject.name),
                              },
                              {
                                id: 'delete',
                                label: 'মুছে ফেলুন',
                                isDestructive: true,
                                onClick: () => handleDeleteItem('subject', subject.id, subject.name),
                              },
                            ]}
                          />
                          <ChevronRight className="w-5 h-5 text-[#64748B]" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ---------------- LEVEL 1: CHAPTERS ---------------- */}
        {!loading && currentView.level === 'chapters' && (
          <div className="space-y-2.5">
            {chapters.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#D5D9E2] space-y-3">
                <p className="text-sm text-[#64748B]">এই বিষয়ে এখনো অধ্যায় নেই</p>
                <button
                  type="button"
                  onClick={handleOpenAddDialog}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#3B4FD8] text-white text-xs font-semibold"
                >
                  + অধ্যায় যোগ করুন
                </button>
              </div>
            ) : (
              chapters.map((chapter, index) => {
                const chapStat = stats.chapterStats[chapter.id] || { total: 0, selected: 0 };
                const padOrder = toBnPad2(chapter.order || index + 1);

                return (
                  <div
                    key={chapter.id}
                    className="bg-white rounded-2xl p-3.5 border border-[#D5D9E2] shadow-xs flex items-center justify-between gap-3 hover:border-[#3B4FD8] transition-all cursor-pointer select-none"
                    onClick={() => {
                      if (!isReordering) {
                        setCurrentView({
                          level: 'topics',
                          subject: currentView.subject,
                          chapter,
                        });
                      }
                    }}
                  >
                    {/* Left: Blue Square with Bengali Serial */}
                    <div className="w-10 h-10 rounded-xl bg-[#3B4FD8] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {padOrder}
                    </div>

                    {/* Middle: Name & Count Subtitle */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-[#1B1F2A] truncate leading-snug">
                        {chapter.name}
                      </h2>
                      <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
                        {toBn(chapStat.total)}টি প্রশ্ন · {toBn(chapStat.selected)} নির্বাচিত
                      </p>
                    </div>

                    {/* Right: Reorder or Kebab + Chevron */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isReordering ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="উপরে সরান"
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, 'up')}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#F2F4F8] hover:bg-[#EEF2FF] text-[#1B1F2A] disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="নিচে সরান"
                            disabled={index === chapters.length - 1}
                            onClick={() => handleMoveItem(index, 'down')}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#F2F4F8] hover:bg-[#EEF2FF] text-[#1B1F2A] disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <KebabMenu
                            items={[
                              {
                                id: 'rename',
                                label: 'নাম পরিবর্তন',
                                onClick: () => handleRenameItem('chapter', chapter.id, chapter.name),
                              },
                              {
                                id: 'delete',
                                label: 'মুছে ফেলুন',
                                isDestructive: true,
                                onClick: () => handleDeleteItem('chapter', chapter.id, chapter.name),
                              },
                            ]}
                          />
                          <ChevronRight className="w-5 h-5 text-[#64748B]" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ---------------- LEVEL 2: TOPICS ---------------- */}
        {!loading && currentView.level === 'topics' && (
          <div className="space-y-2.5">
            {topics.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#D5D9E2] space-y-3">
                <p className="text-sm text-[#64748B]">এই অধ্যায়ে এখনো কোনো টপিক নেই</p>
                <button
                  type="button"
                  onClick={handleOpenAddDialog}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#3B4FD8] text-white text-xs font-semibold"
                >
                  + টপিক যোগ করুন
                </button>
              </div>
            ) : (
              topics.map((topic, index) => {
                const topStat = stats.topicStats[topic.id] || { total: 0, selected: 0 };
                const padOrder = toBnPad2(topic.order || index + 1);

                return (
                  <div
                    key={topic.id}
                    className="bg-white rounded-2xl p-3.5 border border-[#D5D9E2] shadow-xs flex items-center justify-between gap-3 hover:border-[#3B4FD8] transition-all cursor-pointer select-none"
                    onClick={() => {
                      if (!isReordering) {
                        setCurrentView({
                          level: 'questions',
                          subject: currentView.subject,
                          chapter: currentView.chapter,
                          topic,
                        });
                      }
                    }}
                  >
                    {/* Left: Blue Square with Bengali Serial */}
                    <div className="w-10 h-10 rounded-xl bg-[#3B4FD8] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {padOrder}
                    </div>

                    {/* Middle: Name & Count Subtitle */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-[#1B1F2A] truncate leading-snug">
                        {topic.name}
                      </h2>
                      <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
                        {toBn(topStat.total)}টি প্রশ্ন · {toBn(topStat.selected)} নির্বাচিত
                      </p>
                    </div>

                    {/* Right: Reorder or Kebab + Chevron */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isReordering ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="উপরে সরান"
                            disabled={index === 0}
                            onClick={() => handleMoveItem(index, 'up')}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#F2F4F8] hover:bg-[#EEF2FF] text-[#1B1F2A] disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="নিচে সরান"
                            disabled={index === topics.length - 1}
                            onClick={() => handleMoveItem(index, 'down')}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#F2F4F8] hover:bg-[#EEF2FF] text-[#1B1F2A] disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <KebabMenu
                            items={[
                              {
                                id: 'rename',
                                label: 'নাম পরিবর্তন',
                                onClick: () => handleRenameItem('topic', topic.id, topic.name),
                              },
                              {
                                id: 'delete',
                                label: 'মুছে ফেলুন',
                                isDestructive: true,
                                onClick: () => handleDeleteItem('topic', topic.id, topic.name),
                              },
                            ]}
                          />
                          <ChevronRight className="w-5 h-5 text-[#64748B]" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ---------------- LEVEL 3: QUESTIONS LIST ---------------- */}
        {!loading && currentView.level === 'questions' && (
          <div className="space-y-4">
            {filteredQuestionGroups.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-[#D5D9E2] space-y-3">
                <p className="text-sm font-semibold text-[#1B1F2A]">
                  {searchQuery ? 'অনুসন্ধানের সাথে কোনো প্রশ্ন মেলেনি' : 'এই টপিকে এখনো প্রশ্ন নেই'}
                </p>
                <p className="text-xs text-[#64748B]">
                  নতুন প্রশ্ন তৈরি করে এই টপিকে যুক্ত করুন।
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setQuestionFormState({
                      isOpen: true,
                      initialTopicId: currentView.topic.id,
                      editQuestionId: null,
                    })
                  }
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#3B4FD8] hover:bg-[#2A3BB0] text-white text-xs font-semibold shadow-xs"
                >
                  + Add question
                </button>
              </div>
            ) : (
              filteredQuestionGroups.map((grp, grpIdx) => (
                <section
                  key={grp.stimulus?.id || `group-${grpIdx}`}
                  className="bg-white rounded-xl p-4 border border-[#D5D9E2] shadow-xs space-y-3.5"
                >
                  {/* Stimulus Section if present */}
                  {grp.stimulus && (
                    <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#2A3BB0]">উদ্দীপক</span>
                        {grp.stimulus.boardTag && (
                          <span className="px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#3B4FD8] font-bold text-[11px] border border-[#D5D9E2]">
                            বোর্ড: {grp.stimulus.boardTag}
                          </span>
                        )}
                      </div>

                      {/* Stimulus Text */}
                      <RichText text={grp.stimulus.text} className="text-sm font-medium leading-relaxed" />

                      {/* Stimulus Image from Blob URL */}
                      {grp.stimulus.imageIds &&
                        grp.stimulus.imageIds.map((imgId) => {
                          const url = imageUrls[imgId];
                          if (!url) return null;
                          return (
                            <div key={imgId} className="w-full my-2 overflow-hidden rounded-xl border border-[#D5D9E2] bg-white">
                              <img src={url} alt="উদ্দীপকের চিত্র" className="w-full h-auto object-contain max-h-64" />
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Question Cards (গ, ঘ, etc.) */}
                  <div className="space-y-3 pt-1">
                    {grp.questions.map((question: Question, qIdx: number) => {
                      const isSelected = selectedIds.includes(question.id);
                      const usages = questionUsages[question.id] || [];
                      const starsText = getRatingStarsText(question.rating);
                      const isSolutionOpen = expandedSolutions[question.id] || false;

                      return (
                        <article
                          key={question.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-[#3B4FD8] bg-[#EEF2FF]/25 ring-1 ring-[#3B4FD8]'
                              : 'border-[#D5D9E2] bg-white'
                          }`}
                        >
                          {/* Top Row: Serial Circle, Checkbox, Rating Badge, Kebab Menu */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-[#F2F4F8]">
                            <div className="flex items-center gap-2">
                              {/* Serial circle */}
                              <span className="w-7 h-7 rounded-full bg-[#3B4FD8] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {toBn(qIdx + 1)}
                              </span>

                              {/* Checkbox with minimum 44px tap target */}
                              <button
                                type="button"
                                aria-label={isSelected ? 'প্রশ্ন নির্বাচন বাতিল করুন' : 'প্রশ্ন নির্বাচন করুন'}
                                onClick={() => handleToggleSelect(question.id)}
                                className="min-h-[44px] min-w-[44px] -my-2 flex items-center justify-center text-[#3B4FD8] hover:bg-[#EEF2FF] rounded-lg transition-colors"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 fill-[#3B4FD8] text-white" />
                                ) : (
                                  <Square className="w-5 h-5 text-[#64748B]" />
                                )}
                              </button>

                              {/* Rating Badge: Yellowish background with dark brownish text */}
                              <span className="px-2.5 py-0.5 rounded-md bg-[#FEF9C3] text-[#713F12] text-[11px] font-bold border border-[#FDE047] whitespace-nowrap shadow-2xs">
                                {starsText}
                              </span>
                            </div>

                            {/* Question Level Three-Dot Kebab Menu */}
                            <KebabMenu
                              items={[
                                {
                                  id: 'copy',
                                  label: 'Copy',
                                  icon: <Copy className="w-4 h-4 text-[#3B4FD8]" />,
                                  onClick: () => handleCopyQuestion(question.id),
                                },
                                {
                                  id: 'paste-after',
                                  label: 'Paste after',
                                  icon: <Plus className="w-4 h-4 text-[#2A3BB0]" />,
                                  onClick: () => handlePasteAfterQuestion(question.id),
                                },
                                {
                                  id: 'edit',
                                  label: 'Edit',
                                  icon: <FileEdit className="w-4 h-4 text-[#64748B]" />,
                                  onClick: () =>
                                    setQuestionFormState({
                                      isOpen: true,
                                      initialTopicId: question.topicId,
                                      editQuestionId: question.id,
                                    }),
                                },
                                {
                                  id: 'delete',
                                  label: 'Delete',
                                  icon: <Trash2 className="w-4 h-4 text-red-500" />,
                                  isDestructive: true,
                                  onClick: () => handleDeleteQuestion(question.id),
                                },
                              ]}
                            />
                          </div>

                          {/* Usage Tags Row: Board Chips & My Paper Chips */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                            {/* Board Chips */}
                            {question.usedInBoards && question.usedInBoards.length > 0 ? (
                              question.usedInBoards.map((b, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="px-2 py-0.5 rounded bg-[#F2F4F8] text-[#1B1F2A] text-[11px] font-medium border border-[#D5D9E2] flex items-center gap-1"
                                >
                                  <Tag className="w-3 h-3 text-[#64748B]" />
                                  <span>
                                    {b.board}'{b.years.map((y) => toBn(String(y).slice(-2))).join(',')}
                                  </span>
                                </span>
                              ))
                            ) : grp.stimulus?.boardTag ? (
                              <span className="px-2 py-0.5 rounded bg-[#F2F4F8] text-[#1B1F2A] text-[11px] font-medium border border-[#D5D9E2] flex items-center gap-1">
                                <Tag className="w-3 h-3 text-[#64748B]" />
                                <span>{grp.stimulus.boardTag}</span>
                              </span>
                            ) : null}

                            {/* Paper usage chips */}
                            {usages.map((u) => (
                              <span
                                key={u.paperId}
                                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1"
                              >
                                <Award className="w-3 h-3 text-emerald-600" />
                                <span>{u.shortName} ×{toBn(u.count)}</span>
                              </span>
                            ))}
                          </div>

                          {/* Question Text with Type & Marks Badge */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-[#3B4FD8] text-white text-[11px] font-bold">
                                {question.type} · {toBn(question.marks)}
                              </span>
                            </div>
                            <RichText text={question.questionText} className="text-sm font-semibold text-[#1B1F2A]" />
                          </div>

                          {/* Solution Toggle Button (min 44px) */}
                          <div className="pt-1">
                            <button
                              type="button"
                              aria-label={isSolutionOpen ? 'সমাধান লুকান' : 'সমাধান দেখুন'}
                              onClick={() =>
                                setExpandedSolutions((prev) => ({
                                  ...prev,
                                  [question.id]: !isSolutionOpen,
                                }))
                              }
                              className="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-[#D5D9E2] bg-white hover:bg-[#F2F4F8] text-xs font-semibold text-[#2A3BB0] flex items-center gap-1.5 transition-colors"
                            >
                              {isSolutionOpen ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  <span>সমাধান লুকাও</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  <span>সমাধান দেখো</span>
                                </>
                              )}
                            </button>

                            {/* Expanded Solution Box */}
                            {isSolutionOpen && (
                              <div className="mt-2.5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 animate-in fade-in duration-150">
                                <div className="text-[11px] font-bold text-[#2A3BB0] uppercase tracking-wider">
                                  সমাধান:
                                </div>
                                <RichText text={question.solutionText} className="text-xs text-[#1B1F2A] leading-relaxed" />

                                {question.solutionImageIds &&
                                  question.solutionImageIds.map((imgId) => {
                                    const url = imageUrls[imgId];
                                    if (!url) return null;
                                    return (
                                      <div key={imgId} className="w-full my-2 overflow-hidden rounded-xl border border-[#D5D9E2] bg-white">
                                        <img src={url} alt="সমাধানের চিত্র" className="w-full h-auto object-contain max-h-56" />
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button (+ Add question) on Questions Screen */}
      {currentView.level === 'questions' && (
        <button
          type="button"
          aria-label="নতুন প্রশ্ন যোগ করুন"
          onClick={() =>
            setQuestionFormState({
              isOpen: true,
              initialTopicId: currentView.topic.id,
              editQuestionId: null,
            })
          }
          className="fixed bottom-20 right-4 z-40 min-h-[48px] px-4 py-2.5 rounded-full bg-[#3B4FD8] hover:bg-[#2A3BB0] active:bg-[#202E91] text-white font-bold text-xs shadow-xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add question</span>
        </button>
      )}

      {/* Input Prompt Dialog (Add & Rename) */}
      <PromptDialog
        isOpen={promptDialog.isOpen}
        title={promptDialog.title}
        initialValue={promptDialog.initialValue}
        onConfirm={promptDialog.onConfirm}
        onCancel={() => setPromptDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="হ্যাঁ, নিশ্চিত"
        cancelText="না"
        isDestructive={true}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Full-Screen Question Add & Edit Modal */}
      <QuestionFormModal
        isOpen={questionFormState.isOpen}
        initialTopicId={questionFormState.initialTopicId}
        editQuestionId={questionFormState.editQuestionId}
        onClose={() =>
          setQuestionFormState({
            isOpen: false,
            initialTopicId: undefined,
            editQuestionId: null,
          })
        }
        onSaved={() => {
          loadData();
        }}
      />

      {/* Import Collection Modal */}
      <ImportCollectionModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};

export default CollectionScreen;
