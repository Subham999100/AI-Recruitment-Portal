import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { candidateService } from '../services/candidateService';
import { interviewService, DEFAULT_GROQ_MODEL } from '../services/interviewService';
import { Job, Candidate, InterviewKit, InterviewQuestion } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

export default function Jobs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'jobs' | 'generator'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  // Grok API Settings State
  const [grokKey, setGrokKey] = useState<string>('');
  const [inputGrokKey, setInputGrokKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_GROQ_MODEL);
  const [availableModels, setAvailableModels] = useState<string[]>([DEFAULT_GROQ_MODEL]);
  const [showKeyDrawer, setShowKeyDrawer] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [keySavedNotification, setKeySavedNotification] = useState<string | null>(null);
  const [backendConfigured, setBackendConfigured] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Generator form state
  const [selectedJobId, setSelectedJobId] = useState<number | 'custom'>(1);
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customJobDescription, setCustomJobDescription] = useState('');

  const [selectedCandidateMode, setSelectedCandidateMode] = useState<'existing' | 'custom'>('custom');
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | ''>('');
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
    Promise.all([
      candidateService.getJobs(),
      candidateService.getCandidates(),
      interviewService.checkBackendGroqStatus(),
    ]).then(([jobResponse, candidateResponse, status]) => {
      setJobs(jobResponse.data);
      setCandidates(candidateResponse.data);
      setBackendConfigured(status.configured);
      if (status.default_model) setSelectedModel(status.default_model);
      if (status.supported_models?.length) setAvailableModels(status.supported_models);
      if (jobResponse.data.length > 0) setSelectedJobId(jobResponse.data[0].id);
      if (candidateResponse.data.length > 0) {
        const candidate = candidateResponse.data[0];
        setSelectedCandidateMode('existing');
        setSelectedCandidateId(candidate.id);
        setCandidateExperience(candidate.experience);
        setCandidateResumeText(candidate.summary || '');
      }
    }).catch(() => setGenerationError('Unable to load jobs, candidates, or AI service status. Start the FastAPI backend and retry.'));
  }, []);

  const handleSaveGrokKey = () => {
    const trimmed = inputGrokKey.trim();
    if (trimmed) {
      setGrokKey(trimmed);
      setKeySavedNotification('Browser-managed API keys are disabled. Configure GROQ_API_KEY on the backend instead.');
      setTimeout(() => setKeySavedNotification(null), 3000);
      setShowKeyDrawer(false);
      setGenerationError(null);
    }
  };

  const handleClearGrokKey = () => {
    setGrokKey('');
    setInputGrokKey('');
    setKeySavedNotification('Grok API key removed.');
    setTimeout(() => setKeySavedNotification(null), 3000);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJobId(job.id);
    navigate('/candidates');
  };

  const handleDeleteJob = async (job: Job) => {
    const confirmed = window.confirm(
      `Delete "${job.title}"? This will also remove its stored candidate matches.`
    );
    if (!confirmed) return;

    setDeletingJobId(job.id);
    try {
      await candidateService.deleteJob(job.id);
      setJobs((currentJobs) => currentJobs.filter((currentJob) => currentJob.id !== job.id));
      if (expandedJobId === job.id) setExpandedJobId(null);
    } catch (error) {
      setGenerationError('Unable to delete this job description. Please try again.');
    } finally {
      setDeletingJobId(null);
    }
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
      title: found?.title || 'Select a job',
      description: found?.description || ''
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
    return {
      name: customCandidateName || 'Candidate',
      experience: candidateExperience,
      resume: candidateResumeText || 'Candidate with practical development background.'
    };
  };

  const handleGenerateQuestions = async () => {
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
        model: selectedModel
      });

      setGeneratedKit(kit);
      setTimeout(() => {
        const el = document.getElementById('interview-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err?.message || 'Error occurred while generating with Grok API. Check your API key or use calibrated mode.');
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
  Engine: ${generatedKit.source === 'groq-llm' ? `Groq (${generatedKit.model || 'Llama 3.3'})` : 'Calibrated Algorithmic Model'}
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

  const isGrokActive = backendConfigured;

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
            Jobs & AI Interview Kits
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Manage open positions and review candidates matched to each job. Generate interview questions from the candidate details page.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="relative z-10 flex p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 self-start md:self-center">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'jobs' 
                ? 'bg-white/20 text-white shadow-lg border border-purple-400/40' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Active Openings
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE JOBS */}
      {activeTab === 'jobs' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Current Job Openings</h2>
              <p className="text-sm text-gray-400">Select a position to review its matched candidates</p>
            </div>
            <Button onClick={() => navigate('/candidates')} className="gap-2">
              <Users className="w-4 h-4" />
              Review Candidates
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-[rgba(17,10,27,0.75)] backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl hover:border-purple-500/40 hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)] transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 text-[#c084fc] rounded-lg">
                        {job.candidateCount} matched candidate{job.candidateCount === 1 ? '' : 's'}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2 group-hover:text-[#c084fc] transition-colors">
                        {job.title}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className={`text-xs text-gray-300 leading-relaxed ${expandedJobId === job.id ? '' : 'line-clamp-3'}`}>
                      {job.description}
                    </p>
                    {job.description && job.description.length > 180 && (
                      <button
                        type="button"
                        onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                        className="text-xs font-semibold text-[#c084fc] hover:text-white"
                      >
                        {expandedJobId === job.id ? 'Less' : 'More'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-purple-500/10 text-purple-200 text-xs rounded-md border border-purple-500/20 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-white">{job.candidateCount}</span> candidates
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      title="Delete job description"
                      aria-label={`Delete ${job.title}`}
                      onClick={() => handleDeleteJob(job)}
                      isLoading={deletingJobId === job.id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectJob(job)}
                      className="group-hover:border-purple-500 group-hover:text-purple-200 transition-all gap-1.5"
                    >
                      <span>Review Candidates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB 2: AI QUESTION GENERATOR SECTION */}
      {activeTab === 'generator' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* GROK API CONFIGURATION BAR */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">Grok Inference Engine</h3>
                      {isGrokActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected ({selectedModel.split('-').slice(0, 3).join(' ')})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                        <Key className="w-3 h-3" />
                        Backend Key Not Configured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mt-1 max-w-xl">
                    Fast question synthesis powered by Grok. Tailors technical, project, and leadership inquiries using candidate resume + JD + experience.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  disabled
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2 text-xs font-semibold backdrop-blur-sm"
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Configure backend .env</span>
                </Button>
              </div>
            </div>

            {/* Notification alert */}
            {keySavedNotification && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{keySavedNotification}</span>
              </motion.div>
            )}

            {/* Expandable Configuration Drawer */}
            <AnimatePresence>
              {false && showKeyDrawer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-white/10 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* API Key Input */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-gray-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-indigo-400" />
                          Groq API Key (gsk_...)
                        </span>
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline"
                        >
                          Get Groq Key
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          value={inputGrokKey}
                          onChange={(e) => setInputGrokKey(e.target.value)}
                          className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 pr-24"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 text-xs flex items-center gap-1"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Keys are saved securely in your browser's local storage and used directly for inference.
                      </p>
                    </div>

                    {/* Model Picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        Inference Model
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                      >
                        {availableModels.map((model) => (
                          <option key={model} value={model} className="bg-dark-900 text-white">
                            {model}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-400">
                        Grok powers real-time question generation.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/10 gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Ready for live generation on candidate profiles</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {grokKey && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleClearGrokKey}
                          className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear Key</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleSaveGrokKey}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Settings</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Alert if generation failed */}
          {generationError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 text-rose-800 text-xs shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <strong className="font-semibold block text-sm">Grok Generation Encountered an Issue</strong>
                                <strong className="font-semibold block text-sm">Grok Generation Encountered an Issue</strong>
                <p>{generationError}</p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="font-bold underline hover:text-rose-900"
                  >
                    Retry after configuring the backend
                  </button>
                  <span>•</span>
                  <button
                    onClick={handleGenerateQuestions}
                    className="font-bold underline hover:text-rose-900"
                  >
                    Retry generation
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
                      onClick={() => setSelectedCandidateMode('custom')}
                      className={`flex-1 py-2 rounded-lg transition-all ${
                        selectedCandidateMode === 'custom' ? 'bg-purple-600 text-white shadow-sm font-bold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Paste Resume
                    </button>
                  </div>

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
                    <span>Grok Generating Questions...</span>
                  </>
                ) : isGrokActive ? (
                  <>
                    <Cpu className="w-4 h-4 text-purple-200" />
                    <span>Generate with Grok AI</span>
                                      <span>Generate with Grok AI</span>
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
                    {isGrokActive ? 'Grok Accelerating Question Synthesis' : 'Synthesizing Tailored Interview Kit'}
                                      {isGrokActive ? 'Grok Accelerating Question Synthesis' : 'Synthesizing Tailored Interview Kit'}
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
                        <span>Grok AI ({generatedKit.model?.split('-').slice(0, 3).join(' ') || 'Grok 3 Mini'})</span>
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
      )}
    </div>
  );
}
