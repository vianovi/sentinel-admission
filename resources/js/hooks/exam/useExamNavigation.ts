import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExamAnswerState, ExamQuestion } from "@/types/exam";

type UseExamNavigationOptions = {
    questions: ExamQuestion[];
    initialAnswers: Record<string, ExamAnswerState>;
};

type UseExamNavigationReturn = {
    activeIndex: number;
    activeQuestion: ExamQuestion | null;
    answeredCount: number;
    answerMap: Record<number, ExamAnswerState>;
    setActiveIndex: (index: number) => void;
    goNext: () => void;
    goPrev: () => void;
    updateAnswer: (questionId: number, answer: ExamAnswerState) => void;
    patchAnswer: (questionId: number, patch: Partial<ExamAnswerState>) => ExamAnswerState;
    cleanupTimers: () => void;
    saveTimers: React.MutableRefObject<Record<number, number>>;
};

/**
 * Manages exam question navigation, answer state, and debounce timers.
 * Provides a unified interface for navigating between questions and tracking answers.
 */
export function useExamNavigation({
    questions,
    initialAnswers,
}: UseExamNavigationOptions): UseExamNavigationReturn {
    const [activeIndex, setActiveIndex] = useState(0);
    const saveTimers = useRef<Record<number, number>>({});

    const [answerMap, setAnswerMap] = useState<Record<number, ExamAnswerState>>(() => {
        const entries = Object.entries(initialAnswers).map(
            ([key, value]) => [Number(key), value] as const,
        );
        return Object.fromEntries(entries);
    });

    const activeQuestion = questions[activeIndex] ?? null;

    const answeredCount = useMemo(
        () => questions.filter((q) => Boolean(answerMap[q.id]?.selected_option)).length,
        [answerMap, questions],
    );

    const goNext = useCallback(() => {
        setActiveIndex((i) => Math.min(questions.length - 1, i + 1));
    }, [questions.length]);

    const goPrev = useCallback(() => {
        setActiveIndex((i) => Math.max(0, i - 1));
    }, []);

    const updateAnswer = useCallback((questionId: number, answer: ExamAnswerState) => {
        setAnswerMap((prev) => ({ ...prev, [questionId]: answer }));
    }, []);

    const patchAnswer = useCallback((questionId: number, patch: Partial<ExamAnswerState>): ExamAnswerState => {
        let nextAnswer: ExamAnswerState = {
            question_id: questionId,
            selected_option: null,
            is_marked_for_review: false,
            saved_at: null,
        };

        setAnswerMap((prev) => {
            const current = prev[questionId];
            nextAnswer = {
                question_id: questionId,
                selected_option: current?.selected_option ?? null,
                is_marked_for_review: current?.is_marked_for_review ?? false,
                saved_at: current?.saved_at ?? null,
                ...patch,
            };
            return { ...prev, [questionId]: nextAnswer };
        });

        return nextAnswer;
    }, []);

    const cleanupTimers = useCallback(() => {
        Object.values(saveTimers.current).forEach((timer) => window.clearTimeout(timer));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return cleanupTimers;
    }, [cleanupTimers]);

    return {
        activeIndex,
        activeQuestion,
        answeredCount,
        answerMap,
        setActiveIndex,
        goNext,
        goPrev,
        updateAnswer,
        patchAnswer,
        cleanupTimers,
        saveTimers,
    };
}
