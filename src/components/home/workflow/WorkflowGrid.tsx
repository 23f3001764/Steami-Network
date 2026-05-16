import { Radio, Search, Brain, Network, Cpu, Send } from 'lucide-react';
import { WorkflowCard } from './WorkflowCard';

const steps = [
  {
    step: "01",
    title: "Signal Detection",
    icon: Radio,
    description: "Scanning millions of scientific sources, patents, and research journals for emerging technological signals.",
    color: "steami-cyan"
  },
  {
    step: "02",
    title: "Research Analysis",
    icon: Search,
    description: "Deep-diving into promising signals to verify validity, impact potential, and technological maturity.",
    color: "steami-gold"
  },
  {
    step: "03",
    title: "Intelligence Synthesis",
    icon: Brain,
    description: "Synthesizing fragmented findings into a cohesive narrative of technological evolution.",
    color: "steami-cyan"
  },
  {
    step: "04",
    title: "Knowledge Mapping",
    icon: Network,
    description: "Connecting discoveries across domains to visualize hidden relationships and cross-pollination opportunities.",
    color: "steami-gold"
  },
  {
    step: "05",
    title: "AI Enhancement",
    icon: Cpu,
    description: "Applying neural intelligence to extract deep insights that human analysis might overlook.",
    color: "steami-cyan"
  },
  {
    step: "06",
    title: "Insight Delivery",
    icon: Send,
    description: "Delivering structured, interactive intelligence directly to the user through a premium interface.",
    color: "steami-gold"
  }
];

export const WorkflowGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {steps.map((step, index) => (
        <WorkflowCard 
          key={step.step} 
          {...step} 
          index={index} 
        />
      ))}
    </div>
  );
};
