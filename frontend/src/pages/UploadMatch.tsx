import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle, ArrowRight, Sparkles, X, FileBadge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { candidateService } from '../services/candidateService';
import { Candidate } from '../types';

export default function UploadMatch() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Resume, 2: JD, 3: Processing
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'jd') => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === 'resume') {
        setResumeFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      } else {
        setJdFile(e.target.files[0]);
      }
    }
  };

  const removeResume = (index: number) => {
    setResumeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeJd = () => {
    setJdFile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'resume' | 'jd') => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (type === 'resume') {
        setResumeFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
      } else {
        setJdFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };

  const handleNextStep = () => {
    if (step === 1 && resumeFiles.length > 0) setStep(2);
    else if (step === 2 && jdFile) {
      setStep(3);
      simulateProcessing();
    }
  };

  const simulateProcessing = async () => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 8 + 2;
      if (current >= 100) current = 100;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
      }
    }, 200);

    // Mock delay for UI to show 100% processing for a moment
    setTimeout(async () => {
      const newCandidates: Candidate[] = resumeFiles.map((file, i) => ({
        id: Math.floor(Math.random() * 10000),
        name: file.name.split('.')[0].replace(/[-_]/g, ' '),
        email: `${file.name.split('.')[0].toLowerCase()}@example.com`,
        phone: '+1 (555) 000-0000',
        location: 'Remote',
        qualification: 'Bachelors Degree',
        experience: Math.floor(Math.random() * 5) + 2,
        skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Python', 'Machine Learning'].sort(() => 0.5 - Math.random()).slice(0, 4),
        status: 'New',
        matchScore: Math.floor(Math.random() * 20) + 75,
        dateAdded: new Date().toISOString().split('T')[0],
        summary: 'Auto-extracted candidate profile based on uploaded resume matched against the JD.',
        resumeFile: file.name
      }));

      for (const candidate of newCandidates) {
        await candidateService.addCandidate(candidate);
      }

      navigate('/candidates');
    }, 4000);
  };

  // --- Animation Variants ---
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  const cardVariants = {
    initial: { scale: 0.98, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.4, delay: 0.1, ease: 'easeOut' as const } }
  };

  const stepVariants = {
    inactive: { backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#64748b', scale: 1, border: '1px solid rgba(255, 255, 255, 0.1)' },
    active: { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', scale: 1.1, border: '2px solid #a855f7', boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' },
    completed: { backgroundColor: '#9333ea', color: '#ffffff', scale: 1, border: '2px solid #a855f7', boxShadow: '0 0 12px rgba(168, 85, 247, 0.3)' }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-10 py-4 px-4 sm:px-0"
    >
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 0.2 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-[#c084fc] text-xs font-semibold uppercase tracking-wider mb-2 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Powered</span>
        </motion.div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Candidate Match Intelligence</h1>
        <p className="text-gray-400 max-w-lg mx-auto text-sm">Upload resumes and let our AI engine instantly extract skills, evaluate experience, and score against your job description.</p>
      </div>

      {/* Animated Stepper */}
      <div className="flex items-center justify-center max-w-2xl mx-auto relative z-10">
        {[1, 2, 3].map((s, index) => {
          const isCompleted = step > s;
          const isActive = step === s;
          
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center relative group">
                <motion.div
                  variants={stepVariants}
                  initial="inactive"
                  animate={isCompleted ? 'completed' : isActive ? 'active' : 'inactive'}
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold relative z-10 transition-colors duration-300"
                >
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : s}
                </motion.div>
                <div className={`absolute top-14 whitespace-nowrap text-xs font-semibold tracking-wider uppercase transition-colors duration-300 ${isActive ? 'text-[#c084fc]' : isCompleted ? 'text-white' : 'text-gray-500'}`}>
                  {s === 1 ? 'Upload Resumes' : s === 2 ? 'Upload JD' : 'AI Analysis'}
                </div>
              </div>
              
              {index < 2 && (
                <div className="flex-1 h-1 mx-4 relative bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#9333ea] to-[#c084fc]"
                    initial={{ width: '0%' }}
                    animate={{ width: step > s ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Upload Card */}
      <motion.div variants={cardVariants} className="mt-16">
        <div className="bg-[rgba(17,10,27,0.78)] backdrop-blur-2xl rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl">
          
          {/* Subtle background glow */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fuchsia-500/20 rounded-full filter blur-3xl pointer-events-none" />

          <div className="p-10 sm:p-14 relative z-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Add Candidate Resumes</h2>
                    <p className="text-gray-400 text-sm">PDF, DOC, or DOCX formats supported up to 10MB each.</p>
                  </div>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'resume')}
                    onMouseMove={handleMouseMove}
                    className="perspective-1000"
                  >
                    <motion.div 
                      animate={{ 
                        scale: isDragging ? 1.02 : 1,
                        borderColor: isDragging ? '#a855f7' : 'rgba(255, 255, 255, 0.15)',
                        backgroundColor: isDragging ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)'
                      }}
                      className="border-2 border-dashed rounded-2xl p-12 transition-colors duration-300 relative overflow-hidden group cursor-pointer shadow-sm hover:border-purple-500/40"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        multiple
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'resume')}
                      />
                      
                      {/* 3D Illustration */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                        <motion.div 
                          className="transform-3d w-48 h-64 bg-[#130924] rounded-xl shadow-2xl border border-purple-500/30 relative"
                          animate={{ 
                            rotateX: mousePos.y * 20, 
                            rotateY: mousePos.x * -20,
                            z: 50
                          }}
                          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        >
                           <div className="absolute top-8 left-8 right-8 h-4 bg-purple-500/30 rounded animate-pulse" />
                           <div className="absolute top-16 left-8 w-1/2 h-3 bg-purple-500/20 rounded" />
                           <div className="absolute top-24 left-8 right-8 h-2 bg-purple-500/20 rounded" />
                           <div className="absolute top-28 left-8 right-12 h-2 bg-purple-500/20 rounded" />
                        </motion.div>
                      </div>

                      <div className="flex flex-col items-center justify-center relative z-10">
                        <motion.div 
                          whileHover={{ y: -5 }}
                          className="w-20 h-20 bg-purple-500/10 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.25)] flex items-center justify-center mb-6 border border-purple-500/40"
                        >
                          <UploadCloud className="w-10 h-10 text-[#c084fc]" />
                        </motion.div>
                        <span className="text-lg text-white font-semibold mb-2">
                          {isDragging ? 'Drop files here' : 'Click or drag resumes here'}
                        </span>
                        <span className="text-sm text-gray-400">Upload multiple files at once to bulk analyze.</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Uploaded Files List */}
                  {resumeFiles.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3"
                    >
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ready for Analysis ({resumeFiles.length})</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence>
                          {resumeFiles.map((f, i) => (
                            <motion.div 
                              key={`${f.name}-${i}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex items-center justify-between bg-white/5 border border-white/10 p-3.5 rounded-xl shadow-sm hover:border-purple-500/40 transition-colors group"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-[#c084fc]" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm font-medium text-white truncate">{f.name}</span>
                                  <span className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeResume(i); }}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={resumeFiles.length === 0}
                      onClick={handleNextStep}
                      className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#9333ea] via-[#a855f7] to-[#c084fc] shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] border border-purple-400/30 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      Continue to Job Description <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Target Job Description</h2>
                    <p className="text-gray-400 text-sm">Upload the JD to accurately score and match the candidates.</p>
                  </div>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'jd')}
                    onMouseMove={handleMouseMove}
                    className="perspective-1000"
                  >
                    <motion.div 
                      animate={{ 
                        scale: isDragging ? 1.02 : 1,
                        borderColor: isDragging ? '#a855f7' : 'rgba(255, 255, 255, 0.15)',
                        backgroundColor: isDragging ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)'
                      }}
                      className="border-2 border-dashed rounded-2xl p-12 transition-colors duration-300 relative overflow-hidden group cursor-pointer shadow-sm hover:border-purple-500/40"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => handleFileChange(e, 'jd')}
                      />
                      
                      <div className="flex flex-col items-center justify-center relative z-10">
                        <motion.div 
                          whileHover={{ y: -5 }}
                          className="w-20 h-20 bg-purple-500/10 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.25)] flex items-center justify-center mb-6 border border-purple-500/40"
                        >
                          <FileBadge className="w-10 h-10 text-[#c084fc]" />
                        </motion.div>
                        <span className="text-lg text-white font-semibold mb-2">
                          {isDragging ? 'Drop JD here' : 'Click or drag JD here'}
                        </span>
                        <span className="text-sm text-gray-400">PDF, DOC, TXT supported.</span>
                      </div>
                    </motion.div>
                  </div>

                  {jdFile && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between bg-white/5 border border-purple-500/30 p-4 rounded-xl shadow-lg group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-[#c084fc]" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white block">{jdFile.name}</span>
                          <span className="text-xs text-gray-400">{(jdFile.size / 1024 / 1024).toFixed(2)} MB • Ready for matching</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeJd(); }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}

                  <div className="pt-4 flex justify-between items-center">
                    <button 
                      onClick={() => setStep(1)}
                      className="text-gray-400 hover:text-white font-medium px-4 py-2 transition-colors"
                    >
                      Back
                    </button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!jdFile}
                      onClick={handleNextStep}
                      className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#9333ea] via-[#a855f7] to-[#c084fc] shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] border border-purple-400/30 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Sparkles className="w-5 h-5" /> Start AI Analysis
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 flex flex-col items-center justify-center text-center space-y-10"
                >
                  <div className="relative w-32 h-32">
                    {/* Glowing AI rings */}
                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full animate-[spin_4s_linear_infinite]" />
                    <div className="absolute inset-2 border-4 border-t-[#c084fc] border-r-transparent border-b-[#9333ea] border-l-transparent rounded-full animate-[spin_2s_linear_infinite]" />
                    <div className="absolute inset-4 border-4 border-purple-500/10 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-[#c084fc] animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-4 max-w-sm w-full">
                    <h2 className="text-2xl font-bold text-white">Analyzing {resumeFiles.length} Profile{resumeFiles.length > 1 ? 's' : ''}...</h2>
                    <p className="text-sm text-gray-400 h-6">
                      {progress < 30 ? 'Extracting skills and experience...' : 
                       progress < 70 ? 'Cross-referencing with Job Description...' : 
                       'Calculating AI match scores...'}
                    </p>
                    
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden relative border border-white/10">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#9333ea] to-[#c084fc] rounded-full shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                        style={{ width: `${progress}%` }}
                        layout
                      />
                      {/* Scanning line effect */}
                      <motion.div 
                        animate={{ x: ['-100%', '300%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg]"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-[#c084fc]">
                      <span>Processing</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
