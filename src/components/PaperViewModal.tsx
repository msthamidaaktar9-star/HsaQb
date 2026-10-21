import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Trash2, Edit3, Printer, FileDown, Layers } from 'lucide-react';
import { db, type Paper, type Question, type Stimulus } from '../db/db';
import { deletePaper, getImageBlobUrl } from '../db/api';
import { RichText } from './RichText';
import { useToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { toBn } from '../utils/toBn';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export interface PaperViewModalProps {
  paperId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (paper: Paper) => void;
  onDeleted: () => void;
}

export const PaperViewModal: React.FC<PaperViewModalProps> = ({
  paperId,
  isOpen,
  onClose,
  onEdit,
  onDeleted,
}) => {
  const { showToast } = useToast();
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [paper, setPaper] = useState<Paper | null>(null);
  const [groupedQuestions, setGroupedQuestions] = useState<
    Array<{ stimulus?: Stimulus; questions: Question[] }>
  >([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen || !paperId) return;

    const loadPaperData = async () => {
      setLoading(true);
      try {
        const p = await db.papers.get(paperId);
        if (!p) {
          showToast('প্রশ্নপত্র পাওয়া যায়নি');
          onClose();
          return;
        }
        setPaper(p);

        // Fetch questions
        const questionsList = await db.questions
          .where('id')
          .anyOf(p.questionIds || [])
          .toArray();

        // Sort by order in paper.questionIds
        questionsList.sort((a, b) => {
          const idxA = p.questionIds.indexOf(a.id);
          const idxB = p.questionIds.indexOf(b.id);
          return idxA - idxB;
        });

        // Group by stimulus
        const stimulusIds = Array.from(
          new Set(questionsList.map((q) => q.stimulusId).filter(Boolean))
        ) as string[];

        const stimuliMap = new Map<string, Stimulus>();
        if (stimulusIds.length > 0) {
          const stims = await db.stimuli.where('id').anyOf(stimulusIds).toArray();
          stims.forEach((s) => stimuliMap.set(s.id, s));
        }

        const groups: Array<{ stimulus?: Stimulus; questions: Question[] }> = [];
        const stimGroupMap = new Map<string, Question[]>();
        const noStimQuestions: Question[] = [];

        for (const q of questionsList) {
          if (q.stimulusId && stimuliMap.has(q.stimulusId)) {
            const arr = stimGroupMap.get(q.stimulusId) || [];
            arr.push(q);
            stimGroupMap.set(q.stimulusId, arr);
          } else {
            noStimQuestions.push(q);
          }
        }

        stimGroupMap.forEach((qList, stimId) => {
          groups.push({
            stimulus: stimuliMap.get(stimId),
            questions: qList,
          });
        });

        for (const q of noStimQuestions) {
          groups.push({ questions: [q] });
        }

        setGroupedQuestions(groups);

        // Fetch Images Blob URLs
        const urls: Record<string, string> = {};
        for (const g of groups) {
          if (g.stimulus?.imageIds) {
            for (const imgId of g.stimulus.imageIds) {
              const url = await getImageBlobUrl(imgId);
              if (url) urls[imgId] = url;
            }
          }
          for (const q of g.questions) {
            if (q.solutionImageIds) {
              for (const imgId of q.solutionImageIds) {
                const url = await getImageBlobUrl(imgId);
                if (url) urls[imgId] = url;
              }
            }
          }
        }
        setImageUrls(urls);
      } catch (err) {
        console.error('Failed to load paper view:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPaperData();
  }, [isOpen, paperId]);

  if (!isOpen || !paper) return null;

  // Export to PDF
  const handleExportPdf = async () => {
    if (!printAreaRef.current) return;
    setExportingPdf(true);
    showToast('পিডিএফ তৈরি হচ্ছে...');

    try {
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${paper.shortName || 'question-paper'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      };

      await html2pdf().set(opt).from(printAreaRef.current).save();
      showToast('পিডিএফ সফলভাবে ডাউনলোড হয়েছে');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showToast('পিডিএফ তৈরিতে সমস্যা হয়েছে');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePaper(paper.id);
      showToast('প্রশ্নপত্র মুছে ফেলা হয়েছে');
      setShowDeleteConfirm(false);
      onDeleted();
      onClose();
    } catch {
      showToast('মুছতে সমস্যা হয়েছে');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paper-view-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[390px] h-full sm:h-[844px] bg-[#F2F4F8] dark:bg-slate-900 text-[#1B1F2A] dark:text-slate-100 flex flex-col relative overflow-hidden shadow-2xl sm:rounded-[36px] border border-[#D5D9E2] dark:border-slate-800">
        {/* Top Header */}
        <header className="bg-[#3B4FD8] text-white px-4 h-14 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="বন্ধ করুন"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id="paper-view-title" className="text-sm font-bold text-white truncate max-w-[200px]">
              {paper.shortName}
            </h2>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="পিডিএফ ডাউনলোড করুন"
              disabled={exportingPdf}
              onClick={handleExportPdf}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              aria-label="প্রশ্নপত্র সম্পাদনা করুন"
              onClick={() => onEdit(paper)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 text-white"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="প্রশ্নপত্র মুছুন"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-500/30 text-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable A4 Preview Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#E5E9F0] dark:bg-slate-950/70">
          {/* THE A4 SHEET: Always pure white (#FFFFFF) with black text, even in dark mode */}
          <div
            ref={printAreaRef}
            className="w-full bg-white text-[#111827] shadow-xl rounded-xl p-5 sm:p-6 space-y-4 border border-[#D5D9E2]"
            style={{
              fontFamily: "'Hind Siliguri', serif",
              minHeight: '600px',
              backgroundColor: '#FFFFFF',
              color: '#111827',
            }}
          >
            {/* Paper Header */}
            <div className="text-center space-y-1 pb-3 border-b-2 border-black/80">
              <h1 className="text-lg font-black text-black tracking-tight leading-snug">
                {paper.title}
              </h1>
              {paper.subjectLine && (
                <p className="text-xs font-bold text-black">{paper.subjectLine}</p>
              )}
              <div className="flex items-center justify-between text-[11px] font-bold text-black pt-1">
                <span>সময়: {paper.duration || '২ ঘণ্টা ৩০ মিনিট'}</span>
                <span>পূর্ণমান: {toBn(paper.totalMarks || 50)}</span>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="text-center text-[11px] font-semibold text-black/80 italic">
              [ দ্রষ্টব্য: ডান পাশের সংখ্যা প্রশ্নের পূর্ণমান নির্দেশক। প্রয়োজনীয় ক্ষেত্রে চিত্র অঙ্কন আবশ্যক। ]
            </div>

            {/* Questions List */}
            <div className="space-y-5 pt-2">
              {groupedQuestions.map((group, gIdx) => (
                <div key={gIdx} className="space-y-3 pb-3 border-b border-gray-200 last:border-b-0">
                  {/* Stimulus with LaTeX and Image */}
                  {group.stimulus && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-black">
                        <span>উদ্দীপক {toBn(gIdx + 1)}:</span>
                        {group.stimulus.boardTag && (
                          <span className="text-[10px] text-gray-600">[{group.stimulus.boardTag}]</span>
                        )}
                      </div>
                      <RichText text={group.stimulus.text} className="text-xs font-medium text-black leading-relaxed" />

                      {group.stimulus.imageIds?.map((imgId) => {
                        const url = imageUrls[imgId];
                        if (!url) return null;
                        return (
                          <div key={imgId} className="my-2 max-w-[220px] mx-auto overflow-hidden">
                            <img src={url} alt="উদ্দীপক চিত্র" className="w-full h-auto object-contain" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Sub-questions (ক, খ, গ, ঘ) */}
                  <div className="space-y-2 pl-1">
                    {group.questions.map((q, qIdx) => (
                      <div key={q.id} className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-1.5 flex-1">
                          <span className="font-bold text-black shrink-0">
                            ({q.type || toBn(qIdx + 1)})
                          </span>
                          <RichText text={q.questionText} className="text-xs text-black leading-relaxed flex-1" />
                        </div>
                        <span className="font-bold text-black text-xs shrink-0 pl-2">
                          {toBn(q.marks)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* End of Paper marker */}
            <div className="text-center text-[10px] text-gray-500 pt-6">
              — সমাপ্ত —
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="প্রশ্নপত্র মুছবেন?"
          message={`"${paper.shortName}" প্রশ্নপত্রটি স্থায়ীভাবে মুছে ফেলতে চান?`}
          confirmText="হ্যাঁ, মুছে ফেলুন"
          cancelText="না"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
};
