import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

interface ATSProfile {
  id: string;
  name: string;
  role: string;
  badge: string;
  score: number;
  tier: string;
  hardSkills: string;
  format: string;
  impact: string;
  lexicon: number;
  ownership: number;
  formatting: number;
  snippet: string;
  insights: string;
}

const ATS_PROFILES: Record<string, ATSProfile> = {
  'ai-engineer': {
    id: 'ai-engineer',
    name: 'Elena Rostova',
    role: 'Staff AI Research Engineer',
    badge: 'CV: Elena Rostova — Curriculum Vitae.pdf',
    score: 96,
    tier: 'Tier 1: Exceptional',
    hardSkills: '98%',
    format: '100%',
    impact: '94%',
    lexicon: 96,
    ownership: 92,
    formatting: 100,
    snippet: `[CORE SUMMARY]
Staff AI Research Engineer specializing in high-throughput inference optimization and low-latency LLM serving.
7+ years experience authoring PyTorch custom CUDA kernels, speculative decoding pipelines, and distributed KV-cache compression.

[EXPERIENCE HIGHLIGHTS]
• Senior AI Performance Lead @ HyperScale AI (2023 - Present)
  - Reduced p99 time-to-first-token (TTFT) by 64% across a 1,024-node H100 cluster via FlashAttention-3 integration.
  - Authored custom Triton memory management allocator saving $1.4M annually in idle GPU footprint.
  - Published primary research paper in NeurIPS 2025 Workshop on low-bit quantized KV-cache compression.

[TECHNICAL SKILLS]
PyTorch, CUDA C++, Triton, vLLM, TensorRT-LLM, Slurm, Ray, Kubernetes, C++20, Python, High-Performance Compute.`,
    insights: 'Candidate exhibits rare high-density alignment for CUDA kernel optimization and distributed PyTorch. Exceeds standard Workday and Greenhouse filters by 34 percentile points.'
  },
  'fullstack': {
    id: 'fullstack',
    name: 'Marcus Vance',
    role: 'Principal Distributed Systems Lead',
    badge: 'CV: Marcus Vance — Principal Distributed Systems.pdf',
    score: 92,
    tier: 'Tier 1: Strong Match',
    hardSkills: '94%',
    format: '99%',
    impact: '88%',
    lexicon: 91,
    ownership: 95,
    formatting: 99,
    snippet: `[CORE SUMMARY]
Principal Distributed Systems Engineer with 10+ years architecting fault-tolerant consensus engines, high-frequency stream processing, and multi-region microservice meshes.

[EXPERIENCE HIGHLIGHTS]
• Principal Infrastructure Architect @ CloudMesh (2022 - Present)
  - Designed distributed event ledger processing 4.2M events/second using Rust, Apache Kafka, and Raft consensus.
  - Led engineering migration of 400+ microservices to Kubernetes service mesh with 99.999% uptime SLA.
  - Reduced inter-region network egress costs by $680k/yr using custom eBPF packet routing.

[TECHNICAL SKILLS]
Rust, Go, C++, Kubernetes, eBPF, Kafka, gRPC, distributed tracing, PostgreSQL, Raft, AWS/GCP Multi-Region.`,
    insights: 'High ATS compatibility for deep systems architecture and cloud scalability. Resume contains explicit quantifiable business metrics ($680k savings, 4.2M msgs/sec) which dramatically boosts ATS impact ranking.'
  },
  'product': {
    id: 'product',
    name: 'Sophia Lin',
    role: 'Director of AI Product',
    badge: 'CV: Sophia Lin — Director of AI Product.pdf',
    score: 89,
    tier: 'Tier 2: Recommended',
    hardSkills: '88%',
    format: '97%',
    impact: '96%',
    lexicon: 86,
    ownership: 97,
    formatting: 98,
    snippet: `[CORE SUMMARY]
Product Executive with 8 years taking frontier generative AI products from zero to $35M ARR. Expert in developer platform UX, model evaluation rubrics, and enterprise compliance.

[EXPERIENCE HIGHLIGHTS]
• Director of Product @ FrontierLabs (2023 - Present)
  - Spearheaded launch of enterprise LLM agent platform, acquiring 120 Fortune 500 customers in first 9 months.
  - Defined end-to-end telemetry and automated evaluation benchmarks for hallucination suppression.
  - Partnered with legal and security teams to achieve full SOC2 Type II and EU AI Act compliance.

[TECHNICAL SKILLS]
Product Lifecycle Management, LLM Benchmarking, PLG Strategy, API Design, SQL, Customer Discovery, Agile.`,
    insights: 'Strong leadership signals and high revenue impact metrics. Minor suggestion: adding more specific model evaluation framework keywords (e.g., RAG triad, HELM benchmark) will push ATS score to 95+.'
  }
};

interface Candidate {
  id: number;
  name: string;
  initials: string;
  role: string;
  category: string;
  match: number;
  matchCaption: string;
  skills: string[];
  synopsis: string;
  experience: string;
  comp: string;
  github: string;
  verdict: string;
}

