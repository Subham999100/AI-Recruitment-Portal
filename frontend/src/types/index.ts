export interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  avatar?: string;
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  qualification?: string;
  experience: number; // in years
  skills: string[];
  status: 'New' | 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Rejected';
  matchScore: number | null;
  dateAdded?: string | null;
  summary?: string;
  education?: {
    degree: string;
    university: string;
    passingYear: number;
  }[];
  experienceDetails?: {
    company: string;
    jobTitle: string;
    duration: string;
    responsibilities: string[];
  }[];
  resumeFile?: string;
}

export interface Job {
  id: number;
  title: string;
  department?: string;
  location?: string;
  type?: string;
  requiredExperience?: number;
  skills: string[];
  candidateCount: number;
  description?: string;
}

export interface DashboardStats {
  totalCandidates: number;
  totalJobs: number;
  shortlistedCandidates: number;
  interviewsScheduled: number;
}

export interface MatchResult {
  overallScore: number;
  skillMatch: number;
  semanticMatch: number;
  keywordMatch: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface InterviewQuestion {
  id: string;
  category: 'JD Technical' | 'Resume Deep-Dive' | 'Experience & Architecture' | 'Behavioral & Leadership';
  difficulty: 'Junior (0-2 Yrs)' | 'Mid-Level (3-5 Yrs)' | 'Senior (5-8 Yrs)' | 'Lead / Architect (8+ Yrs)';
  question: string;
  answer: string;
  rationale: string;
  whatToLookFor: string[];
  followUpProbe: string;
}

export interface InterviewKit {
  jobTitle: string;
  candidateName: string;
  candidateExperience: number;
  matchedScore: number;
  summary: string;
  generatedAt: string;
  questions: InterviewQuestion[];
  source?: 'groq-llm' | 'algorithmic';
  model?: string;
}

