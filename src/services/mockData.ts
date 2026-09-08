import { Candidate, DashboardStats, Job } from '../types';

export let mockCandidates: Candidate[] = [];

export const addMockCandidate = (candidate: Candidate) => {
  mockCandidates.push(candidate);
};

export const mockDashboardStats: DashboardStats = {
  get totalCandidates() { return mockCandidates.length; },
  totalJobs: 12,
  get shortlistedCandidates() { return mockCandidates.filter(c => c.status === 'Shortlisted').length; },
  interviewsScheduled: 0
};

export const mockJobs: Job[] = [
  { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', requiredExperience: 5, skills: ['React', 'TypeScript'], candidateCount: 45 },
  { id: 2, title: 'Backend Developer', department: 'Engineering', location: 'New York, NY', type: 'Full-time', requiredExperience: 3, skills: ['Java', 'Spring Boot'], candidateCount: 32 },
  { id: 3, title: 'Product Designer', department: 'Design', location: 'San Francisco, CA', type: 'Contract', requiredExperience: 4, skills: ['Figma', 'UI/UX'], candidateCount: 18 }
];
