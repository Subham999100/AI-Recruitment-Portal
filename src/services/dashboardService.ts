import { api, delay } from './api';
import { mockDashboardStats, mockJobs, mockCandidates } from './mockData';

export const dashboardService = {
  getDashboardData: async () => {
    // return api.get('/dashboard');
    await delay(400);
    return {
      data: {
        stats: {
          totalCandidates: mockDashboardStats.totalCandidates,
          totalJobs: mockDashboardStats.totalJobs,
          shortlistedCandidates: mockDashboardStats.shortlistedCandidates,
          interviewsScheduled: mockDashboardStats.interviewsScheduled
        },
        recentJobs: mockJobs.slice(0, 3),
        recentCandidates: mockCandidates.slice(-4).reverse()
      }
    };
  }
};
