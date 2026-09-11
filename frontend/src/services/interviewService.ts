import { api, getApiErrorMessage } from './api';
import { InterviewKit } from '../types';

export interface GenerateQuestionsParams {
  jobTitle: string;
  jobDescription: string;
  candidateName: string;
  candidateResume: string;
  candidateExperience: number;
  model?: string;
}

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

export const interviewService = {
  checkBackendGroqStatus: async (): Promise<{ configured: boolean; masked_key?: string; default_model?: string; supported_models?: string[] }> => {
    const response = await api.get('/api/groq/status');
    return response.data;
  },

  generateInterviewKit: async (params: GenerateQuestionsParams): Promise<InterviewKit> => {
    try {
      const response = await api.post('/interview/generate', {
        job_title: params.jobTitle,
        job_description: params.jobDescription,
        candidate_name: params.candidateName,
        candidate_resume: params.candidateResume,
        candidate_experience: params.candidateExperience,
        model: params.model || DEFAULT_GROQ_MODEL,
      });
      const data = response.data.data;
      return {
        ...data,
        generatedAt: new Date().toLocaleString(),
        source: 'groq-llm',
        model: data.used_model || params.model || DEFAULT_GROQ_MODEL,
      };
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Groq interview generation failed.'));
    }
  },

  generateCandidateInterviewKit: async (candidateId: number): Promise<InterviewKit> => {
    try {
      const response = await api.post(`/candidates/${candidateId}/interview/generate`);
      const data = response.data.data;
      return {
        ...data,
        generatedAt: new Date().toLocaleString(),
        source: 'groq-llm',
        model: data.used_model || DEFAULT_GROQ_MODEL,
      };
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Interview question generation failed.'));
    }
  },
};
