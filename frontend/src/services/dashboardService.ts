import { api } from './api';
import { Candidate, DashboardStats, Job } from '../types';

export const dashboardService = {
  getDashboardData: async (): Promise<{ data: { stats: DashboardStats; recentJobs: Job[]; recentCandidates: Candidate[] } }> => {
    const response = await api.get<{ data: any }>('/dashboard');
    const payload = response.data.data;
    return {
      data: {
        stats: {
          totalCandidates: payload.stats.total_candidates,
          totalJobs: payload.stats.total_jobs,
          shortlistedCandidates: payload.stats.shortlisted_candidates,
          interviewsScheduled: payload.stats.interviews_scheduled,
        },
        recentJobs: payload.recent_jobs.map((job: any) => ({
          id: job.id, title: job.title, description: job.description,
          skills: job.skills || [], candidateCount: job.candidate_count || 0,
        })),
        recentCandidates: payload.recent_candidates.map((candidate: any) => ({
          id: candidate.id, name: candidate.name, email: candidate.email,
          experience: candidate.experience, skills: candidate.skills || [],
          status: candidate.status, summary: candidate.summary,
          resumeFile: candidate.resume_file, dateAdded: candidate.date_added,
          matchScore: candidate.match_score,
        })),
      },
    };
  },
};
