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

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeProfile = ATS_PROFILES['ai-engineer'];

  // Metrics counter states
  const [metric1, setMetric1] = useState(0);
  const [metric2, setMetric2] = useState(0);
  const [metric3, setMetric3] = useState(0);
  const [metric4, setMetric4] = useState(0);

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

  // 3D Gyro Parallax effect on mouse move
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let targetRotX = 0, targetRotY = 0;
    let currentRotX = 0, currentRotY = 0;
    let targetTransX = 0, targetTransY = 0;
    let currentTransX = 0, currentTransY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const normX = (e.clientX - centerX) / centerX;
      const normY = (e.clientY - centerY) / centerY;

      targetRotY = normX * 28;
      targetRotX = -normY * 24;
      targetTransX = normX * 45;
      targetTransY = normY * 38;
    };

    const handleMouseLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
      targetTransX = 0;
      targetTransY = 0;
    };

    function updateGyro() {
      currentRotX += (targetRotX - currentRotX) * 0.1;
      currentRotY += (targetRotY - currentRotY) * 0.1;
      currentTransX += (targetTransX - currentTransX) * 0.1;
      currentTransY += (targetTransY - currentTransY) * 0.1;

      if (canvas) {
        canvas.style.transform = `perspective(1200px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) translate3d(${currentTransX.toFixed(1)}px, ${currentTransY.toFixed(1)}px, 0)`;
      }

      animId = requestAnimationFrame(updateGyro);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    updateGyro();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Animate metrics counter on mount
  useEffect(() => {
    const duration = 1600;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setMetric1(parseFloat((ease * 98.7).toFixed(1)));
      setMetric2(parseFloat((ease * 1.8).toFixed(1)));
      setMetric3(Math.floor(ease * 82));
      setMetric4(Math.floor(ease * 140));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleLoginClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
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
            <button 
              onClick={handleLoginClick} 
              className="btn-primary-neon"
              id="landingLoginBtn"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-section" id="hero">
          <div className="container hero-layout">
            <div className="hero-pill-badge" data-reveal>
              <span className="pill-spark">⚡</span>
              <span>Autonomous Talent Intelligence Engine</span>
              <span className="pill-tag">99.4% Precision</span>
            </div>

            <h1 className="hero-title" data-reveal>
              Find the <span className="gradient-text">Right Talent</span> with<br />
              AI Recruitment Screening
            </h1>

            <p className="hero-subtext" data-reveal>
              Eliminate 40+ hours of manual resume audits. Clyptus's multi-modal vector engine evaluates ATS compatibility, simulates deep technical competence, and auto-synthesizes adaptive interview rubrics in sub-seconds.
            </p>

            <div className="hero-cta-group" data-reveal>
              <button 
                onClick={() => navigate(isAuthenticated ? '/candidates' : '/login')} 
                className="btn-hero-primary"
                id="heroPipelineBtn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                <span>Inspect Talent Pipeline</span>
              </button>
            </div>

            {/* Live Metrics Ticker */}
            <div className="metrics-strip" data-reveal>
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
            <div className="section-header" data-reveal>
              <span className="eyebrow">Module 01 // Deep Resume Parsing</span>
              <h2 className="section-title">
                Interactive <span className="gradient-text">ATS Score Optimizer</span>
              </h2>
              <p className="section-desc">
                Test how modern enterprise Applicant Tracking Systems (Workday, Greenhouse, Taleo) perceive candidate resumes with simulated vector token matching.
              </p>
            </div>

            <div className="ats-interactive-grid" data-reveal>
              {/* Live ATS Score Gauge & Diagnostics Panel */}
              <div className="ats-score-panel glass-card" style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>
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
                          strokeDashoffset: progressOffset,
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
                        {activeProfile.score}
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
                        style={{ width: `${activeProfile.lexicon}%` }}
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
                        style={{ width: `${activeProfile.ownership}%` }}
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
                        style={{ width: `${activeProfile.formatting}%` }}
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

        {/* SECTION 2: End-to-End Workflow & Architecture */}
        <section className="section-wrapper" id="workflow">
          <div className="container">
            <div className="section-header" data-reveal>
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
              <a href="#workflow">Workflow Pipeline</a>
              <button 
                onClick={() => navigate(isAuthenticated ? '/candidates' : '/login')}
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                className="text-gray-400 hover:text-purple-300 block text-sm mb-2"
              >
                Candidate Ranking
              </button>
              <button 
                onClick={() => navigate(isAuthenticated ? '/jobs' : '/login')}
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                className="text-gray-400 hover:text-purple-300 block text-sm mb-2"
              >
                Groq Question Generator
              </button>
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
    </div>
  );
}
