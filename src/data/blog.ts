export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  author: {
    name: string;
    role: string;
    avatar: string;
    bio: string;
  };
  publishDate: string;
  readingTime: string;
  coverImage: string;
  field: string;
  badgeColor: string;
  tags: string[];
  content?: string; // Markdown-compatible or rich structure
  keyInsights: string[];
  type?: "explainer" | "article" | "simulation";
  simulationUrl?: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "the-future-of-quantum-computing",
    title: "The Future of Quantum Computing",
    subtitle: "How qubits are reshaping the landscape of computation and cryptography.",
    description: "An in-depth look at quantum advantage, error correction, and the path to scalable quantum machines.",
    author: {
      name: "Dr. Aris Vance",
      role: "Quantum Physicist",
      avatar: "https://i.pravatar.cc/150?u=aris",
      bio: "Dr. Vance is a leading researcher in quantum error correction and topology.",
    },
    publishDate: "Oct 12, 2026",
    readingTime: "8 MIN READ",
    coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2000&auto=format&fit=crop",
    field: "COMPUTING",
    badgeColor: "cyan",
    tags: ["Quantum", "Hardware", "Cryptography"],
    keyInsights: [
      "Quantum advantage has been demonstrated in specific simulation tasks.",
      "Logical qubits require thousands of physical qubits for error correction.",
      "Post-quantum cryptography is becoming a priority for global security."
    ],
    type: "article",
    content: `
## Introduction

The promise of quantum computing has moved from theoretical physics to engineering reality. While classical computers rely on bits (0s and 1s), quantum computers use qubits, which can exist in multiple states simultaneously thanks to superposition.

### The Power of Superposition

Superposition allows quantum algorithms to evaluate many possibilities at once. However, harnessing this power requires extreme isolation. Even a stray photon can cause "decoherence," destroying the quantum state.

> "Quantum supremacy is not a finish line, but a starting point for a new era of computation." - John Preskill

## Challenges in Scaling

The biggest hurdle today is **quantum error correction**. Physical qubits are noisy and prone to errors.

1. **Decoherence**: Environmental noise disrupts qubit states.
2. **Gate Fidelity**: Operations on qubits must be extremely precise.
3. **Cooling**: Superconducting qubits require temperatures near absolute zero.

### Error Correction

To create one reliable "logical" qubit, we might need up to 1,000 physical qubits. This overhead is massive, but recent breakthroughs in topological error correction offer a path forward.

\`\`\`python
# A simple representation of a quantum circuit
from qiskit import QuantumCircuit

qc = QuantumCircuit(2)
qc.h(0) # Apply Hadamard gate
qc.cx(0, 1) # Apply CNOT gate
qc.measure_all()
\`\`\`

## Looking Ahead

Over the next decade, we expect to see hybrid quantum-classical algorithms solving specific problems in materials science, drug discovery, and optimization, long before fault-tolerant quantum computers are fully realized.
    `
  },
  {
    id: "crispr-and-the-gene-editing-revolution",
    title: "CRISPR and the Gene Editing Revolution",
    subtitle: "Precision medicine is rewriting the code of life.",
    description: "Exploring the mechanisms, ethical implications, and future applications of CRISPR-Cas9 technology.",
    author: {
      name: "Elena Rostova",
      role: "Bioinformatician",
      avatar: "https://i.pravatar.cc/150?u=elena",
      bio: "Elena focuses on computational models for targeted gene delivery systems.",
    },
    publishDate: "Nov 04, 2026",
    readingTime: "6 MIN READ",
    coverImage: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=2000&auto=format&fit=crop",
    field: "BIOLOGY",
    badgeColor: "green",
    tags: ["Genomics", "Medicine", "CRISPR"],
    keyInsights: [
      "CRISPR allows for highly precise, cost-effective DNA editing.",
      "Off-target effects remain a challenge for clinical applications.",
      "Ethical frameworks are struggling to keep pace with the technology."
    ],
    type: "article",
    content: "Content for CRISPR..."
  }
];
