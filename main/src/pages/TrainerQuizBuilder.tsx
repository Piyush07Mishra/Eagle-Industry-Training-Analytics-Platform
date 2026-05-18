import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Save, BookOpen, ChevronRight, Loader2,
  CheckCircle, AlertCircle, RefreshCw, X,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/api/axios";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Course {
  id: number;
  title: string;
  category: string;
}

interface BankQuestion {
  id: number;
  question_text: string;
  question_type: "MCQ" | "TRUE_FALSE" | "SHORT";
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
  course: number;
}

interface EditorQuestion {
  uid: string; // local key
  bank_id?: number; // set if imported from bank
  question_text: string;
  question_type: "MCQ" | "TRUE_FALSE" | "SHORT";
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function bankToEditor(q: BankQuestion): EditorQuestion {
  return {
    uid: uid(),
    bank_id: q.id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: Array.isArray(q.options) ? q.options : [],
    correct_answer: q.correct_answer,
    explanation: q.explanation || "",
    difficulty: (q.difficulty as "easy" | "medium" | "hard") || "medium",
  };
}

// ── QuestionEditor ─────────────────────────────────────────────────────────────

interface QEditorProps {
  q: EditorQuestion;
  idx: number;
  onChange: (q: EditorQuestion) => void;
  onRemove: () => void;
}

const QuestionEditor: React.FC<QEditorProps> = ({ q, idx, onChange, onRemove }) => {
  const update = (patch: Partial<EditorQuestion>) => onChange({ ...q, ...patch });

  return (
    <Card className="p-5 border-l-4 border-blue-500 relative bg-white">
      {q.bank_id && (
        <span className="absolute top-3 right-10 text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full border border-blue-200">
          From Bank #{q.bank_id}
        </span>
      )}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="space-y-3">
        {/* Question text */}
        <div>
          <Label className="text-xs text-gray-500 uppercase tracking-wider">
            Question {idx + 1}
          </Label>
          <Input
            value={q.question_text}
            placeholder="Enter question text…"
            className="mt-1 font-medium"
            onChange={(e) => update({ question_text: e.target.value })}
          />
        </div>

        {/* Type + Difficulty row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="text-xs text-gray-500">Type</Label>
            <select
              value={q.question_type}
              onChange={(e) => {
                const t = e.target.value as EditorQuestion["question_type"];
                const opts =
                  t === "TRUE_FALSE"
                    ? ["True", "False"]
                    : t === "SHORT"
                    ? []
                    : q.options.length >= 2
                    ? q.options
                    : ["Option A", "Option B", "Option C", "Option D"];
                update({ question_type: t, options: opts, correct_answer: "" });
              }}
              className="mt-1 w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MCQ">Multiple Choice</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="SHORT">Short Answer</option>
            </select>
          </div>
          <div className="w-32">
            <Label className="text-xs text-gray-500">Difficulty</Label>
            <select
              value={q.difficulty}
              onChange={(e) => update({ difficulty: e.target.value as EditorQuestion["difficulty"] })}
              className="mt-1 w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* MCQ options */}
        {q.question_type === "MCQ" && (
          <div className="space-y-2 pl-2 border-l-2 border-gray-100">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <button
                  onClick={() => update({ correct_answer: opt })}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    q.correct_answer === opt
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {q.correct_answer === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                </button>
                <Input
                  value={opt}
                  className={`h-8 text-sm flex-1 ${
                    q.correct_answer === opt ? "border-green-200 bg-green-50 text-green-800 font-medium" : ""
                  }`}
                  onChange={(e) => {
                    const newOpts = [...q.options];
                    const wasCorrect = q.correct_answer === opt;
                    newOpts[oi] = e.target.value;
                    update({
                      options: newOpts,
                      correct_answer: wasCorrect ? e.target.value : q.correct_answer,
                    });
                  }}
                />
                {q.options.length > 2 && (
                  <button
                    onClick={() => {
                      const newOpts = q.options.filter((_, i) => i !== oi);
                      update({
                        options: newOpts,
                        correct_answer: q.correct_answer === opt ? "" : q.correct_answer,
                      });
                    }}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:bg-blue-50 text-xs mt-1"
              onClick={() => update({ options: [...q.options, `Option ${q.options.length + 1}`] })}
            >
              + Add Option
            </Button>
          </div>
        )}

        {/* True/False */}
        {q.question_type === "TRUE_FALSE" && (
          <div className="flex gap-3 pl-2">
            {["True", "False"].map((v) => (
              <button
                key={v}
                onClick={() => update({ correct_answer: v })}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  q.correct_answer === v
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {q.correct_answer === v && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {v}
              </button>
            ))}
          </div>
        )}

        {/* Short answer */}
        {q.question_type === "SHORT" && (
          <div>
            <Label className="text-xs text-gray-500">Expected Answer (for reference)</Label>
            <Input
              value={q.correct_answer}
              placeholder="Type expected answer…"
              className="mt-1 text-sm"
              onChange={(e) => update({ correct_answer: e.target.value })}
            />
          </div>
        )}

        {/* Explanation */}
        <div>
          <Label className="text-xs text-gray-500">Explanation (optional)</Label>
          <Input
            value={q.explanation}
            placeholder="Why is this the correct answer?"
            className="mt-1 text-sm text-gray-600"
            onChange={(e) => update({ explanation: e.target.value })}
          />
        </div>
      </div>
    </Card>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const TrainerQuizBuilder: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [bankLoading, setBankLoading] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState<EditorQuestion[]>([]);
  const [savingToBank, setSavingToBank] = useState(false);
  const [publishingQuiz, setPublishingQuiz] = useState(false);

  // Load courses on mount
  useEffect(() => {
    apiGet<Course[]>("/api/courses/").then(setCourses).catch(() => {});
  }, []);

  // Load question bank when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setBankQuestions([]);
      return;
    }
    setBankLoading(true);
    apiGet<BankQuestion[]>(`/api/question-bank/?course_id=${selectedCourseId}`)
      .then((data) => { setBankQuestions(data); setBankLoading(false); })
      .catch(() => { setBankLoading(false); });
  }, [selectedCourseId]);

  const addBlankQuestion = () => {
    setQuizQuestions((prev) => [
      ...prev,
      {
        uid: uid(),
        question_text: "",
        question_type: "MCQ",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "",
        explanation: "",
        difficulty: "medium",
      },
    ]);
  };

  const importFromBank = (bq: BankQuestion) => {
    const already = quizQuestions.some((q) => q.bank_id === bq.id);
    if (already) {
      toast.info("Already added to quiz.");
      return;
    }
    setQuizQuestions((prev) => [...prev, bankToEditor(bq)]);
    toast.success(`Question added to quiz.`);
  };

  const updateQuestion = (uid: string, updated: EditorQuestion) => {
    setQuizQuestions((prev) => prev.map((q) => (q.uid === uid ? updated : q)));
  };

  const removeQuestion = (uid: string) => {
    setQuizQuestions((prev) => prev.filter((q) => q.uid !== uid));
  };

  // Save new questions (without bank_id) to the question bank
  const saveNewToBank = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course first.");
      return;
    }
    const newOnes = quizQuestions.filter((q) => !q.bank_id);
    if (newOnes.length === 0) {
      toast.info("No new questions to save — all are already from the bank.");
      return;
    }
    setSavingToBank(true);
    try {
      for (const q of newOnes) {
        if (!q.question_text.trim()) continue;
        await apiPost("/api/question-bank/", {
          course: selectedCourseId,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        });
      }
      toast.success(`${newOnes.length} question(s) saved to Question Bank!`);
      // Refresh bank
      const updated = await apiGet<BankQuestion[]>(`/api/question-bank/?course_id=${selectedCourseId}`);
      setBankQuestions(updated);
      // Update local quiz questions with bank IDs
      setQuizQuestions((prev) =>
        prev.map((q) => {
          if (!q.bank_id) {
            const match = updated.find((b) => b.question_text === q.question_text);
            if (match) return { ...q, bank_id: match.id };
          }
          return q;
        })
      );
    } catch {
      toast.error("Failed to save some questions.");
    } finally {
      setSavingToBank(false);
    }
  };

  // Publish quiz to /api/quizzes/ linked to a session's course
  const handlePublish = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course.");
      return;
    }
    if (quizQuestions.length === 0) {
      toast.error("Add at least one question.");
      return;
    }
    const incomplete = quizQuestions.filter((q) => !q.question_text.trim() || !q.correct_answer.trim());
    if (incomplete.length > 0) {
      toast.error(`${incomplete.length} question(s) are incomplete (missing text or correct answer).`);
      return;
    }