const CANDIDATE_DATA: Candidate[] = [
  {
    id: 1,
    name: "Dr. Elena Rostova",
    initials: "ER",
    role: "Senior AI Research Scientist",
    category: "ai",
    match: 98,
    matchCaption: "Cosine: 0.984",
    skills: ["PyTorch", "CUDA C++", "Triton", "Speculative Decoding", "Slurm"],
    synopsis: "Author of 3 high-impact inference optimization papers. Proven 64% latency drop on H100 GPU clusters.",
    experience: "7 YOE · Ex-HyperScale",
    comp: "$320k - $360k",
    github: "github.com/erostova-ai",
    verdict: "Exceptional system design and mathematical rigor. Ready for instant onsite."
  },
  {
    id: 2,
    name: "Marcus Vance",
    initials: "MV",
    role: "Principal Distributed Systems Lead",
    category: "systems",
    match: 95,
    matchCaption: "Cosine: 0.952",
    skills: ["Rust", "Go", "Raft Consensus", "Kubernetes", "eBPF"],
    synopsis: "Architected event streaming infrastructure servicing 4.2M requests/second with five-nines uptime.",
    experience: "10 YOE · Ex-CloudMesh",
    comp: "$290k - $340k",
    github: "github.com/marcusvance-core",
    verdict: "High-caliber systems engineer with extensive leadership over multi-region cloud migrations."
  },
  {
    id: 3,
    name: "Tariq Al-Mansoor",
    initials: "TA",
    role: "Staff LLM Alignment & Post-Training",
    category: "ai",
    match: 94,
    matchCaption: "Cosine: 0.941",
    skills: ["RLHF", "DPO", "vLLM", "Constitutional AI", "Python"],
    synopsis: "Specialist in reasoning model post-training and reward modeling. Built safety evaluation harness for 70B models.",
    experience: "6 YOE · Ex-Nexus Labs",
    comp: "$300k - $340k",
    github: "github.com/tariq-align",
    verdict: "Strong domain depth in reinforcement learning and red-teaming automated pipelines."
  },
  {
    id: 4,
    name: "Kavita Reddy",
    initials: "KR",
    role: "Cloud Infrastructure & Platform Architect",
    category: "systems",
    match: 91,
    matchCaption: "Cosine: 0.918",
    skills: ["Terraform", "AWS Multi-Region", "K8s Operator", "Datadog", "ArgoCD"],
    synopsis: "Scaled enterprise cloud footprint to 8 regions with automated zero-trust security and GitOps CD.",
    experience: "8 YOE · Ex-ApexFintech",
    comp: "$260k - $300k",
    github: "github.com/kreddy-infra",
    verdict: "Thorough SRE & security foundation. Demonstrates disciplined operational maturity."
  },
  {
    id: 5,
    name: "Sophia Lin",
    initials: "SL",
    role: "VP of Product Innovation (AI Ops)",
    category: "product",
    match: 89,
    matchCaption: "Cosine: 0.892",
    skills: ["Product Strategy", "LLM Evaluation", "PLG", "Developer UX", "SOC2"],
    synopsis: "Scaled AI developer tools from zero to $35M ARR. Authored automated hallucination benchmark suites.",
    experience: "9 YOE · Ex-FrontierLabs",
    comp: "$310k - $360k",
    github: "sophialin.io/essays",
    verdict: "Visionary product thinker who bridges technical AI research with enterprise commercial viability."
  },
  {
    id: 6,
    name: "Liam O'Connor",
    initials: "LO",
    role: "Computer Vision & Edge Inference Lead",
    category: "ai",
    match: 88,
    matchCaption: "Cosine: 0.884",
    skills: ["TensorRT", "ONNX", "Embedded C++", "YOLO-v11", "ROS2"],
    synopsis: "Deployed real-time perception models on low-power Jetson Orin modules with sub-12ms pipeline latency.",
    experience: "5 YOE · Ex-Autonoma",
    comp: "$250k - $290k",
    github: "github.com/liam-edgevision",
    verdict: "Solid embedded ML profile. Outstanding fit for robotics and edge perception teams."
  }
];

interface QuestionItem {
  badge: string;
  q: string;
  rubric: string;
  followUp: string;
}

