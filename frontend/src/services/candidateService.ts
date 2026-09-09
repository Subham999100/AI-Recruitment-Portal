import { api, delay } from './api';
import { mockCandidates } from './mockData';
import { Candidate, MatchResult } from '../types';

export const candidateService = {
  getCandidates: async (): Promise<{ data: Candidate[] }> => {
    // return api.get('/candidates');
    await delay(300);
    return { data: [...mockCandidates] };
  },

  addCandidate: async (candidate: Candidate): Promise<{ data: Candidate }> => {
    await delay(200);
    const { addMockCandidate } = await import('./mockData');
    addMockCandidate(candidate);
    return { data: candidate };
  },

  getCandidateById: async (id: number): Promise<{ data: Candidate }> => {
    // return api.get(`/candidates/${id}`);
    await delay(500);
    const candidate = mockCandidates.find(c => c.id === id);
    if (!candidate) throw new Error('Candidate not found');
    return { data: candidate };
  },

  updateCandidateStatus: async (id: number, status: string): Promise<{ data: Candidate }> => {
    // return api.patch(`/candidates/${id}/status`, { status });
    await delay(500);
    const candidate = mockCandidates.find(c => c.id === id);
    if (!candidate) throw new Error('Candidate not found');
    return { data: { ...candidate, status: status as any } };
  },

  getCandidateMatch: async (id: number): Promise<{ data: MatchResult }> => {
    // return api.get(`/candidates/${id}/match`);
    await delay(800);
    const candidate = mockCandidates.find(c => c.id === id);
    if (!candidate) throw new Error('Candidate not found');
    
    // Generate mock match data based on the candidate
    return {
      data: {
        overallScore: candidate.matchScore,
        skillMatch: Math.min(100, candidate.matchScore + 3),
        experienceMatch: Math.min(100, candidate.matchScore - 2),
        qualificationMatch: Math.min(100, candidate.matchScore + 5),
        matchedSkills: candidate.skills.slice(0, Math.max(1, candidate.skills.length - 1)),
        missingSkills: ['Kubernetes', 'GraphQL'] // Mock missing skills
      }
    };
  }
};