    setPublishingQuiz(true);
    try {
      // Publish as a Quiz object with the course
      await apiPost("/api/quizzes/", {
        title: `Quiz — ${courses.find((c) => c.id === selectedCourseId)?.title || "Course"}`,
        course: selectedCourseId,
        is_pre_assessment: false,
        time_limit: 30,
        pass_percentage: 70,
        questions: quizQuestions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })),
      });
      toast.success("Quiz published successfully!");
    } catch {
      toast.error("Failed to publish quiz. Check console for details.");
    } finally {
      setPublishingQuiz(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 overflow-hidden">
      {/* ── LEFT PANEL: Question Bank ────────────────────────────── */}
      <div className="w-80 flex flex-col flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Panel header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Question Bank</h2>
          </div>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : "")}
            className="w-full h-8 rounded-md border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select Course —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Bank questions list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {bankLoading && (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading…
            </div>
          )}

          {!bankLoading && !selectedCourseId && (
            <p className="text-xs text-gray-400 text-center py-8">
              Select a course to see available questions.
            </p>
          )}

          {!bankLoading && selectedCourseId && bankQuestions.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">
              No questions in bank for this course yet. Add new ones on the right →
            </p>
          )}

          {bankQuestions.map((bq) => {
            const inQuiz = quizQuestions.some((q) => q.bank_id === bq.id);
            return (
              <div
                key={bq.id}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  inQuiz
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
                onClick={() => !inQuiz && importFromBank(bq)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-800 line-clamp-2 flex-1">{bq.question_text}</p>
                  {inQuiz ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${DIFFICULTY_COLORS[bq.difficulty] || "bg-gray-100 text-gray-600"}`}>
                    {bq.difficulty}
                  </span>
                  <span className="text-gray-400">{bq.question_type}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Refresh bank */}
        {selectedCourseId && (
          <div className="px-3 py-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-500 hover:text-blue-600"
              onClick={() => {
                setBankLoading(true);
                apiGet<BankQuestion[]>(`/api/question-bank/?course_id=${selectedCourseId}`)
                  .then((data) => { setBankQuestions(data); setBankLoading(false); })
                  .catch(() => setBankLoading(false));
              }}
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh Bank
            </Button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: Quiz Editor ─────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {quizQuestions.length} question{quizQuestions.length !== 1 ? "s" : ""} in this quiz
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={saveNewToBank}
              disabled={savingToBank || !selectedCourseId}
              className="flex items-center gap-1.5"
            >
              {savingToBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to Bank
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishingQuiz || quizQuestions.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {publishingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Publish Quiz
            </Button>
          </div>
        </div>

        {/* Validation hint */}
        {!selectedCourseId && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3 text-sm text-amber-700 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Select a course from the left panel to link this quiz to a course.
          </div>
        )}

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {quizQuestions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <BookOpen className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No questions yet.</p>
              <p className="text-xs mt-1">Import from the bank on the left, or add a new question below.</p>
            </div>
          )}

          {quizQuestions.map((q, idx) => (
            <QuestionEditor
              key={q.uid}
              q={q}
              idx={idx}
              onChange={(updated) => updateQuestion(q.uid, updated)}
              onRemove={() => removeQuestion(q.uid)}
            />
          ))}
        </div>

        {/* Add Question Button */}
        <div className="pt-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={addBlankQuestion}
            className="w-full py-6 border-2 border-dashed border-gray-300 text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 text-sm font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Question
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainerQuizBuilder;
