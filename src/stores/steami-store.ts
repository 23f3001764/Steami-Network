import { create } from 'zustand';

export interface DiaryEntry {
  id: string;
  text: string;
  source: string;
  sourceType: 'explainer' | 'article';
  timestamp: number;
  field?: string;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  field: string;
  type: 'article' | 'explainer' | 'news';
  timestamp: number;
}

interface SteamiState {
  diary: DiaryEntry[];
  recommendations: AIRecommendation[];
  addToDiary: (entry: Omit<DiaryEntry, 'id' | 'timestamp'>) => void;
  removeDiaryEntry: (id: string) => void;
  addRecommendation: (rec: Omit<AIRecommendation, 'id' | 'timestamp'>) => void;
  clearDiary: () => void;
}

export const useSteamiStore = create<SteamiState>((set) => ({
  diary: [],
  recommendations: [
    { id: 'r1', title: 'Quantum Error Correction Breakthroughs', description: 'Recent advances in topological qubits suggest fault-tolerant quantum computing may arrive sooner than expected.', field: 'PHYSICS', type: 'article', timestamp: Date.now() - 3600000 },
    { id: 'r2', title: 'CRISPR Gene Drive Ethics', description: 'New frameworks for evaluating ecological risks of gene drive technology in wild populations.', field: 'BIOLOGY', type: 'news', timestamp: Date.now() - 7200000 },
    { id: 'r3', title: 'Neural Architecture Search 2.0', description: 'AutoML systems now design transformer architectures that outperform human-designed models.', field: 'AI', type: 'explainer', timestamp: Date.now() - 10800000 },
    { id: 'r4', title: 'Solid-State Battery Revolution', description: 'Toyota\'s latest solid-state prototype achieves 1200km range with 10-minute charging.', field: 'CLIMATE & ENERGY', type: 'news', timestamp: Date.now() - 14400000 },
    { id: 'r5', title: 'Mars Sample Return Mission Update', description: 'ESA-NASA collaboration reveals new timeline for bringing Martian soil to Earth laboratories.', field: 'EARTH & SPACE', type: 'article', timestamp: Date.now() - 18000000 },
  ],
  addToDiary: (entry) =>
    set((state) => ({
      diary: [
        { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
        ...state.diary,
      ],
    })),
  removeDiaryEntry: (id) =>
    set((state) => ({
      diary: state.diary.filter((e) => e.id !== id),
    })),
  addRecommendation: (rec) =>
    set((state) => ({
      recommendations: [
        { ...rec, id: crypto.randomUUID(), timestamp: Date.now() },
        ...state.recommendations,
      ],
    })),
  clearDiary: () => set({ diary: [] }),
}));
