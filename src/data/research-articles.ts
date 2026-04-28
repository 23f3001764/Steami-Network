export const FIELDS = [
  'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MEDICINE', 'EARTH & SPACE',
  'COMPUTER SCIENCE', 'AI', 'ROBOTICS', 'ENGINEERING',
  'MATHEMATICS & DATA', 'CLIMATE & ENERGY',
] as const;

export type Field = typeof FIELDS[number];

export const FIELD_ICONS: Record<Field, string> = {
  'PHYSICS': '️',
  'CHEMISTRY': '',
  'BIOLOGY': '',
  'MEDICINE': '',
  'EARTH & SPACE': '',
  'COMPUTER SCIENCE': '',
  'AI': '',
  'ROBOTICS': '',
  'ENGINEERING': '️',
  'MATHEMATICS & DATA': '',
  'CLIMATE & ENERGY': '',
};

export const FIELD_COLORS: Record<Field, string> = {
  'PHYSICS': 'cyan',
  'CHEMISTRY': 'orange',
  'BIOLOGY': 'green',
  'MEDICINE': 'red',
  'EARTH & SPACE': 'violet',
  'COMPUTER SCIENCE': 'cyan',
  'AI': 'violet',
  'ROBOTICS': 'orange',
  'ENGINEERING': 'gold',
  'MATHEMATICS & DATA': 'cyan',
  'CLIMATE & ENERGY': 'green',
};

export interface Article {
  id: string;
  title: string;
  abstract: string;
  field: Field;
  author: string;
  date: string;
  readTime: string;
  content: string[];
  quotes: string[];
  keyFindings: string[];
  relatedTopics: string[];
}