const QUESTION_DATABASE: Record<string, Record<string, QuestionItem[]>> = {
  'ai-scientist': {
    'architecture': [
      {
        badge: "SYSTEM DESIGN // HIGH CONCURRENCY INFERENCE",
        q: "How would you design a distributed KV-cache eviction and speculative decoding architecture to serve a 70B parameter model across 8x H100 GPUs while maintaining a sub-10ms Time-to-First-Token under bursty 5,000 QPS load?",
        rubric: "Candidate should mention PagedAttention mechanics, continuous batching, chunked prefill, and inter-GPU NVLink communication topology over PCIe.",
        followUp: "How do you handle speculative decoding verification if the small draft model has high rejection variance on code generation tasks?"
      },
      {
        badge: "MEMORY OPTIMIZATION // KERNEL SYNTHESIS",
        q: "Walk through the architectural trade-offs between FP8, INT4 AWQ, and dynamic block-wise quantization for LLM weights and activations during matrix multiplications in custom CUDA/Triton kernels.",
        rubric: "Look for explicit understanding of tensor memory bandwidth bottlenecks vs. compute bound ALU saturation, precision degradation mitigation, and dequantization overhead.",
        followUp: "What specific hardware changes in NVIDIA Hopper/Blackwell architectures alter this memory bandwidth tradeoff?"
      }
    ],
    'hands-on': [
      {
        badge: "DEBUGGING // DISTRIBUTED GRADIENT DRIFT",
        q: "During multi-node FSDP (Fully Sharded Data Parallel) pre-training on 256 GPUs, you notice sudden loss spikes every 1,400 steps without NaN loss values. How do you systematically isolate whether this is an FP16 overflow, gradient clipping bug, or silent NCCL socket drop?",
        rubric: "Look for telemetry diagnosis (monitoring torch.distributed logs, PyTorch Profiler traces, Inf/NaN hooks on backward passes, and gradient norm anomaly detection).",
        followUp: "How would you implement checkpoint rollback without losing more than 10 minutes of compute?"
      }
    ],
    'behavioral': [
      {
        badge: "RESEARCH LEADERSHIP // DEADLINE PRESSURES",
        q: "Describe a situation where an experimental model architecture showed promising academic metrics in paper benchmarks, but completely failed production cost and latency SLAs. How did you realign the team?",
        rubric: "Evaluates ability to kill pet projects objectively, communicate ROI to stakeholders, and pivot from theoretical research to high-impact production engineering.",
        followUp: "What heuristic do you use to determine whether to optimize an existing model or train a new baseline from scratch?"
      }
    ],
    'rapid-fire': [
      {
        badge: "RAPID FIRE // CONCEPT VERIFICATION",
        q: "In 60 seconds or less: explain why FlashAttention achieves a 2x-4x speedup over standard attention without mathematically changing the softmax output.",
        rubric: "Must pinpoint SRAM tiling and online softmax calculation to eliminate expensive reads/writes to high-bandwidth GPU memory (HBM).",
        followUp: "What is the primary difference between FlashAttention-2 and FlashAttention-3?"
      }
    ]
  },
  'backend-lead': {
    'architecture': [
      {
        badge: "CONSENSUS & SCALE // DISTRIBUTED LEDGER",
        q: "You need to build a globally distributed event sourcing ledger with multi-region active-active writes that guarantees linearizability for account balances. How do you design the storage, quorum, and conflict resolution?",
        rubric: "Candidate should explain Raft vs Paxos trade-offs, Spanner-style TrueTime vs Lamport vector clocks, and partitioning strategies that avoid global lock contention.",
        followUp: "What happens to write availability when transatlantic fiber lines experience a 300ms partition?"
      }
    ],
    'hands-on': [
      {
        badge: "CONCURRENCY & PERFORMANCE // LOW LATENCY",
        q: "A high-throughput Go service is suffering from catastrophic stop-the-world GC pauses during peak traffic. How would you profile memory allocations and rewrite the critical path to achieve zero-heap allocation?",
        rubric: "Should demonstrate proficiency with pprof, sync.Pool object reuse, escape analysis, and pre-allocated byte slices.",
        followUp: "Under what conditions would you consider rewriting that microservice module in Rust?"
      }
    ],
    'behavioral': [
      {
        badge: "INCIDENT POST-MORTEM // REPUTATION RISK",
        q: "Tell me about a catastrophic production outage you personally caused or were in charge of mitigating. How did you manage customer communication and engineer safeguards against recurrence?",
        rubric: "Focuses on radical ownership, psychological safety in post-mortems, and engineering automated regression tests rather than blaming human error.",
        followUp: "How did you modify your staging deployment pipeline the following week?"
      }
    ],
    'rapid-fire': [
      {
        badge: "RAPID FIRE // DISTRIBUTED SYSTEMS",
        q: "What is the difference between at-least-once, at-most-once, and exactly-once message delivery in Apache Kafka, and why is exactly-once technically difficult across external database sinks?",
        rubric: "Explanation of two-phase commits, idempotency keys, and transaction coordinator mechanics.",
        followUp: "What is the write amplification factor of dual-write idempotency?"
      }
    ]
  }
};

