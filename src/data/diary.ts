export interface DiaryEntry {
  id: string;
  title: string;
  note?: string;
  selected_text: string;
  popup_type: string;
  popup_id: string;
  field?: string;
  date: string;
}

export const diaryEntries: DiaryEntry[] = [
  {
    id: 'd1',
    title: 'Quantum Superposition Note',
    selected_text: 'Quantum decoherence explains why we don\'t see dogs in superposition in real life.',
    note: 'Interesting parallel to the Schrödinger paradox. Need to research decoherence time scales for macroscopic objects.',
    popup_type: 'explainer',
    popup_id: 'quantum-dog',
    field: 'QUANTUM PHYSICS',
    date: '2026-05-10T14:30:00Z'
  },
  {
    id: 'd2',
    title: 'CRISPR Ethics Thought',
    selected_text: 'The technology also raises profound ethical questions: should we edit human embryos?',
    note: 'This is the most critical debate of our century. The boundary between therapy and enhancement is blurring.',
    popup_type: 'explainer',
    popup_id: 'crispr-scissors',
    field: 'BIOLOGY',
    date: '2026-05-12T09:15:00Z'
  },
  {
    id: 'd3',
    title: 'Riemann Hypothesis Implications',
    selected_text: 'Its proof has immediate implications across mathematics, theoretical physics, and modern cryptography.',
    note: 'If RSA is compromised, the entire global financial system needs to migrate to post-quantum standards immediately.',
    popup_type: 'article',
    popup_id: 'a9',
    field: 'MATHEMATICS & DATA',
    date: '2026-05-13T16:45:00Z'
  }
];
