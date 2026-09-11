import { api } from './api';
import { Candidate, Job, MatchResult } from '../types';

type ApiCandidate = {
  id: number;
  name: string;
  email: string;
  skills: string[];
  experience: number;
  status: Candidate['status'];
  summary: string;
  resume_file: string;
  date_added: string | null;
  match_score: number | null;
};

const toCandidate = (candidate: ApiCandidate): Candidate => ({
  id: candidate.id,
  name: candidate.name,
  email: candidate.email,
  experience: candidate.experience,
  skills: candidate.skills,
  status: candidate.status,
  matchScore: candidate.match_score,
  dateAdded: candidate.date_added,
  summary: candidate.summary,
  resumeFile: candidate.resume_file,
});

const toJob = (job: any): Job => ({
  id: job.id,
  title: job.title,
  description: job.description,
  skills: job.skills || [],
  candidateCount: job.candidate_count || 0,
});

export const candidateService = {
  getCandidates: async (): Promise<{ data: Candidate[] }> => {
    const response = await api.get<{ data: ApiCandidate[] }>('/candidates');
    return { data: response.data.data.map(toCandidate) };
  },

  uploadResumes: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getCandidateById: async (id: number): Promise<{ data: Candidate }> => {
    const response = await api.get<{ data: ApiCandidate }>(`/candidates/${id}`);
    return { data: toCandidate(response.data.data) };
  },

  deleteCandidate: async (id: number): Promise<void> => {
    await api.delete(`/candidates/${id}`);
  },

  updateCandidateStatus: async (id: number, status: string): Promise<{ data: Candidate }> => {
    const response = await api.patch<{ data: ApiCandidate }>(`/candidates/${id}/status`, { status });
    return { data: toCandidate(response.data.data) };
  },

  getCandidateMatch: async (id: number): Promise<{ data: MatchResult }> => {
    const response = await api.get<{ data: any }>(`/candidates/${id}/match`);
    const match = response.data.data;
    return {
      data: {
        overallScore: match.overall_score,
        skillMatch: match.skill_match,
        semanticMatch: match.semantic_match,
        keywordMatch: match.keyword_match,
        matchedSkills: match.matched_skills || [],
        missingSkills: match.missing_skills || [],
      },
    };
  },

  getJobs: async (): Promise<{ data: Job[] }> => {
    const response = await api.get<{ data: any[] }>('/jobs');
    return { data: response.data.data.map(toJob) };
  },

  deleteJob: async (id: number): Promise<void> => {
    await api.delete(`/jobs/${id}`);
  },

  createJob: async (title: string, description: string): Promise<{ id: number }> => {
    const response = await api.post<{ data: { job_id: number } }>('/jobs', { title, description });
    return { id: response.data.data.job_id };
  },

  createJobFromFile: async (file: File, title: string): Promise<{ id: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    const response = await api.post<{ data: { job_id: number } }>('/jobs/from-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { id: response.data.data.job_id };
  },

  getMatches: async (jobId: number) => {
    const response = await api.get<{ job_id: number; matches: unknown[] }>(`/matching/${jobId}`);
    return response.data;
  },
};
