export interface LiveFeedItem {
  id: string;
  title: string;
  type: 'news' | 'update' | 'insight' | 'breakthrough';
  timestamp: string;
  summary: string;
  source: string;
  field: string;
  trend?: 'up' | 'down' | 'stable';
}

export const liveFeed: LiveFeedItem[] = [
  {
    id: 'f1',
    title: 'Room-Temperature Superconductor Reproduction Success',
    type: 'breakthrough',
    timestamp: new Date().toISOString(),
    summary: 'Third independent laboratory confirms zero resistance at 15°C.',
    source: 'Nature News',
    field: 'PHYSICS',
    trend: 'up'
  },
  {
    id: 'f2',
    title: 'OpenAI GPT-6 Science Benchmark Results',
    type: 'insight',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    summary: 'Model achieves 92% accuracy across graduate-level scientific qualifying exams.',
    source: 'ArXiv',
    field: 'AI',
    trend: 'stable'
  },
  {
    id: 'f3',
    title: 'CRISPR Base Editing FDA Priority Review',
    type: 'news',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    summary: 'New therapy for Beta-Thalassemia shows 94% efficacy in Phase III trials.',
    source: 'STAT News',
    field: 'MEDICINE',
    trend: 'up'
  },
  {
    id: 'f4',
    title: 'Mars Sample Return Mission Touchdown',
    type: 'news',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    summary: 'Recovery team confirms safe arrival of Martian soil samples in Utah.',
    source: 'NASA / ESA',
    field: 'EARTH & SPACE',
    trend: 'stable'
  },
  {
    id: 'f5',
    title: 'Solid-State Battery Production Scaling',
    type: 'update',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    summary: 'Manufacturing capacity projected to reach 10GWh by end of 2026.',
    source: 'Reuters Technology',
    field: 'ENGINEERING',
    trend: 'up'
  }
];
