export interface IntelligenceMap {
  id: string;
  title: string;
  description: string;
  purpose: string;
  features: string[];
  color: 'steami-cyan' | 'steami-gold';
  image: string;
}

export const intelligenceMaps: IntelligenceMap[] = [
  {
    id: 'knowledge-graph',
    title: 'Knowledge Mapping',
    description: 'Visualise complex scientific relationships through our interactive neural knowledge graph.',
    purpose: 'To reveal hidden connections between disparate research fields.',
    features: [
      'Interactive 3D Node Clusters',
      'Cross-Domain Relationship Mapping',
      'Temporal Evolution Tracking',
      'Real-time Data Synthesis'
    ],
    color: 'steami-cyan',
    image: '/images/systems/knowledge-map.webp'
  },
  {
    id: 'intelligence-profile',
    title: 'Intelligence Profile',
    description: 'Your personalised scientific identity, tracking your research journey and cognitive evolution.',
    purpose: 'To provide a data-driven mirror of your scientific interests and expertise.',
    features: [
      'Interest Distribution Analysis',
      'Learning Velocity Metrics',
      'Collaborative Potential Mapping',
      'Adaptive Content Curation'
    ],
    color: 'steami-gold',
    image: '/images/systems/profile-system.webp'
  },
  {
    id: 'subject-intelligence',
    title: 'Subject Intelligence',
    description: 'Deep-dive analysis of specific domains, providing a birds-eye view of scientific frontiers.',
    purpose: 'To accelerate domain mastery through structured intelligence layers.',
    features: [
      'Domain Frontier Identification',
      'Expert Network Visualisation',
      'Funding Trend Analysis',
      'Breakthrough Probability Scoring'
    ],
    color: 'steami-cyan',
    image: '/images/systems/subject-system.webp'
  }
];