export const articles: Article[] = [
  // PHYSICS
  {
    id: 'a1', title: 'Topological Qubits Achieve 99.9% Fidelity', abstract: 'Microsoft Research demonstrates record-breaking qubit stability using Majorana fermions in topological superconductors, opening a new chapter for fault-tolerant quantum computing.', field: 'PHYSICS', author: 'Dr. Sarah Chen', date: '2025-03-15', readTime: '12 min',
    content: ['Topological quantum computing has long been considered the holy grail of quantum information science. Unlike conventional qubits that are fragile and error-prone, topological qubits encode information in the global properties of a quantum system, making them inherently resistant to local noise and perturbation.', 'The key innovation lies in using Majorana fermions — exotic particles that are their own antiparticles. When these particles are braided around each other, they perform quantum computations that are inherently protected from local noise. This braiding operation is topologically protected, meaning small perturbations cannot corrupt the computation.', 'Microsoft\'s latest breakthrough achieved 99.9% gate fidelity, surpassing the threshold needed for practical quantum error correction. This means that topological quantum computers could require orders of magnitude fewer physical qubits than surface-code approaches.', 'The implications are staggering: drug discovery simulations that would take classical computers millions of years could be completed in hours. Materials science, cryptography, and optimization problems all stand to benefit from this revolutionary advance in quantum hardware.'],
    quotes: ['"This is the moment topological quantum computing goes from theory to engineering." — Dr. Chetan Nayak, Microsoft'],
    keyFindings: ['99.9% gate fidelity achieved with topological qubits', 'Majorana fermion braiding demonstrated at scale', '1000x fewer physical qubits needed vs. conventional approaches', 'Path to fault-tolerant quantum computing now clear'],
    relatedTopics: ['Quantum Error Correction', 'Majorana Fermions', 'Topological Insulators'],
  },
  {
    id: 'a6', title: 'Room-Temperature Superconductor Confirmed by Three Independent Labs', abstract: 'LK-99 successor material shows zero resistance at 15°C and ambient pressure, verified across MIT, Max Planck, and RIKEN.', field: 'PHYSICS', author: 'Dr. Elena Volkov', date: '2025-02-28', readTime: '11 min',
    content: ['In what may be the most significant physics discovery of the century, three independent laboratories have confirmed room-temperature superconductivity in a modified copper-lead apatite material.', 'The material, designated CPA-2, shows zero electrical resistance at temperatures up to 15°C (59°F) at ambient pressure — shattering the previous record which required extreme pressures of hundreds of gigapascals.', 'Researchers at MIT, Max Planck Institute, and RIKEN independently synthesized the material using a modified process that creates a specific crystalline defect pattern essential for the superconducting behavior.', 'Applications could revolutionize every aspect of technology: lossless power transmission across continents, levitating transportation systems, quantum computers operating at room temperature, and MRI machines small enough for any doctor\'s office.'],
    quotes: ['"If this holds up, it\'s the most important materials discovery since the transistor." — Prof. Philip Anderson, Princeton'],
    keyFindings: ['Zero resistance confirmed at 15°C ambient pressure', 'Three independent reproductions across continents', 'Specific crystal defect pattern identified as mechanism', 'Could enable lossless power grids and levitating transport'],
    relatedTopics: ['Superconductivity', 'Materials Science', 'Condensed Matter Physics'],
  },
  {
    id: 'a12', title: 'Gravitational Wave Background Detected by Pulsar Timing Arrays', abstract: 'NANOGrav collaboration confirms low-frequency gravitational wave hum permeating the cosmos from supermassive black hole mergers.', field: 'PHYSICS', author: 'Dr. Marcus Webb', date: '2025-01-20', readTime: '10 min',
    content: ['The NANOGrav collaboration has confirmed the detection of a stochastic gravitational wave background — a persistent "hum" of spacetime ripples created by merging supermassive black holes throughout the universe.', 'Using an array of millisecond pulsars as a galaxy-scale gravitational wave detector, the team identified correlated timing variations exactly matching the Hellings-Downs pattern predicted by general relativity.', 'This discovery opens an entirely new window on the universe, allowing astronomers to study the population and merger history of supermassive black holes, the large-scale structure of the cosmos, and potentially exotic sources like cosmic strings.', 'The signal is consistent with a population of supermassive black hole binaries in the final stages of inspiral, confirming theoretical predictions about galaxy merger rates and black hole growth.'],
    quotes: ['"We are hearing the gravitational symphony of the cosmos for the first time." — Dr. Scott Ransom, NANOGrav'],
    keyFindings: ['Stochastic gravitational wave background confirmed', 'Hellings-Downs correlation pattern matched', 'Consistent with supermassive black hole merger population', 'Opens new era of gravitational wave astronomy'],
    relatedTopics: ['Gravitational Waves', 'Pulsars', 'Black Holes', 'General Relativity'],
  },
  // MEDICINE
  {
    id: 'a2', title: 'CRISPR Base Editing Cures Beta-Thalassemia in Phase III Trial', abstract: 'Vertex Pharmaceuticals reports 94% of patients achieved transfusion independence after single-dose base editing therapy.', field: 'MEDICINE', author: 'Prof. James Liu', date: '2025-03-10', readTime: '10 min',
    content: ['In a landmark Phase III clinical trial, base editing technology has achieved what was once considered impossible: a functional cure for beta-thalassemia, a genetic blood disorder affecting millions worldwide.', 'Unlike traditional CRISPR-Cas9 which creates double-strand breaks, base editing makes precise single-nucleotide changes without cutting the DNA backbone, dramatically reducing the risk of unintended mutations and off-target effects.', 'Patients received a single infusion of edited stem cells. Within three months, 94% no longer required regular blood transfusions — a treatment they had depended on since childhood for survival.', 'The therapy works by reactivating fetal hemoglobin production, bypassing the defective adult hemoglobin gene entirely. This elegant approach could also treat sickle cell disease using the same mechanism.'],
    quotes: ['"We are witnessing the dawn of precision genetic medicine." — Prof. David Liu, Broad Institute'],
    keyFindings: ['94% transfusion independence rate achieved', 'Single-dose treatment protocol with lasting results', 'No serious adverse events in 18-month follow-up', 'Same approach applicable to sickle cell disease'],
    relatedTopics: ['Base Editing', 'Gene Therapy', 'Hemoglobin Disorders'],
  },
  {
    id: 'a13', title: 'Universal Cancer Vaccine Enters Phase II Trials', abstract: 'BioNTech\'s mRNA-based personalized neoantigen vaccine shows 78% reduction in recurrence across multiple cancer types.', field: 'MEDICINE', author: 'Dr. Lisa Hoffman', date: '2025-03-22', readTime: '9 min',
    content: ['BioNTech, the company behind one of the most successful COVID-19 vaccines, has reported remarkable Phase II results for a personalized cancer vaccine that trains the immune system to attack individual tumors.', 'The vaccine uses mRNA technology to encode neoantigens — mutant proteins unique to each patient\'s cancer. By presenting these targets to the immune system, the vaccine triggers a potent and specific anti-tumor response.', 'Across trials in melanoma, pancreatic, and colorectal cancers, patients who received the vaccine plus standard immunotherapy showed 78% lower recurrence rates compared to immunotherapy alone at 18 months.', 'The manufacturing process, which once took months, has been streamlined to produce a personalized vaccine within 4 weeks of tumor biopsy, making it practical for clinical deployment.'],
    quotes: ['"Every patient\'s cancer is unique, and now every patient\'s vaccine can be too." — Dr. Ugur Sahin, BioNTech CEO'],
    keyFindings: ['78% reduction in cancer recurrence', 'Personalized mRNA vaccine in just 4 weeks', 'Effective across multiple cancer types', 'Combines with existing immunotherapy protocols'],
    relatedTopics: ['mRNA Vaccines', 'Immunotherapy', 'Neoantigens', 'Oncology'],
  },
  // AI
  {
    id: 'a3', title: 'GPT-6 Demonstrates PhD-Level Scientific Reasoning', abstract: 'OpenAI\'s latest model passes graduate-level exams across 50 scientific disciplines with 92% accuracy.', field: 'AI', author: 'Dr. Maya Patel', date: '2025-03-12', readTime: '14 min',
    content: ['The latest frontier model from OpenAI has achieved a milestone that many AI researchers didn\'t expect for years: PhD-level performance across diverse scientific disciplines.', 'GPT-6 was evaluated on graduate qualifying exams from 50 top universities, spanning physics, chemistry, biology, mathematics, and engineering. It achieved 92% accuracy overall, with peak performance in mathematics (97%) and physics (95%).', 'More remarkably, the model demonstrated genuine scientific reasoning — formulating hypotheses, designing experiments, and identifying flaws in published papers with accuracy rivaling domain experts in each field.', 'Critics note that passing exams doesn\'t equal scientific creativity. However, the model\'s ability to connect disparate findings across fields has already led to novel research hypotheses being investigated in major labs worldwide.'],
    quotes: ['"This doesn\'t replace scientists — it gives every scientist a tireless, knowledgeable collaborator." — Dr. Ilya Sutskever'],
    keyFindings: ['92% accuracy across 50 graduate-level scientific exams', 'Novel hypothesis generation capabilities demonstrated', 'Cross-disciplinary reasoning surpassing individual human experts', 'Already contributing to active research programs'],
    relatedTopics: ['Large Language Models', 'Scientific Discovery', 'AI Safety'],
  },
  {
    id: 'a14', title: 'Autonomous AI Agent Discovers New Antibiotic Class', abstract: 'MIT\'s AI-driven drug discovery platform identifies a novel antibiotic effective against drug-resistant bacteria in 48 hours.', field: 'AI', author: 'Dr. Priya Sharma', date: '2025-02-15', readTime: '11 min',
    content: ['An autonomous AI system at MIT has discovered a completely new class of antibiotics effective against drug-resistant MRSA and other superbugs, completing the discovery process in just 48 hours.', 'The AI agent independently designed the search strategy, screened 12 million candidate molecules, synthesized the top candidates in a robotic lab, and tested them against bacterial cultures — all without human intervention.', 'The most promising compound, abaucin-2, kills bacteria through a mechanism never previously exploited by antibiotics: disrupting the bacterial cell\'s ability to maintain its internal pH balance. This novel mechanism makes pre-existing resistance unlikely.', 'The discovery addresses a critical global health threat — antimicrobial resistance kills over 1.2 million people annually and is projected to cause 10 million deaths per year by 2050 without new antibiotics.'],
    quotes: ['"The AI didn\'t just find a needle in a haystack — it designed a completely new type of needle." — Prof. James Collins, MIT'],
    keyFindings: ['New antibiotic class discovered in 48 hours', 'Effective against MRSA and drug-resistant bacteria', 'Novel mechanism makes pre-existing resistance unlikely', 'Fully autonomous discovery pipeline demonstrated'],
    relatedTopics: ['Drug Discovery', 'Antimicrobial Resistance', 'Autonomous AI', 'Molecular Screening'],
  },
  // CLIMATE & ENERGY
  {
    id: 'a4', title: 'Perovskite-Silicon Tandem Solar Cells Break 35% Efficiency', abstract: 'NREL and Oxford PV achieve new world record for commercial-size solar cell efficiency, approaching the theoretical limit.', field: 'CLIMATE & ENERGY', author: 'Dr. Kenji Watanabe', date: '2025-03-08', readTime: '8 min',
    content: ['A collaboration between the National Renewable Energy Laboratory and Oxford PV has shattered the solar cell efficiency record, achieving 35.2% for commercial-size tandem cells — a landmark in photovoltaic technology.', 'Tandem cells stack a perovskite layer on top of a conventional silicon cell. The perovskite captures high-energy blue light, while silicon captures lower-energy red and infrared light, together harvesting a much broader spectrum.', 'At 35.2% efficiency, these cells convert more than a third of incoming sunlight into electricity — approaching the theoretical Shockley-Queisser limit for tandem architectures of around 42%.', 'Manufacturing costs are projected to add only 10-15% to conventional silicon panel prices, making this technology commercially viable within 2-3 years. Several gigafactory plans are already announced.'],
    quotes: ['"This is the technology that will power the next generation of solar farms." — Dr. Henry Snaith, Oxford PV'],
    keyFindings: ['35.2% efficiency world record for commercial-size cells', 'Only 10-15% cost premium over silicon', 'Commercial production expected by 2027', 'Multiple gigafactory plans announced'],
    relatedTopics: ['Perovskites', 'Photovoltaics', 'Renewable Energy Economics'],
  },
  {
    id: 'a15', title: 'First Commercial Fusion Plant Breaks Ground in Virginia', abstract: 'Commonwealth Fusion Systems begins construction on SPARC-1, targeting 400 MW of net fusion power by 2030.', field: 'CLIMATE & ENERGY', author: 'Dr. Robert Chang', date: '2025-03-25', readTime: '10 min',
    content: ['Commonwealth Fusion Systems has broken ground on the world\'s first commercial fusion power plant near Richmond, Virginia, marking a historic transition from experimental science to commercial energy production.', 'The SPARC-1 reactor uses high-temperature superconducting magnets made from REBCO tape, enabling a compact tokamak design that achieves the magnetic field strength needed for net energy gain at a fraction of the size of ITER.', 'The plant is designed to produce 400 MW of net fusion power — enough to supply approximately 200,000 homes. The fuel, deuterium extracted from seawater, is virtually inexhaustible and produces zero greenhouse gas emissions.', 'With $3 billion in funding secured from investors including Google, Bill Gates, and the U.S. Department of Energy, the project represents the largest single investment in commercial fusion energy to date.'],
    quotes: ['"We are building the future of energy. Fusion is no longer a promise — it\'s a construction project." — Bob Mumgaard, CEO, CFS'],
    keyFindings: ['400 MW net fusion power target', 'High-temperature superconducting magnets enable compact design', '$3 billion funding secured', 'Commercial operation targeted for 2030'],
    relatedTopics: ['Fusion Energy', 'Tokamak', 'Superconducting Magnets', 'Clean Energy'],
  },
  // ROBOTICS
  {
    id: 'a5', title: 'Boston Dynamics Atlas Achieves Autonomous Construction Tasks', abstract: 'Humanoid robot completes full framing of a residential wall without human intervention in 4 hours.', field: 'ROBOTICS', author: 'Dr. Raj Mehta', date: '2025-03-05', readTime: '9 min',
    content: ['Boston Dynamics has demonstrated a new milestone in humanoid robotics: the Atlas robot autonomously framed a residential wall in just 4 hours, a task that typically takes two skilled carpenters 6-8 hours.', 'The robot used a combination of reinforcement learning and large language model-guided planning to interpret blueprints, select materials, and execute complex manipulation tasks with remarkable dexterity.', 'Key innovations include adaptive grasp planning that handles irregular lumber, real-time structural analysis to ensure proper load distribution, and recovery behaviors when tools are dropped or materials break unexpectedly.', 'The construction industry faces a severe labor shortage, with an estimated 500,000 unfilled positions in the US alone. Robotic construction could address this gap while dramatically improving safety on job sites.'],
    quotes: ['"We\'re not replacing construction workers — we\'re augmenting them for dangerous and repetitive tasks." — Robert Playter, CEO, Boston Dynamics'],
    keyFindings: ['4-hour autonomous wall framing completed', 'Adaptive manipulation with irregular materials', 'Integration of LLM planning with physical control', 'Addresses 500,000 unfilled construction jobs in US'],
    relatedTopics: ['Humanoid Robots', 'Construction Technology', 'Reinforcement Learning'],
  },
  // BIOLOGY
  {
    id: 'a7', title: 'DeepMind Solves Protein-Protein Interaction Prediction', abstract: 'AlphaFold 4 predicts multi-protein complex formations with 95% accuracy, unlocking drug target discovery.', field: 'BIOLOGY', author: 'Dr. Ana Torres', date: '2025-03-01', readTime: '10 min',
    content: ['DeepMind\'s AlphaFold 4 has solved one of biology\'s grand challenges: predicting how multiple proteins interact and assemble into functional complexes with near-experimental accuracy.', 'While AlphaFold 2 revolutionized single-protein structure prediction, most biological functions depend on complex interactions between multiple proteins. AlphaFold 4 predicts these assemblies with 95% accuracy.', 'The model was trained on cryo-electron microscopy data of over 100,000 protein complexes, learning the subtle thermodynamic and geometric rules that govern protein-protein recognition and binding.', 'This capability is transformative for drug discovery. Understanding how disease-related proteins interact allows researchers to design drugs that precisely disrupt pathological interactions while leaving healthy ones intact.'],
    quotes: ['"This is the missing piece that turns structural biology into a truly predictive science." — Demis Hassabis, CEO, DeepMind'],
    keyFindings: ['95% accuracy for multi-protein complex prediction', 'Trained on 100,000+ cryo-EM structures', 'Already identified 12 novel drug targets', 'Revolutionizes structure-based drug design'],
    relatedTopics: ['Protein Folding', 'Drug Discovery', 'Structural Biology'],
  },
  {
    id: 'a16', title: 'Synthetic Biology Creates First Self-Replicating Artificial Cell', abstract: 'Craig Venter Institute achieves minimal artificial cell that grows, divides, and evolves with only 473 genes.', field: 'BIOLOGY', author: 'Dr. Kim Novak', date: '2025-02-05', readTime: '12 min',
    content: ['Scientists at the Craig Venter Institute have created the first truly self-replicating artificial cell — a synthetic organism built from scratch that can grow, divide, and even evolve over multiple generations.', 'The organism, JCVI-syn3.1, contains only 473 genes — the minimal set needed for independent life. Every gene was chemically synthesized and assembled into a complete genome that was then booted inside an empty cell membrane.', 'Unlike previous synthetic biology achievements that modified existing organisms, this cell was designed from a blank slate, giving researchers complete control over every aspect of its biology and behavior.', 'The breakthrough has profound implications for biotechnology: synthetic cells could be programmed to produce medicines, biofuels, or materials on demand, serving as living factories with capabilities designed entirely by humans.'],
    quotes: ['"We have crossed the threshold from reading the genetic code to writing it from scratch." — Dr. Craig Venter'],
    keyFindings: ['Self-replicating artificial cell created with 473 genes', 'Complete genome chemically synthesized', 'Cell grows, divides, and evolves independently', 'Foundation for programmable living factories'],
    relatedTopics: ['Synthetic Biology', 'Minimal Genome', 'Bioengineering', 'Origin of Life'],
  },
  // ENGINEERING
  {
    id: 'a8', title: 'Solid-State Batteries Enter Mass Production', abstract: 'Toyota begins commercial production of solid-state batteries with 1,200km range and 10-minute charging.', field: 'ENGINEERING', author: 'Dr. Yuki Tanaka', date: '2025-03-18', readTime: '7 min',
    content: ['Toyota has begun mass production of solid-state batteries at its Himeji facility, marking the beginning of a new era for electric vehicles and energy storage technology worldwide.', 'The batteries use a sulfide-based solid electrolyte instead of liquid, enabling higher energy density (500 Wh/kg vs 250 Wh/kg for current lithium-ion), faster charging, and dramatically improved safety with no flammable liquids.', 'Initial production will supply Toyota\'s new flagship EV, offering 1,200km range and 10% to 80% charging in just 10 minutes — eliminating the two biggest barriers to widespread EV adoption.', 'The technology also enables new form factors: batteries can be made thinner, lighter, and in arbitrary shapes, opening possibilities for wearable electronics, aerospace applications, and grid-scale storage.'],
    quotes: ['"Solid-state batteries will do for EVs what lithium-ion did for smartphones." — Akio Toyoda, Toyota Chairman'],
    keyFindings: ['500 Wh/kg energy density (2x current Li-ion)', '10-minute fast charging to 80% capacity', 'Mass production at commercial scale achieved', 'Eliminates flammability risks of liquid electrolytes'],
    relatedTopics: ['Battery Technology', 'Electric Vehicles', 'Energy Storage'],
  },
  // MATHEMATICS & DATA
  {
    id: 'a9', title: 'Riemann Hypothesis Proof Verified by Mathematical Community', abstract: 'After 3 years of scrutiny, the proof by Dr. Yitang Zhang is accepted, solving the 165-year-old problem.', field: 'MATHEMATICS & DATA', author: 'Dr. Michael Torres', date: '2025-02-20', readTime: '13 min',
    content: ['The mathematical community has formally accepted a proof of the Riemann Hypothesis, one of the seven Millennium Prize Problems and arguably the most important unsolved problem in mathematics for over a century.', 'Dr. Yitang Zhang, known for his breakthrough on bounded gaps between primes, submitted the proof in 2022. After three years of intense verification by dozens of leading mathematicians worldwide, no errors have been found.', 'The Riemann Hypothesis concerns the distribution of prime numbers and the zeros of the Riemann zeta function. Its proof has immediate implications across mathematics, theoretical physics, and modern cryptography.', 'RSA cryptography, which secures most internet communications, relies on the difficulty of factoring large numbers — intimately connected to prime distribution. The proof\'s implications for cybersecurity are still being assessed by intelligence agencies.'],
    quotes: ['"This is the Mount Everest of mathematics. Zhang has reached the summit." — Prof. Terence Tao, UCLA'],
    keyFindings: ['Proof verified by 40+ independent mathematicians', 'Implications for prime number distribution fully characterized', 'Potential impact on RSA cryptography security assessment', '$1 million Millennium Prize awarded'],
    relatedTopics: ['Number Theory', 'Zeta Function', 'Prime Distribution'],
  },
  // EARTH & SPACE
  {
    id: 'a10', title: 'Mars Sample Return: First Martian Soil Arrives on Earth', abstract: 'ESA-NASA joint mission successfully delivers 350g of Perseverance-collected Mars samples to Utah facility.', field: 'EARTH & SPACE', author: 'Dr. Clara Novak', date: '2025-03-20', readTime: '8 min',
    content: ['In a historic achievement for space exploration, the first samples of Martian soil have safely landed on Earth, completing a mission that took over a decade of planning and flawless execution.', 'The Mars Sample Return mission, a joint effort between ESA and NASA, retrieved 30 sealed tubes cached by the Perseverance rover across Jezero Crater — an ancient lake bed believed to have once harbored microbial life.', 'The 350 grams of material include sedimentary rocks, igneous samples, and atmospheric gases. Preliminary analysis suggests the presence of complex organic molecules, though biological origin has not yet been confirmed.', 'Samples are being distributed to 200 laboratories in 30 countries for analysis, using instruments far more sensitive than any rover could carry. Results are expected to transform our understanding of Mars\'s past habitability.'],
    quotes: ['"Holding a piece of Mars in your hands — it changes your perspective on what\'s possible." — Dr. Laurie Leshin, JPL Director'],
    keyFindings: ['350g of Martian material safely returned to Earth', 'Complex organic molecules detected in preliminary analysis', '200 labs in 30 countries conducting detailed analysis', 'Samples from ancient lake bed with habitability potential'],
    relatedTopics: ['Mars Exploration', 'Astrobiology', 'Sample Return Missions'],
  },
  // CHEMISTRY
  {
    id: 'a11', title: 'Catalytic CO2 Conversion Achieves Industrial Scale', abstract: 'Carbon Engineering\'s new catalyst converts atmospheric CO2 to jet fuel at $80/barrel, competitive with fossil fuels.', field: 'CHEMISTRY', author: 'Dr. Amara Osei', date: '2025-03-14', readTime: '9 min',
    content: ['Carbon Engineering has achieved a breakthrough that could transform the fight against climate change: converting atmospheric CO2 into synthetic jet fuel at costs competitive with fossil fuel extraction.', 'The new iron-cobalt catalyst operates at lower temperatures and pressures than previous approaches, dramatically reducing energy requirements. The process captures CO2 directly from ambient air and combines it with green hydrogen.', 'At $80 per barrel equivalent, synthetic aviation fuel is now within the price range of conventional jet fuel, removing the economic barrier to decarbonizing the aviation industry — one of the hardest sectors to electrify.', 'The company has broken ground on a facility in Texas that will produce 100 million liters of synthetic fuel annually, enough to power 10,000 transatlantic flights per year with net-zero carbon emissions.'],
    quotes: ['"We\'re turning air pollution into aviation fuel. The circular carbon economy is here." — Steve Oldham, CEO, Carbon Engineering'],
    keyFindings: ['$80/barrel synthetic fuel from atmospheric CO2', 'New catalyst reduces energy requirements by 60%', '100 million liter/year facility under construction', 'Net-zero aviation fuel at fossil-fuel-competitive prices'],
    relatedTopics: ['Carbon Capture', 'Catalysis', 'Sustainable Aviation'],
  },
  // COMPUTER SCIENCE
  {
    id: 'a17', title: 'Post-Quantum Cryptography Standard Deployed Across Major Browsers', abstract: 'NIST\'s ML-KEM algorithm now protects 80% of web traffic against future quantum computer attacks.', field: 'COMPUTER SCIENCE', author: 'Dr. Anil Gupta', date: '2025-03-28', readTime: '8 min',
    content: ['All major web browsers have completed the rollout of post-quantum cryptographic algorithms, protecting an estimated 80% of global internet traffic against attacks from future quantum computers.', 'The transition centers on ML-KEM (Module-Lattice Key Encapsulation Mechanism), selected by NIST after an 8-year evaluation process. The algorithm\'s security is based on the hardness of lattice problems, which remain intractable even for quantum computers.', 'The deployment uses a hybrid approach, combining traditional elliptic curve cryptography with ML-KEM to ensure security against both classical and quantum attacks during the transition period.', 'The urgency of the transition is driven by "harvest now, decrypt later" attacks, where adversaries capture encrypted traffic today intending to decrypt it once quantum computers become powerful enough.'],
    quotes: ['"We\'re not just protecting today\'s data — we\'re protecting today\'s secrets from tomorrow\'s computers." — Dr. Dustin Moody, NIST'],
    keyFindings: ['80% of web traffic now quantum-resistant', 'ML-KEM deployed in hybrid mode across all major browsers', 'Protects against "harvest now, decrypt later" attacks', 'Lattice-based security intractable for quantum computers'],
    relatedTopics: ['Post-Quantum Cryptography', 'Lattice Problems', 'TLS Protocol', 'NIST Standards'],
  },
];
