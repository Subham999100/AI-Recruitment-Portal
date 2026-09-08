export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  qualification: string;
  experience: number; // in years
  skills: string[];
  status: 'New' | 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Selected' | 'Rejected';
  matchScore: number;
  dateAdded: string;
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
  department: string;
  location: string;
  type: string;
  requiredExperience: number;
  skills: string[];
  candidateCount: number;
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
  experienceMatch: number;
  qualificationMatch: number;
  matchedSkills: string[];
  missingSkills: string[];
}
