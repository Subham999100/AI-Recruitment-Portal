import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Sparkles, 
  MapPin, 
  Clock, 
  Users, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  ChevronRight, 
  Award, 
  Zap, 
  HelpCircle, 
  Sliders, 
  Layers, 
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Key,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  Trash2,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { mockJobs, sampleCandidatePresets } from '../services/mockData';
import { candidateService } from '../services/candidateService';
import { interviewService, DEFAULT_GROQ_MODEL } from '../services/interviewService';
import { Job, Candidate, InterviewKit, InterviewQuestion } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

export default function Jobs() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'generator'>('jobs');
  const [jobs] = useState<Job[]>(mockJobs);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Groq API Settings State
  const [groqKey, setGroqKey] = useState<string>('');
  const [inputGroqKey, setInputGroqKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_GROQ_MODEL);
  const [showKeyDrawer, setShowKeyDrawer] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [keySavedNotification, setKeySavedNotification] = useState<string | null>(null);
  const [backendConfigured, setBackendConfigured] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Generator form state
  const [selectedJobId, setSelectedJobId] = useState<number | 'custom'>(1);
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customJobDescription, setCustomJobDescription] = useState('');

  const [selectedCandidateMode, setSelectedCandidateMode] = useState<'existing' | 'preset' | 'custom'>('preset');
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | ''>('');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customCandidateName, setCustomCandidateName] = useState('');
  const [candidateExperience, setCandidateExperience] = useState<number>(5);
  const [candidateResumeText, setCandidateResumeText] = useState('');

  // Generation status and result
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(1);
  const [generatedKit, setGeneratedKit] = useState<InterviewKit | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    // 1. Check stored Groq API Key and Model
    const storedKey = interviewService.getStoredApiKey();
    if (storedKey) {
      setGroqKey(storedKey);
      setInputGroqKey(storedKey);
    }
    const storedModel = interviewService.getStoredModel();
    if (storedModel) {
      setSelectedModel(storedModel);
    }

    // 2. Check Backend Groq Status
    interviewService.checkBackendGroqStatus().then(status => {
      if (status.configured) {
        setBackendConfigured(true);
      }
    }).catch(() => {});

    // 3. Load existing candidates if any
    candidateService.getCandidates().then(res => {
      setCandidates(res.data);
      if (res.data.length > 0) {
        setSelectedCandidateMode('existing');
        setSelectedCandidateId(res.data[0].id);
        setCandidateExperience(res.data[0].experience);
        setCandidateResumeText(res.data[0].summary || `${res.data[0].name} has ${res.data[0].experience} years of experience in ${res.data[0].skills.join(', ')}.`);
      } else {
        applyPreset(0);
      }
    }).catch(() => {
      applyPreset(0);
    });
  }, []);

  const handleSaveGroqKey = () => {
    const trimmed = inputGroqKey.trim();
    if (trimmed) {
      interviewService.setStoredApiKey(trimmed);
      setGroqKey(trimmed);
      setKeySavedNotification('Groq API Key saved securely in your browser!');
      setTimeout(() => setKeySavedNotification(null), 3000);
      setShowKeyDrawer(false);
      setGenerationError(null);
    }
  };

  const handleClearGroqKey = () => {
    interviewService.clearStoredApiKey();
    setGroqKey('');
    setInputGroqKey('');
    setKeySavedNotification('Groq API Key removed.');
    setTimeout(() => setKeySavedNotification(null), 3000);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    interviewService.setStoredModel(model);
  };

  const applyPreset = (index: number) => {
    const preset = sampleCandidatePresets[index];
    if (preset) {
      setSelectedCandidateMode('preset');
      setSelectedPresetIndex(index);
      setCustomCandidateName(preset.name);
      setCandidateExperience(preset.experience);
      setCandidateResumeText(preset.resume);
    }
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJobId(job.id);
    setActiveTab('generator');
  };

  const getCurrentJobDetails = () => {
    if (selectedJobId === 'custom') {
      return {
        title: customJobTitle || 'Custom Job Position',
        description: customJobDescription || 'Custom job description requirements.'
      };
    }
    const found = jobs.find(j => j.id === selectedJobId) || jobs[0];
    return {
      title: found.title,
      description: found.description || `Requirements: ${found.skills.join(', ')}. Minimum ${found.requiredExperience} years of experience.`
    };
  };

  const getCurrentCandidateDetails = () => {
    if (selectedCandidateMode === 'existing') {
      const found = candidates.find(c => c.id === selectedCandidateId);
      if (found) {
        return {
          name: found.name,
          experience: found.experience,
          resume: found.summary || `${found.name}'s resume highlights expertise in ${found.skills.join(', ')}.`
        };
      }
    }
    if (selectedCandidateMode === 'preset') {
      const preset = sampleCandidatePresets[selectedPresetIndex] || sampleCandidatePresets[0];
      return {
        name: preset.name,
        experience: candidateExperience,
        resume: candidateResumeText || preset.resume
      };
    }
    return {
      name: customCandidateName || 'Candidate',
      experience: candidateExperience,
      resume: candidateResumeText || 'Candidate with practical development background.'
    };
  };

  const handleGenerateQuestions = async (overrideApiKey?: string) => {
    setIsGenerating(true);
    setGenerationStep(1);
    setGenerationError(null);

    const job = getCurrentJobDetails();
    const candidate = getCurrentCandidateDetails();

    const t1 = setTimeout(() => setGenerationStep(2), 500);
    const t2 = setTimeout(() => setGenerationStep(3), 1000);
    const t3 = setTimeout(() => setGenerationStep(4), 1400);

    try {
      const kit = await interviewService.generateInterviewKit({
        jobTitle: job.title,
        jobDescription: job.description,
        candidateName: candidate.name,
        candidateResume: candidate.resume,
        candidateExperience: candidateExperience,
        apiKey: overrideApiKey ?? (groqKey || undefined),
        model: selectedModel
      });

      setGeneratedKit(kit);
      setTimeout(() => {
        const el = document.getElementById('interview-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err?.message || 'Error occurred while generating with Groq API. Check your API key or use calibrated mode.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsGenerating(false);
    }
  };

  const handleCopyQuestion = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionId(id);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  const handleCopyAll = () => {
    if (!generatedKit) return;
    const content = `INTERVIEW QUESTIONS FOR ${generatedKit.candidateName.toUpperCase()} - ${generatedKit.jobTitle.toUpperCase()}
Engine: ${generatedKit.source === 'groq-llm' ? `Groq LLM (${generatedKit.model || 'Llama 3.3'})` : 'Calibrated Algorithmic Model'}
Experience: ${generatedKit.candidateExperience} Years
Match Score: ${generatedKit.matchedScore}%
Date: ${generatedKit.generatedAt}

${generatedKit.questions.map((q, idx) => `
Q${idx + 1} [${q.category}] (${q.difficulty})
Question: ${q.question}
Rationale: ${q.rationale}
Key Evaluation Indicators:
${q.whatToLookFor.map(item => `  - ${item}`).join('\n')}
Follow-up Probe: ${q.followUpProbe}
`).join('\n----------------------------------------\n')}
`;
    navigator.clipboard.writeText(content);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const filteredQuestions = generatedKit
    ? activeCategoryFilter === 'All'
      ? generatedKit.questions
      : generatedKit.questions.filter(q => q.category === activeCategoryFilter)
    : [];

  const getDifficultyBadge = (tier: string) => {
    if (tier.includes('Junior')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (tier.includes('Mid')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (tier.includes('Senior')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const isGroqActive = Boolean(groqKey || backendConfigured);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-dark-900 via-primary-950 to-dark-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -z-0" />
        
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold uppercase tracking-wider text-primary-300">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>AI Talent Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Question Generation
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Synthesize tailored interview questions calibrated directly against the candidate's resume, job description, and years of experience.
          </p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >

          {/* Error Alert if generation failed */}
          {generationError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 text-rose-800 text-xs shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <strong className="font-semibold block text-sm">Groq Generation Encountered an Issue</strong>
                <p>{generationError}</p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleGenerateQuestions('')}
                    className="font-bold underline hover:text-rose-900"
                  >
                    Use Algorithmic Mode Instead
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Controls & Configuration Card */}
          <div className="bg-[rgba(17,10,27,0.78)] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden text-white">
            <div className="p-6 md:p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-[#c084fc] border border-purple-500/30 flex items-center justify-center font-black text-sm">
                    AI
                  </span>
                  Interview Question Generator
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Synthesize personalized interview inquiries calibrated by matching Candidate Resume, JD, and Tenure.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-[#c084fc] text-xs font-semibold">
                <Sliders className="w-4 h-4 text-[#c084fc]" />
                <span>Calibrated by Experience</span>
              </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Job Description Setup */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <Briefcase className="w-5 h-5 text-[#c084fc]" />
                  <h3 className="font-bold text-white text-base">1. Select Target Job Description</h3>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Choose Active Position
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {jobs.map((j) => (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => setSelectedJobId(j.id)}
                        className={`p-3 text-left rounded-xl border text-xs font-medium transition-all ${
                          selectedJobId === j.id
                            ? 'bg-purple-500/20 border-[#a855f7] text-white ring-2 ring-purple-500/30 shadow-md font-bold'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <p className="font-bold truncate">{j.title}</p>
                        <p className="text-gray-400 mt-1">{j.requiredExperience}+ Yrs</p>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedJobId('custom')}
                    className={`w-full p-2.5 text-center rounded-xl border text-xs font-medium transition-all ${
                      selectedJobId === 'custom'
                        ? 'bg-purple-500/20 border-[#a855f7] text-white ring-2 ring-purple-500/30 font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    + Use Custom Job Title & Description
                  </button>
                </div>

                {selectedJobId === 'custom' ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-gray-300 mb-1 block">Custom Job Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Lead Cloud Architect"
                        value={customJobTitle}
                        onChange={(e) => setCustomJobTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[rgba(10,5,18,0.8)] border border-white/15 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#a855f7] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-300 mb-1 block">Paste Job Description</label>
                      <textarea
                        rows={4}
                        placeholder="Paste required skills, qualifications, and role responsibilities..."
                        value={customJobDescription}
                        onChange={(e) => setCustomJobDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[rgba(10,5,18,0.8)] border border-white/15 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#a855f7] focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">{getCurrentJobDetails().title}</span>
                      <span className="text-[#c084fc] font-semibold">Active Role</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed max-h-24 overflow-y-auto">
                      {getCurrentJobDetails().description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Candidate Resume & Experience */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <FileText className="w-5 h-5 text-[#c084fc]" />
                  <h3 className="font-bold text-white text-base">2. Candidate Resume & Experience</h3>
                </div>

                {/* Candidate Selection Tabs */}
                <div className="space-y-3">
                  <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl text-xs font-medium">
                    {candidates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateMode('existing')}
                        className={`flex-1 py-2 rounded-lg transition-all ${
                          selectedCandidateMode === 'existing' ? 'bg-purple-600 text-white shadow-sm font-bold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Existing Candidates ({candidates.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateMode('preset')}
                      className={`flex-1 py-2 rounded-lg transition-all ${
                        selectedCandidateMode === 'preset' ? 'bg-purple-600 text-white shadow-sm font-bold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Preset Profiles
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateMode('custom')}
                      className={`flex-1 py-2 rounded-lg transition-all ${
                        selectedCandidateMode === 'custom' ? 'bg-purple-600 text-white shadow-sm font-bold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Paste Resume
                    </button>
                  </div>

                  {/* Preset Selector */}
                  {selectedCandidateMode === 'preset' && (
                    <div className="grid grid-cols-3 gap-2">
                      {sampleCandidatePresets.map((p, idx) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => applyPreset(idx)}
                          className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                            selectedPresetIndex === idx
                              ? 'bg-purple-500/20 border-[#a855f7] text-white font-bold ring-2 ring-purple-500/30'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          <p className="truncate font-semibold">{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-normal">{p.experience} Yrs Exp</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Existing candidate dropdown */}
                  {selectedCandidateMode === 'existing' && candidates.length > 0 && (
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        setSelectedCandidateId(id);
                        const c = candidates.find(item => item.id === id);
                        if (c) {
                          setCandidateExperience(c.experience);
                          setCandidateResumeText(c.summary || `${c.name} has ${c.experience} years experience with ${c.skills.join(', ')}.`);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-[rgba(10,5,18,0.8)] border border-white/15 rounded-xl text-sm text-white focus:border-[#a855f7] focus:outline-none"
                    >
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0e071a] text-white">
                          {c.name} ({c.experience} yrs exp) - {c.status}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedCandidateMode === 'custom' && (
                    <div>
                      <label className="text-xs font-medium text-gray-300 mb-1 block">Candidate Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Jordan Miller"
                        value={customCandidateName}
                        onChange={(e) => setCustomCandidateName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[rgba(10,5,18,0.8)] border border-white/15 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#a855f7] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Experience Calibration Slider */}
                <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#c084fc]" />
                      Candidate Experience Level
                    </label>
                    <span className="px-2.5 py-1 bg-purple-600 text-white font-black text-xs rounded-lg shadow-sm">
                      {candidateExperience} {candidateExperience === 1 ? 'Year' : 'Years'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={candidateExperience}
                    onChange={(e) => setCandidateExperience(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#a855f7]"
                  />

                  <div className="flex justify-between text-[10px] font-semibold text-gray-400">
                    <span>Junior (0-2 Yrs)</span>
                    <span>Mid-Level (3-5 Yrs)</span>
                    <span>Senior (5-8 Yrs)</span>
                    <span>Lead / Arch (8+ Yrs)</span>
                  </div>
                </div>

                {/* Resume Summary Textarea */}
                <div>
                  <label className="text-xs font-medium text-gray-300 mb-1 block">Candidate Resume / Highlights</label>
                  <textarea
                    rows={3}
                    placeholder="Enter resume summary, key accomplishments, or technologies used..."
                    value={candidateResumeText}
                    onChange={(e) => setCandidateResumeText(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[rgba(10,5,18,0.8)] border border-white/15 rounded-xl text-xs text-white placeholder-gray-500 focus:border-[#a855f7] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <Sparkles className="w-4 h-4 text-[#c084fc]" />
                <span>
                  Synthesizing questions for <strong className="text-white">{candidateExperience} years experience</strong> against target JD.
                </span>
              </div>

              <Button
                onClick={() => handleGenerateQuestions()}
                disabled={isGenerating}
                className="w-full sm:w-auto px-8 py-3 font-bold text-sm gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Groq LLM Generating Questions...</span>
                  </>
                ) : isGroqActive ? (
                  <>
                    <Cpu className="w-4 h-4 text-purple-200" />
                    <span>Generate with Groq AI</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Interview Questions</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Loading Animation State */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 border border-primary-100 shadow-xl text-center max-w-xl mx-auto space-y-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
                  <Cpu className="w-8 h-8 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {isGroqActive ? 'Groq LPU Accelerating Question Synthesis' : 'Synthesizing Tailored Interview Kit'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Evaluating JD requirements against candidate's background at {candidateExperience} years experience tier.
                  </p>
                </div>

                {/* Stepper indicators */}
                <div className="space-y-3 max-w-sm mx-auto text-left text-xs">
                  <div className={`flex items-center gap-2.5 transition-colors ${generationStep >= 1 ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${generationStep >= 1 ? 'text-primary-600' : 'text-gray-300'}`} />
                    <span>Extracting technical requirements from Job Description</span>
                  </div>
                  <div className={`flex items-center gap-2.5 transition-colors ${generationStep >= 2 ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${generationStep >= 2 ? 'text-primary-600' : 'text-gray-300'}`} />
                    <span>Parsing candidate resume & past project claims</span>
                  </div>
                  <div className={`flex items-center gap-2.5 transition-colors ${generationStep >= 3 ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${generationStep >= 3 ? 'text-primary-600' : 'text-gray-300'}`} />
                    <span>Calibrating difficulty for {candidateExperience} yrs tenure</span>
                  </div>
                  <div className={`flex items-center gap-2.5 transition-colors ${generationStep >= 4 ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${generationStep >= 4 ? 'text-primary-600' : 'text-gray-300'}`} />
                    <span>Generating evaluation criteria & follow-up probes</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GENERATED INTERVIEW KIT RESULTS */}
          {generatedKit && !isGenerating && (
            <motion.div
              id="interview-results-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Results Top Overview */}
              <div className="bg-[rgba(17,10,27,0.78)] backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-purple-500/20 text-[#c084fc] border border-purple-500/30 text-xs font-bold rounded-lg">
                      {generatedKit.jobTitle}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold rounded-lg">
                      Candidate: {generatedKit.candidateName}
                    </span>
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold rounded-lg">
                      {generatedKit.candidateExperience} Yrs Experience
                    </span>
                    {generatedKit.source === 'groq-llm' ? (
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-purple-200" />
                        <span>Groq AI ({generatedKit.model?.split('-').slice(0, 3).join(' ') || 'Llama 3.3'})</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold rounded-lg flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-gray-400" />
                        <span>Calibrated Algorithmic Mode</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-extrabold text-white">
                    Generated Interview Assessment Kit
                  </h2>
                  <p className="text-xs text-gray-400 max-w-2xl">
                    {generatedKit.summary}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCopyAll}
                    className="gap-2 text-xs font-semibold"
                  >
                    {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedAll ? 'Copied Kit!' : 'Copy Entire Kit'}
                  </Button>
                  <Button
                    onClick={() => handleGenerateQuestions()}
                    className="gap-2 text-xs font-semibold bg-gradient-to-r from-[#9333ea] to-[#c084fc] text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {['All', 'JD Technical', 'Resume Deep-Dive', 'Experience & Architecture', 'Behavioral & Leadership'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeCategoryFilter === cat
                        ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                        : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredQuestions.map((q, index) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[rgba(17,10,27,0.78)] backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl hover:border-purple-500/40 transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6 md:p-8 space-y-4">
                      {/* Card Header badges */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 text-[#c084fc] text-xs font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-purple-200">
                            {q.category}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getDifficultyBadge(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopyQuestion(q.id, q.question)}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                        >
                          {copiedQuestionId === q.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Main Question Text */}
                      <p className="text-lg font-bold text-white leading-snug">
                        "{q.question}"
                      </p>

                      {/* Context Rationale */}
                      <div className="text-xs text-gray-300 flex items-start gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                        <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span><strong className="text-white">Context & Rationale:</strong> {q.rationale}</span>
                      </div>

                      {/* Evaluation Criteria */}
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          What to look for in candidate's response
                        </p>
                        <ul className="space-y-1.5 pl-5 list-disc text-xs text-gray-300">
                          {q.whatToLookFor.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Follow-up Probe */}
                      <div className="mt-4 pt-4 border-t border-purple-500/20 bg-purple-500/10 -mx-6 -mb-6 md:-mx-8 md:-mb-8 p-4 md:px-8 flex items-start gap-2.5 text-xs text-purple-200">
                        <HelpCircle className="w-4 h-4 text-[#c084fc] flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-white">Follow-up Probe:</strong> {q.followUpProbe}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
    </div>
  );
}
