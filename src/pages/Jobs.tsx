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
  CheckCircle2
} from 'lucide-react';
import { mockJobs, sampleCandidatePresets } from '../services/mockData';
import { candidateService } from '../services/candidateService';
import { interviewService } from '../services/interviewService';
import { Job, Candidate, InterviewKit, InterviewQuestion } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

export default function Jobs() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'generator'>('jobs');
  const [jobs] = useState<Job[]>(mockJobs);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

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
    // Load existing candidates if any
    candidateService.getCandidates().then(res => {
      setCandidates(res.data);
      if (res.data.length > 0) {
        setSelectedCandidateMode('existing');
        setSelectedCandidateId(res.data[0].id);
        setCandidateExperience(res.data[0].experience);
        setCandidateResumeText(res.data[0].summary || `${res.data[0].name} has ${res.data[0].experience} years of experience in ${res.data[0].skills.join(', ')}.`);
      } else {
        // Use preset
        applyPreset(0);
      }
    }).catch(() => {
      applyPreset(0);
    });
  }, []);

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

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    setGenerationStep(1);

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
        candidateExperience: candidateExperience
      });

      setGeneratedKit(kit);
    } catch (err) {
      console.error(err);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsGenerating(false);
      // Auto-scroll to results
      setTimeout(() => {
        const el = document.getElementById('interview-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
            Manage open positions and generate tailored interview questions calibrated directly against the candidate's resume, job description, and years of experience.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="relative z-10 flex p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 self-start md:self-center">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'jobs' 
                ? 'bg-white text-dark-900 shadow-lg' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Active Openings
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === 'generator' 
                ? 'bg-gradient-premium text-white shadow-glow' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-primary-200" />
            AI Question Generator
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
              <h2 className="text-xl font-bold text-gray-900">Current Job Openings</h2>
              <p className="text-sm text-gray-500">Select any position to generate candidate-specific interview kits</p>
            </div>
            <Button onClick={() => setActiveTab('generator')} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Interview Kit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg">
                        {job.department}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-2 group-hover:text-primary-600 transition-colors">
                        {job.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-y-2 text-xs text-gray-500 gap-x-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {job.type}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {job.requiredExperience}+ Yrs Exp
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-700">{job.candidateCount}</span> candidates
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSelectJob(job)}
                    className="group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all gap-1.5"
                  >
                    <span>Generate Questions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
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
          className="space-y-10"
        >
          {/* Controls & Configuration Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-sm">
                    AI
                  </span>
                  Interview Question Generator
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Synthesize personalized interview inquiries calibrated by matching Candidate Resume, JD, and Tenure.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold">
                <Sliders className="w-4 h-4 text-primary-600" />
                <span>Calibrated by Experience</span>
              </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Job Description Setup */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                  <h3 className="font-bold text-gray-900 text-base">1. Select Target Job Description</h3>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
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
                            ? 'bg-primary-50 border-primary-500 text-primary-900 ring-2 ring-primary-500/20 shadow-sm'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
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
                        ? 'bg-primary-50 border-primary-500 text-primary-900 ring-2 ring-primary-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    + Use Custom Job Title & Description
                  </button>
                </div>

                {selectedJobId === 'custom' ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Custom Job Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Lead Cloud Architect"
                        value={customJobTitle}
                        onChange={(e) => setCustomJobTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Paste Job Description</label>
                      <textarea
                        rows={4}
                        placeholder="Paste required skills, qualifications, and role responsibilities..."
                        value={customJobDescription}
                        onChange={(e) => setCustomJobDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800">{getCurrentJobDetails().title}</span>
                      <span className="text-primary-600 font-semibold">Active Role</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed max-h-24 overflow-y-auto">
                      {getCurrentJobDetails().description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Candidate Resume & Experience */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900 text-base">2. Candidate Resume & Experience</h3>
                </div>

                {/* Candidate Selection Tabs */}
                <div className="space-y-3">
                  <div className="flex p-1 bg-gray-100 rounded-xl text-xs font-medium">
                    {candidates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCandidateMode('existing')}
                        className={`flex-1 py-2 rounded-lg transition-all ${
                          selectedCandidateMode === 'existing' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-500'
                        }`}
                      >
                        Existing Candidates ({candidates.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateMode('preset')}
                      className={`flex-1 py-2 rounded-lg transition-all ${
                        selectedCandidateMode === 'preset' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-500'
                      }`}
                    >
                      Preset Profiles
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateMode('custom')}
                      className={`flex-1 py-2 rounded-lg transition-all ${
                        selectedCandidateMode === 'custom' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-500'
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
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <p className="truncate">{p.name}</p>
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
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.experience} yrs exp) - {c.status}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedCandidateMode === 'custom' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Candidate Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Jordan Miller"
                        value={customCandidateName}
                        onChange={(e) => setCustomCandidateName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Experience Calibration Slider */}
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      Candidate Experience Level
                    </label>
                    <span className="px-2.5 py-1 bg-indigo-600 text-white font-black text-xs rounded-lg shadow-sm">
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
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />

                  <div className="flex justify-between text-[10px] font-semibold text-gray-500">
                    <span>Junior (0-2 Yrs)</span>
                    <span>Mid-Level (3-5 Yrs)</span>
                    <span>Senior (5-8 Yrs)</span>
                    <span>Lead / Arch (8+ Yrs)</span>
                  </div>
                </div>

                {/* Resume Summary Textarea */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Candidate Resume / Highlights</label>
                  <textarea
                    rows={3}
                    placeholder="Enter resume summary, key accomplishments, or technologies used..."
                    value={candidateResumeText}
                    onChange={(e) => setCandidateResumeText(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-primary-50/30 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span>Calibrates depth for <strong>{candidateExperience} years experience</strong> against target JD.</span>
              </div>

              <Button
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-premium shadow-glow hover:shadow-lg font-bold text-sm gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Calibrating...</span>
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-premium mx-auto flex items-center justify-center shadow-glow animate-pulse">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Synthesizing Tailored Interview Kit</h3>
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
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-lg">
                      {generatedKit.jobTitle}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
                      Candidate: {generatedKit.candidateName}
                    </span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg">
                      {generatedKit.candidateExperience} Yrs Experience
                    </span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-gray-900">
                    Generated Interview Assessment Kit
                  </h2>
                  <p className="text-xs text-gray-500 max-w-2xl">
                    {generatedKit.summary}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCopyAll}
                    className="gap-2 text-xs font-semibold"
                  >
                    {copiedAll ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copiedAll ? 'Copied Kit!' : 'Copy Entire Kit'}
                  </Button>
                  <Button
                    onClick={handleGenerateQuestions}
                    className="gap-2 text-xs font-semibold bg-dark-900 hover:bg-black text-white"
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
                        ? 'bg-dark-900 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
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
                    className="bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-6 md:p-8 space-y-4">
                      {/* Card Header badges */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-dark-900 text-white text-xs font-black flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-800">
                            {q.category}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getDifficultyBadge(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCopyQuestion(q.id, q.question)}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-dark-900 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          {copiedQuestionId === q.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-green-600 font-semibold">Copied</span>
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
                      <p className="text-lg font-bold text-gray-900 leading-snug">
                        "{q.question}"
                      </p>

                      {/* Context Rationale */}
                      <div className="text-xs text-gray-500 flex items-start gap-2 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                        <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Context & Rationale:</strong> {q.rationale}</span>
                      </div>

                      {/* Evaluation Criteria */}
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          What to look for in candidate's response
                        </p>
                        <ul className="space-y-1.5 pl-5 list-disc text-xs text-gray-600">
                          {q.whatToLookFor.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Follow-up Probe */}
                      <div className="mt-4 pt-4 border-t border-gray-100 bg-primary-50/40 -mx-6 -mb-6 md:-mx-8 md:-mb-8 p-4 md:px-8 flex items-start gap-2.5 text-xs text-primary-900">
                        <HelpCircle className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-primary-950">Follow-up Probe:</strong> {q.followUpProbe}
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
