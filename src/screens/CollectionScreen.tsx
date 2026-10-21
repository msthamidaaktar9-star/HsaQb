import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { MenuItem } from '../components/KebabMenu';
import { useToast } from '../components/Toast';
import { RichText } from '../components/RichText';
import { LatexEditor } from '../components/LatexEditor';
import { toBn } from '../utils/toBn';
import {
  seedInitialData,
  getSubjects,
  getChapters,
  getTopics,
  getQuestionsByTopic,
  toggleSelected,
  getSelectedIds,
  copyQuestion,
  pasteAfter,
  getRatingLabel,
  getQuestionUsageCount,
  QuestionUsageInfo,
  SubjectItem,
  ChapterItem,
  TopicItem,
  StimulusWithQuestions,
} from '../db';
import {
  Layers,
  RefreshCw,
  CheckCircle,
  Copy,
  ClipboardPaste,
  BookOpen,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CollectionScreenProps {
  canGoBack?: boolean;
  onBack?: () => void;
  onRequestConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export const CollectionScreen: React.FC<CollectionScreenProps> = ({ canGoBack, onBack }) => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [stimulusGroups, setStimulusGroups] = useState<StimulusWithQuestions[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, QuestionUsageInfo>>({});
  const [showEditorTest, setShowEditorTest] = useState(false);
  const [customLatex, setCustomLatex] = useState(
    'এখানে সমীকরণ পরীক্ষা করুন: $E = mc^2$ এবং $$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$'
  );

  // Load and seed database
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await seedInitialData();

      const subList = await getSubjects();
      setSubjects(subList);

      if (subList.length > 0) {
        const chapList = await getChapters(subList[0].id);
        setChapters(chapList);

        if (chapList.length > 0) {
          const topList = await getTopics(chapList[0].id);
          setTopics(topList);

          if (topList.length > 0) {
            const qGroups = await getQuestionsByTopic(topList[0].id);
            setStimulusGroups(qGroups);

            // Fetch usage counts
            const usages: Record<string, QuestionUsageInfo> = {};
            for (const grp of qGroups) {
              for (const q of grp.questions) {
                usages[q.id] = await getQuestionUsageCount(q.id);
              }
            }
            setUsageMap(usages);
          }
        }
      }

      const selIds = await getSelectedIds();
      setSelectedIds(selIds);
    } catch (err) {
      console.error('Error loading collection data:', err);
      showToast('ডাটা লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle question selection toggle
  const handleToggleSelect = async (questionId: string) => {
    const isNowSelected = await toggleSelected(questionId);
    setSelectedIds((prev) =>
      isNowSelected ? [...prev, questionId] : prev.filter((id) => id !== questionId)
    );
    showToast(isNowSelected ? 'প্রশ্নটি নির্বাচিত করা হয়েছে' : 'নির্বাচন বাতিল করা হয়েছে', 'info');
  };

  // Handle Copy Question
  const handleCopyQuestion = async (questionId: string) => {
    const success = await copyQuestion(questionId);
    if (success) {
      showToast('প্রশ্ন ক্লিপবোর্ডে কপি করা হয়েছে', 'success');
    }
  };

  // Handle Paste After
  const handlePasteAfter = async (targetQuestionId: string) => {
    const pasted = await pasteAfter(targetQuestionId);
    if (pasted) {
      showToast('প্রশ্ন নিচে পেস্ট করা হয়েছে!', 'success');
      await loadData();
    } else {
      showToast('ক্লিপবোর্ডে কোনো প্রশ্ন নেই! আগে একটি প্রশ্ন কপি করুন।', 'warning');
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'refresh',
      label: 'রিফ্রেশ ডাটা',
      icon: <RefreshCw className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: () => {
        loadData();
        showToast('ডাটাবেস সফলভাবে রিফ্রেশ হয়েছে', 'success');
      },
    },
    {
      id: 'toggle-editor',
      label: showEditorTest ? 'LaTeX পরীক্ষক বন্ধ করুন' : 'LaTeX সম্পাদক পরীক্ষা',
      icon: <Sparkles className="w-4 h-4 text-[#3B4FD8]" />,
      onClick: () => setShowEditorTest((prev) => !prev),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F4F8]">
      {/* Blue Header */}
      <Header
        title="Collection"
        subtitle={subjects[0]?.name || 'সংরক্ষিত প্রশ্ন ব্যাংক'}
        canGoBack={canGoBack}
        onBack={onBack}
        menuItems={menuItems}
      />

      <main className="flex-1 p-3.5 space-y-4 max-w-[390px] mx-auto w-full">
        {/* Hierarchy Context Badge */}
        {chapters.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D5D9E2] p-3 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2A3BB0]">
              <BookOpen className="w-4 h-4 text-[#3B4FD8]" />
              <span>{subjects[0]?.name}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 truncate">{chapters[0]?.name}</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
              <span className="bg-[#EEF1FD] text-[#3B4FD8] font-medium px-2.5 py-1 rounded-lg shrink-0">
                টপিক: {topics[0]?.name}
              </span>
              {chapters.slice(1).map((ch) => (
                <span
                  key={ch.id}
                  className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg shrink-0 text-xs"
                >
                  {ch.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible LaTeX Live Test Sandbox */}
        <div className="bg-white rounded-2xl border border-[#D5D9E2] overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowEditorTest((prev) => !prev)}
            aria-label="LaTeX সম্পাদক টগল"
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#EEF1FD] hover:bg-[#E0E7FF] transition-colors flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 text-[#3B4FD8] font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>LaTeX ও সমীকরণ সম্পাদক পরীক্ষক</span>
            </div>
            {showEditorTest ? (
              <ChevronUp className="w-4 h-4 text-[#3B4FD8]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#3B4FD8]" />
            )}
          </button>

          {showEditorTest && (
            <div className="p-3 border-t border-[#D5D9E2] space-y-3">
              <p className="text-xs text-slate-500">
                নিচের টুলবার বাটনগুলো চাপুন অথবা টাইপ করে KaTeX সমীকরণ রেন্ডারিং পরীক্ষা করুন:
              </p>
              <LatexEditor
                value={customLatex}
                onChange={setCustomLatex}
                placeholder="এখানে সূত্র লিখুন..."
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#3B4FD8]" />
            <p className="text-sm">ডাটাবেস লোড হচ্ছে...</p>
          </div>
        ) : stimulusGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#D5D9E2] p-8 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold text-[#1B1F2A]">কোনো প্রশ্ন পাওয়া যায়নি</h3>
            <button
              type="button"
              onClick={loadData}
              className="min-h-[44px] px-4 py-2 bg-[#3B4FD8] text-white text-xs font-semibold rounded-xl"
            >
              নমুনা ডাটা রি-সিড করুন
            </button>
          </div>
        ) : (
          /* Seeded Stimulus and Questions Display */
          stimulusGroups.map((group, gIndex) => (
            <div
              key={group.stimulus.id || gIndex}
              className="bg-white rounded-2xl border border-[#D5D9E2] overflow-hidden shadow-xs space-y-3"
            >
              {/* Stimulus Card Header */}
              {group.stimulus.text && (
                <div className="bg-[#FAFBFD] border-b border-[#D5D9E2] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#3B4FD8] bg-[#EEF1FD] px-2.5 py-1 rounded-md">
                      উদ্দীপক
                    </span>
                    {group.stimulus.boardTag && (
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {group.stimulus.boardTag}
                      </span>
                    )}
                  </div>

                  {/* Stimulus Text with KaTeX RichText */}
                  <div className="text-sm text-[#1B1F2A] font-medium leading-relaxed pt-1">
                    <RichText text={group.stimulus.text} />
                  </div>
                </div>
              )}

              {/* Questions Under This Stimulus */}
              <div className="p-3.5 space-y-4">
                {group.questions.map((q) => {
                  const isCurSelected = selectedIds.includes(q.id);
                  const usage = usageMap[q.id];

                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurSelected
                          ? 'border-[#3B4FD8] bg-[#EEF1FD]/30 shadow-xs'
                          : 'border-[#E2E8F0] bg-white hover:border-[#D5D9E2]'
                      }`}
                    >
                      {/* Question Subheader: Type, Marks, Rating, Board */}
                      <div className="flex items-center justify-between gap-1 text-xs mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-[#3B4FD8] text-white font-bold flex items-center justify-center text-xs">
                            {q.type}
                          </span>
                          <span className="text-slate-500 font-medium">
                            {toBn(q.marks)} নম্বর
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {getRatingLabel(q.rating)}
                          </span>
                        </div>

                        {/* Selection & Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyQuestion(q.id)}
                            aria-label="প্রশ্ন কপি করুন"
                            title="কপি করুন"
                            className="min-touch-target p-1.5 text-slate-500 hover:text-[#3B4FD8] hover:bg-[#EEF1FD] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePasteAfter(q.id)}
                            aria-label="নিচে পেস্ট করুন"
                            title="নিচে পেস্ট করুন"
                            className="min-touch-target p-1.5 text-slate-500 hover:text-[#3B4FD8] hover:bg-[#EEF1FD] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <ClipboardPaste className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(q.id)}
                            aria-label={isCurSelected ? 'নির্বাচন বাতিল করুন' : 'প্রশ্ন নির্বাচন করুন'}
                            className={`min-touch-target px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                              isCurSelected
                                ? 'bg-[#3B4FD8] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle className={`w-3.5 h-3.5 ${isCurSelected ? 'text-white' : 'text-slate-400'}`} />
                            <span>{isCurSelected ? 'নির্বাচিত' : 'নির্বাচন'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="text-sm font-medium text-[#1B1F2A] leading-relaxed mb-2.5 pl-1">
                        <RichText text={q.questionText} />
                      </div>

                      {/* Solution Block */}
                      {q.solutionText && (
                        <div className="mt-2.5 p-3 rounded-lg bg-[#FAFBFD] border border-[#E2E8F0] space-y-1 text-xs">
                          <div className="text-[11px] font-bold text-[#2A3BB0] uppercase flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>সমাধান ও ব্যাখ্যা:</span>
                          </div>
                          <div className="text-slate-800 leading-relaxed overflow-x-auto">
                            <RichText text={q.solutionText} />
                          </div>
                        </div>
                      )}

                      {/* Usage / Board Info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                        <span>
                          বোর্ড: {q.usedInBoards.map((b) => `${b.board}'${b.years.map(y => toBn(y)).join(',')}`).join(', ') || 'প্রযোজ্য নয়'}
                        </span>
                        <span>
                          প্রশ্নপত্রে ব্যবহার: {toBn(usage?.totalCount ?? 0)} বার
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default CollectionScreen;