const DEFAULT_QUESTIONS: QuestionItem[] = [
  {
    badge: "CORE ARCHITECTURE // SCALABILITY",
    q: "How would you design a fault-tolerant, horizontally scalable architecture for this organization that handles a 10x traffic surge without human intervention?",
    rubric: "Evaluates modular decomposition, rate limiting, circuit breaking, caching layers, and decoupled async queues.",
    followUp: "What is the single point of failure in that proposed design?"
  },
  {
    badge: "TECHNICAL DECISION-MAKING // TRADE-OFFS",
    q: "Walk me through the hardest technical trade-off you had to defend in the last 18 months where neither choice was clearly optimal.",
    rubric: "Demonstrates pragmatism, communication of technical debt, business alignment, and collaborative consensus building.",
    followUp: "If you had 3 extra months, would you have chosen differently?"
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeProfileKey, setActiveProfileKey] = useState<string>('ai-engineer');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Candidate Pipeline State
  const [candidateFilter, setCandidateFilter] = useState<string>('all');
  const [candidateSearch, setCandidateSearch] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Question Generator State
  const [qRole, setQRole] = useState<string>('ai-scientist');
  const [qFocus, setQFocus] = useState<string>('architecture');
  const [qTier, setQTier] = useState<string>('Tier 1: Senior/Staff (5-8 YOE)');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionItem[]>(
    QUESTION_DATABASE['ai-scientist']['architecture']
  );
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  const activeProfile = ATS_PROFILES[activeProfileKey] || ATS_PROFILES['ai-engineer'];

  // Metrics counter states
  const [metric1, setMetric1] = useState(98.7);
  const [metric2, setMetric2] = useState(1.8);
  const [metric3, setMetric3] = useState(82);
  const [metric4, setMetric4] = useState(140);

  // SVG ring circumference (r=75 => 2 * PI * 75 ~= 471.2)
  const circleCircumference = 2 * Math.PI * 75;
  const progressOffset = circleCircumference - (activeProfile.score / 100) * circleCircumference;

  // Quantum Canvas & Particle Mesh setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const particleCount = Math.min(window.innerWidth > 768 ? 95 : 45, 120);
    const maxDistance = 160;
    const mouse = { x: null as number | null, y: null as number | null, radius: 190 };
    let scrollY = window.pageYOffset;
    let lastScrollY = scrollY;
    let scrollVelocity = 0;

    function resize() {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    }

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseColor: string;
      alpha: number;
      pulseSpeed: number;
      pulseVal: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.9;
        this.vy = (Math.random() - 0.5) * 0.9;
        this.radius = Math.random() * 2.6 + 1.2;
        this.baseColor = Math.random() > 0.4 ? 'rgba(168, 85, 247, ' : 'rgba(217, 70, 239, ';
        this.alpha = Math.random() * 0.6 + 0.3;
        this.pulseSpeed = Math.random() * 0.03 + 0.01;
        this.pulseVal = Math.random() * Math.PI;
      }

      update() {
        this.y -= scrollVelocity * 0.18;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        if (this.y > height + 20) this.y = -20;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 3.8;
            this.y -= (dy / dist) * force * 3.8;
          }
        }

        this.pulseVal += this.pulseSpeed;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        const currentR = this.radius + Math.sin(this.pulseVal) * 0.7;
        ctx.arc(this.x, this.y, Math.max(currentR, 0.5), 0, Math.PI * 2);
        ctx.fillStyle = this.baseColor + this.alpha + ')';
        ctx.fill();
      }
    }

    let particles: Particle[] = [];
    function initParticles() {
      resize();
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Glowing cursor spotlight aura
      if (mouse.x !== null && mouse.y !== null) {
        const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 250);
        aura.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
        aura.addColorStop(0.35, 'rgba(139, 92, 246, 0.08)');
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, width, height);
      }

      // Inter-particle mesh connections
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistance * maxDistance) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / maxDistance) * 0.32;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.stroke();
          }
        }

        // Connect nearby particles directly to mouse cursor with laser beams
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - particles[i].x;
          const dy = mouse.y - particles[i].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < mouse.radius * mouse.radius) {
            const dist = Math.sqrt(distSq);
            const beamAlpha = (1 - dist / mouse.radius) * 0.75;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(217, 70, 239, ${beamAlpha})`;
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.lineWidth = 1;
          }
        }
      }

      // Update & draw background particles
      for (const p of particles) {
        p.update();
        p.draw();
      }

      scrollVelocity *= 0.92;
      animId = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      resize();
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleScroll = () => {
      scrollY = window.pageYOffset;
      scrollVelocity = scrollY - lastScrollY;
      lastScrollY = scrollY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });

    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Filter candidates
  const filteredCandidates = CANDIDATE_DATA.filter(c => {
    const matchCat = candidateFilter === 'all' || c.category === candidateFilter;
    const matchSearch =
      candidateSearch === '' ||
      c.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.role.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(candidateSearch.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Re-analyze action simulation
  const handleReanalyze = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
    }, 600);
  };

  // Generate Questions Action
  const handleGenerateQuestions = () => {
    setIsGeneratingQuestions(true);
    setTimeout(() => {
      const roleData = QUESTION_DATABASE[qRole] || {};
      const questions = roleData[qFocus] || DEFAULT_QUESTIONS;
      setGeneratedQuestions(questions);
      setIsGeneratingQuestions(false);
    }, 450);
  };

  const handleCopyQuestions = () => {
    const text = generatedQuestions
      .map((q, idx) => `Q${idx + 1} (${q.badge}):\n${q.q}\nRubric: ${q.rubric}\nFollow-Up: ${q.followUp}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 2000);
    });
  };

  const handleSignInClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleQuickDemoLogin = () => {
    login('mock-jwt-token-12345', {
      id: 1,
      name: 'Demo Recruiter',
      email: 'admin@example.com',
      role: 'recruiter'
    });
    navigate('/dashboard');
  };

  return (
    <div className="landing-page-root cyber-theme">
      {/* Interactive Background Quantum Canvas */}
      <canvas id="quantum-canvas" ref={canvasRef} />
      <div className="ambient-glow glow-top" />
      <div className="ambient-glow glow-bottom" />

      {/* Cyber Navigation */}
      <header className="cyber-nav">
        <div className="nav-container">
          <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className="brand-icon">
              <span className="pulse-ring" />
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#brandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="url(#brandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="url(#brandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="brandGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#c084fc" />
                    <stop offset="1" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="brand-name">
              CLYPTUS<span className="brand-accent">.AI</span>
            </span>
          </a>

          <div className="nav-actions">
            <div className="engine-badge">
              <span className="live-dot" />
              <span className="badge-text">Core v4.9 Active</span>
            </div>
            
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn-primary-neon"
                id="landingDashboardBtn"
              >
                Go to Dashboard
              </button>
            ) : (
              <button 
                onClick={handleSignInClick} 
                className="btn-primary-neon"
                id="landingSignInBtn"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-section" id="hero">
          <div className="container hero-layout">
            <div className="hero-pill-badge">
              <span className="pill-spark">⚡</span>
              <span>Autonomous Talent Intelligence Engine</span>
              <span className="pill-tag">99.4% Precision</span>
            </div>

            <h1 className="hero-title">
              Find the <span className="gradient-text">Right Talent</span> with<br />
              AI Recruitment Screening
            </h1>

            <p className="hero-subtext">
              Eliminate 40+ hours of manual resume audits. Clyptus's multi-modal vector engine evaluates ATS compatibility, simulates deep technical competence, and auto-synthesizes adaptive interview rubrics in sub-seconds.
            </p>

            <div className="hero-cta-group">
              <button 
                onClick={() => navigate(isAuthenticated ? '/upload' : '/login')} 
                className="btn-hero-primary"
                id="heroLaunchBtn"
              >
                <span>Launch Live ATS Audit</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <a href="#candidate-dossier" className="btn-hero-secondary" id="heroPipelineBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                <span>Inspect Talent Pipeline</span>
              </a>
            </div>

            {/* Live Metrics Ticker */}
            <div className="metrics-strip">
              <div className="metric-card">
                <div className="metric-number">{metric1}%</div>
                <div className="metric-label">Semantic Match Accuracy</div>
              </div>
              <div className="metric-divider" />
              <div className="metric-card">
                <div className="metric-number">{metric2}s</div>
                <div className="metric-label">Mean Parsing Latency</div>
              </div>
              <div className="metric-divider" />
              <div className="metric-card">
                <div className="metric-number">{metric3}%</div>
                <div className="metric-label">Time-to-Hire Reduction</div>
              </div>
              <div className="metric-divider" />
              <div className="metric-card">
                <div className="metric-number">{metric4}K+</div>
                <div className="metric-label">Candidates Verified</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: Interactive ATS Score Scanner */}
        <section className="section-wrapper" id="ats-scanner">
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">Module 01 // Deep Resume Parsing</span>
              <h2 className="section-title">
                Interactive <span className="gradient-text">ATS Score Optimizer</span>
              </h2>
              <p className="section-desc">
                Test how modern enterprise Applicant Tracking Systems (Workday, Greenhouse, Taleo) perceive candidate resumes with simulated vector token matching.
              </p>
            </div>

            <div className="ats-interactive-grid">
              {/* Left: Sample Profile Selection & Document Preview */}
              <div className="ats-control-panel glass-card">
                <div className="panel-topbar">
                  <div className="topbar-tag">CANDIDATE DOSSIER SAMPLES</div>
                  <div className="topbar-status">SELECT ROLE TO AUDIT</div>
                </div>

                <div className="sample-picker">
                  <label className="input-label">Select Candidate CV Benchmark:</label>
                  <div className="profile-buttons">
                    {Object.values(ATS_PROFILES).map(profile => (
                      <button
                        key={profile.id}
                        onClick={() => setActiveProfileKey(profile.id)}
                        className={`profile-btn ${activeProfileKey === profile.id ? 'active' : ''}`}
                      >
                        <div className="btn-role">{profile.name} — {profile.role}</div>
                        <div className="btn-meta">Score {profile.score}%</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="resume-preview-box">
                  <div className="preview-header">
                    <span className="preview-title" id="resumeTitle">{activeProfile.badge}</span>
                    <span className="preview-badge">Vectorized</span>
                  </div>
                  <pre className="resume-snippet" id="resumeSnippet">
                    {activeProfile.snippet}
                  </pre>
                </div>

                <div className="audit-action-bar">
                  <button 
                    onClick={handleReanalyze} 
                    className="btn-scan" 
                    id="reanalyzeBtn"
                    disabled={isSynthesizing}
                  >
                    <span>{isSynthesizing ? 'Synthesizing Vectors...' : '⚡ Re-Synthesize ATS Vectors'}</span>
                  </button>
                  <button 
                    onClick={() => navigate(isAuthenticated ? '/upload' : '/login')}
                    className="btn-inspect"
                    style={{ padding: '8px 16px' }}
                  >
                    Upload Live Resume
                  </button>
                </div>
              </div>

              {/* Right: Live Score Gauge & Diagnostics */}
              <div className="ats-score-panel glass-card">
                <div className="panel-topbar">
                  <div className="topbar-tag">ATS EVALUATION TELEMETRY</div>
                  <div className="live-pill">PARSED OK</div>
                </div>

                <div className="gauge-display">
                  <div className="radial-gauge-container">
                    <svg className="progress-ring" width="180" height="180">
                      <circle
                        className="progress-ring__bg"
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="12"
                        fill="transparent"
                        r="75"
                        cx="90"
                        cy="90"
                      />
                      <circle
                        className="progress-ring__circle"
                        id="atsProgressCircle"
                        stroke="url(#cyanViolet)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        fill="transparent"
                        r="75"
                        cx="90"
                        cy="90"
                        style={{
                          strokeDasharray: circleCircumference,
                          strokeDashoffset: isSynthesizing ? circleCircumference : progressOffset,
                          transition: 'stroke-dashoffset 0.8s ease-in-out'
                        }}
                      />
                      <defs>
                        <linearGradient id="cyanViolet" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="gauge-value">
                      <span className="score-number" id="atsScoreValue">
                        {isSynthesizing ? '...' : activeProfile.score}
                      </span>
                      <span className="score-max">/100</span>
                      <span className="score-rating" id="atsScoreTier">{activeProfile.tier}</span>
                    </div>
                  </div>

                  <div className="gauge-stats">
                    <div className="micro-stat">
                      <span className="m-val" id="statKeywords">{activeProfile.hardSkills}</span>
                      <span className="m-lbl">Hard Skills Match</span>
                    </div>
                    <div className="micro-stat">
                      <span className="m-val" id="statFormat">{activeProfile.format}</span>
                      <span className="m-lbl">Parse Cleanliness</span>
                    </div>
                    <div className="micro-stat">
                      <span className="m-val" id="statImpact">{activeProfile.impact}</span>
                      <span className="m-lbl">Quantified Impact</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Category Bars */}
                <div className="breakdown-list">
                  <div className="breakdown-item">
                    <div className="b-header">
                      <span>Technical Lexicon Density</span>
                      <span id="scoreLexicon">{activeProfile.lexicon}%</span>
                    </div>
                    <div className="cyber-bar-track">
                      <div
                        className="cyber-bar-fill"
                        id="barLexicon"
                        style={{ width: `${isSynthesizing ? 0 : activeProfile.lexicon}%` }}
                      />
                    </div>
                  </div>
                  <div className="breakdown-item">
                    <div className="b-header">
                      <span>Leadership & System Ownership</span>
                      <span id="scoreOwnership">{activeProfile.ownership}%</span>
                    </div>
                    <div className="cyber-bar-track">
                      <div
                        className="cyber-bar-fill"
                        id="barOwnership"
                        style={{ width: `${isSynthesizing ? 0 : activeProfile.ownership}%` }}
                      />
                    </div>
                  </div>
                  <div className="breakdown-item">
                    <div className="b-header">
                      <span>ATS Machine-Readable Formatting</span>
                      <span id="scoreFormatting">{activeProfile.formatting}%</span>
                    </div>
                    <div className="cyber-bar-track">
                      <div
                        className="cyber-bar-fill"
                        id="barFormatting"
                        style={{ width: `${isSynthesizing ? 0 : activeProfile.formatting}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Optimization Recommendations */}
                <div className="ai-recommendation-box">
                  <div className="rec-title">
                    <span className="spark-dot" />
                    <span>AI Recruiter Insights</span>
                  </div>
                  <p className="rec-content" id="atsInsights">
                    {activeProfile.insights}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Activated Candidate Intelligence Pipeline Dossier */}
        <section className="section-wrapper" id="candidate-dossier">
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">Module 02 // Candidate Intelligence Dossier</span>
              <h2 className="section-title">
                Autonomous <span className="gradient-text">Talent Pipeline Leaderboard</span>
              </h2>
              <p className="section-desc">
                High-dimensional vector embeddings rank candidates across technical competence, system ownership, and verified background signals.
              </p>
            </div>

            {/* Candidate Search & Filter Toolbar */}
            <div className="candidate-toolbar glass-card">
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search by candidate name, role, or tech stack (e.g. PyTorch, Rust, CUDA)..."
                />
              </div>

              <div className="filter-pills">
                {[
                  { key: 'all', label: 'All Candidates' },
                  { key: 'ai', label: 'AI & Inference' },
                  { key: 'systems', label: 'Systems & Cloud' },
                  { key: 'product', label: 'Product & Ops' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setCandidateFilter(tab.key)}
                    className={`filter-pill ${candidateFilter === tab.key ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="candidate-count-badge">
                Displaying <strong>{filteredCandidates.length}</strong> Qualified Profiles
              </div>
            </div>

            {/* Candidate Cards Grid */}
            <div className="candidate-grid" id="candidateGrid">
              {filteredCandidates.map(cand => (
                <div key={cand.id} className="candidate-card glass-card">
                  <div>
                    <div className="cand-top">
                      <div className="cand-profile">
                        <div className="cand-avatar">{cand.initials}</div>
                        <div>
                          <div className="cand-name">{cand.name}</div>
                          <div className="cand-role">{cand.role}</div>
                        </div>
                      </div>
                      <div className="cand-match-badge">
                        <div className="match-pct">{cand.match}%</div>
                        <div className="match-caption">{cand.matchCaption}</div>
                      </div>
                    </div>

                    <div className="cand-tags">
                      {cand.skills.map((s, idx) => (
                        <span key={idx} className="skill-tag">{s}</span>
                      ))}
                    </div>

                    <p className="cand-synopsis">"{cand.synopsis}"</p>
                  </div>

                  <div className="cand-footer">
                    <span className="cand-meta">{cand.experience}</span>
                    <button
                      className="btn-inspect"
                      onClick={() => setSelectedCandidate(cand)}
                    >
                      Inspect Dossier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: Activated AI Interview Question Synthesis */}
        <section className="section-wrapper" id="question-gen">
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">Module 03 // Adaptive Interview Synthesis</span>
              <h2 className="section-title">
                Dynamic <span className="gradient-text">Interview Question Generator</span>
              </h2>
              <p className="section-desc">
                Synthesize context-aware technical inquiries and grading rubrics mapped directly to candidate resumes and job requirements.
              </p>
            </div>

            <div className="qgen-wrapper glass-card">
              {/* Controls */}
              <div className="qgen-controls">
                <div className="control-group">
                  <label className="q-label">Target Role Evaluation:</label>
                  <select
                    className="cyber-select"
                    value={qRole}
                    onChange={(e) => setQRole(e.target.value)}
                  >
                    <option value="ai-scientist">Staff AI Research Scientist (CUDA / PyTorch)</option>
                    <option value="backend-lead">Principal Systems Engineer (Rust / Kafka / Distributed)</option>
                  </select>
                </div>

                <div className="control-group">
                  <label className="q-label">Interview Competency Focus:</label>
                  <select
                    className="cyber-select"
                    value={qFocus}
                    onChange={(e) => setQFocus(e.target.value)}
                  >
                    <option value="architecture">System Design & Scale</option>
                    <option value="hands-on">Hands-On Debugging</option>
                    <option value="behavioral">Research Leadership & Alignment</option>
                    <option value="rapid-fire">Rapid-Fire Verification</option>
                  </select>
                </div>

                <div className="control-group">
                  <label className="q-label">Experience Tier Calibration:</label>
                  <select
                    className="cyber-select"
                    value={qTier}
                    onChange={(e) => setQTier(e.target.value)}
                  >
                    <option value="Tier 1: Senior/Staff (5-8 YOE)">Tier 1: Senior/Staff (5-8 YOE)</option>
                    <option value="Tier 2: Principal/Lead (8-12+ YOE)">Tier 2: Principal/Lead (8-12+ YOE)</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateQuestions}
                  className="btn-generate"
                  disabled={isGeneratingQuestions}
                >
                  <span className="gen-pulse" />
                  <span>{isGeneratingQuestions ? 'Synthesizing with LLM...' : '⚡ Generate Adaptive Rubric'}</span>
                </button>

                <div style={{ marginTop: '0.8rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--neon-lavender)', fontWeight: 600, marginBottom: '4px' }}>
                    🤖 LIVE GROQ LPU ENGINE CONNECTED
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Portal supports sub-2s generation with your custom Groq API keys under <strong>/jobs</strong>.
                  </p>
                </div>
              </div>

              {/* Output Stream */}
              <div className="qgen-output-box">
                <div className="output-topbar">
                  <div className="output-title">
                    <span className="terminal-dots">
                      <span /><span /><span />
                    </span>
                    <span>clyptus-llm-evaluator // {qRole}</span>
                  </div>
                  <button onClick={handleCopyQuestions} className="copy-btn">
                    {copiedStatus ? 'Copied!' : 'Copy Rubric'}
                  </button>
                </div>

                <div className="questions-stream-area">
                  {isGeneratingQuestions ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neon-lavender)', fontFamily: 'var(--font-code)' }}>
                      <div className="gen-pulse" style={{ display: 'inline-block', marginRight: '8px' }} />
                      Streaming adaptive evaluation rubric from Clyptus LLM Inference Engine...
                    </div>
                  ) : (
                    generatedQuestions.map((item, idx) => (
                      <div key={idx} className="q-card">
                        <span className="q-badge">{item.badge}</span>
                        <p className="q-text">Q{idx + 1}: {item.q}</p>
                        <div className="q-rubric">
                          <span className="rubric-label">Evaluation Rubric: </span>{item.rubric}
                          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                            <strong style={{ color: 'var(--neon-lavender)' }}>Suggested Follow-Up: </strong>"{item.followUp}"
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: End-to-End Workflow & Architecture */}
        <section className="section-wrapper" id="workflow">
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">Enterprise Pipeline // 5-Stage Autonomous Flow</span>
              <h2 className="section-title">
                How Clyptus Works on <span className="gradient-text">Autopilot</span>
              </h2>
              <p className="section-desc">
                From unstructured PDF intake to final interview readiness without a single manual spreadsheet.
              </p>
            </div>

            <div className="workflow-timeline">
              <div 
                className="timeline-card glass-card cursor-pointer" 
                onClick={() => navigate(isAuthenticated ? '/upload' : '/login')}
              >
                <div className="t-step">01</div>
                <div className="t-icon">📑</div>
                <h4 className="t-title">Upload Resume</h4>
                <p className="t-desc">Upload candidate resumes for instant AI parsing and structuring.</p>
                <div className="t-tag">No Data Loss · PDF & DOCX</div>
              </div>

              <div 
                className="timeline-card glass-card cursor-pointer" 
                onClick={() => navigate(isAuthenticated ? '/upload' : '/login')}
              >
                <div className="t-step">02</div>
                <div className="t-icon">🧠</div>
                <h4 className="t-title">Upload JD</h4>
                <p className="t-desc">Upload job descriptions to extract key requirements, skills, and target criteria for semantic matching.</p>
                <div className="t-tag">Cosine 0.98 Match</div>
              </div>

              <div 
                className="timeline-card glass-card cursor-pointer" 
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              >
                <div className="t-step">03</div>
                <div className="t-icon">🎙️</div>
                <h4 className="t-title">Resume Matching</h4>
                <p className="t-desc">Our AI engine compares semantic conceptual embeddings between job specifications and candidate track records.</p>
                <div className="t-tag">Anti-Cheating Guard</div>
              </div>

              <div 
                className="timeline-card glass-card cursor-pointer" 
                onClick={() => navigate(isAuthenticated ? '/candidates' : '/login')}
              >
                <div className="t-step">04</div>
                <div className="t-icon">🏆</div>
                <h4 className="t-title">Scoring and Candidate Selection</h4>
                <p className="t-desc">Candidates are automatically scored and ranked, providing a concise dashboard for final selection.</p>
                <div className="t-tag">Hiring-Ready Leaderboard</div>
              </div>

              <div 
                className="timeline-card glass-card cursor-pointer" 
                onClick={() => navigate(isAuthenticated ? '/jobs' : '/login')}
              >
                <div className="t-step">05</div>
                <div className="t-icon">🤖</div>
                <h4 className="t-title">Interview Question Generation</h4>
                <p className="t-desc">Auto-synthesize highly contextual, adaptive interview questions powered by ultra-fast Groq LPUs based on candidate skill gaps.</p>
                <div className="t-tag">Groq LPU Engine Active</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="cta-banner-section">
          <div className="container">
            <div className="glass-card cta-box">
              <div className="cta-glow" />
              <div className="hero-pill-badge" style={{ margin: '0 auto 1.5rem auto' }}>
                <span className="pill-spark">⚡</span>
                <span>Enterprise Recruitment Engine Ready</span>
              </div>
              <h2 className="cta-title">
                Ready to Supercharge Your <span className="gradient-text">Recruitment Funnel</span>?
              </h2>
              <p className="cta-sub">
                Connect your hiring pipeline with Clyptus AI. Score resumes, rank talent, and generate tailored interview rubrics in sub-seconds.
              </p>
              <div className="cta-action-row">
                <button 
                  onClick={handleSignInClick} 
                  className="btn-hero-primary"
                  id="ctaSignInBtn"
                >
                  <span>{isAuthenticated ? 'Open Recruitment Dashboard' : 'Sign In to Portal'}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                {!isAuthenticated && (
                  <button 
                    onClick={handleQuickDemoLogin}
                    className="btn-hero-secondary"
                    id="ctaDemoBtn"
                  >
                    <span>Instant Demo Access</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Cyber Footer */}
      <footer className="cyber-footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <div className="brand-name">
              CLYPTUS<span className="brand-accent">.AI</span>
            </div>
            <p>
              Autonomous Talent Intelligence Platform for modern engineering, product, and research organizations.
            </p>
            <div className="compliance-badges">
              <span className="badge-pill">SOC2 Type II Certified</span>
              <span className="badge-pill">GDPR Compliant</span>
              <span className="badge-pill">Bias-Mitigated Models</span>
            </div>
          </div>

          <div className="footer-links">
            <div className="f-col">
              <div className="f-heading">Platform</div>
              <a href="#ats-scanner">ATS Optimizer</a>
              <a href="#candidate-dossier">Candidate Dossier</a>
              <a href="#question-gen">Question Generator</a>
              <a href="#workflow">Workflow Pipeline</a>
            </div>
            <div className="f-col">
              <div className="f-heading">Integrations</div>
              <a href="#workflow">Greenhouse</a>
              <a href="#workflow">Lever</a>
              <a href="#workflow">Ashby</a>
              <a href="#workflow">Workday</a>
            </div>
            <div className="f-col">
              <div className="f-heading">Enterprise</div>
              <a href="#hero">Security Overview</a>
              <a href="#hero">AI Ethics & Bias Audit</a>
              <a href="#hero">Custom Vector Fine-Tuning</a>
              <a href="#hero">Privacy Policy</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom container">
          <div>© 2026 Clyptus AI Systems Inc. All rights reserved.</div>
          <div className="telemetry-info">
            Status: <span className="status-online">● All Systems Nominal</span> | Latency: 24ms
          </div>
        </div>
      </footer>

      {/* Candidate Dossier Modal */}
      {selectedCandidate && (
        <div className="candidate-modal-overlay active" onClick={() => setSelectedCandidate(null)}>
          <div className="candidate-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedCandidate(null)}>&times;</button>
            <div id="modalContent">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="cand-avatar" style={{ width: '56px', height: '56px', fontSize: '1.3rem' }}>
                  {selectedCandidate.initials}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{selectedCandidate.name}</h3>
                  <p style={{ color: 'var(--neon-lavender)', fontSize: '0.9rem' }}>{selectedCandidate.role}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>AI VETTING SCORE</span>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--neon-green)' }}>{selectedCandidate.match}% Match</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TARGET COMPENSATION</span>
                  <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{selectedCandidate.comp}</strong>
                </div>
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontSize: '0.78rem', fontFamily: 'var(--font-code)', color: 'var(--neon-purple)', display: 'block', marginBottom: '4px' }}>
                  AUTOMATED AI SCREENING VERDICT
                </label>
                <p style={{ fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.6 }}>{selectedCandidate.verdict}</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontFamily: 'var(--font-code)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  VERIFIED COMPETENCY BADGES
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedCandidate.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="skill-tag"
                      style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.35)', color: 'var(--neon-lavender)' }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  className="btn-hero-primary"
                  style={{ flex: 1, padding: '12px 20px', fontSize: '0.92rem' }}
                  onClick={() => {
                    alert(`Interview invite dispatched to ${selectedCandidate.name} via autonomous calendar assistant!`);
                    setSelectedCandidate(null);
                  }}
                >
                  Fast-Track to Onsite
                </button>
                <button
                  className="btn-hero-secondary"
                  style={{ padding: '12px 20px', fontSize: '0.92rem' }}
                  onClick={() => {
                    setSelectedCandidate(null);
                    window.location.hash = '#ats-scanner';
                  }}
                >
                  Audit Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
