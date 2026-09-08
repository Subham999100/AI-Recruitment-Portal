import { InterviewKit, InterviewQuestion } from '../types';

export interface GenerateQuestionsParams {
  jobTitle: string;
  jobDescription: string;
  candidateName: string;
  candidateResume: string;
  candidateExperience: number; // in years
  focusArea?: string;
  apiKey?: string;
  model?: string;
}

const GROQ_STORAGE_KEY = 'recruitment_groq_api_key';
const GROQ_MODEL_KEY = 'recruitment_groq_model';
export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

export const interviewService = {
  getStoredApiKey: (): string => {
    try {
      return localStorage.getItem(GROQ_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  },

  setStoredApiKey: (key: string): void => {
    try {
      localStorage.setItem(GROQ_STORAGE_KEY, key.trim());
    } catch (e) {
      console.error('Failed to store Groq API key', e);
    }
  },

  clearStoredApiKey: (): void => {
    try {
      localStorage.removeItem(GROQ_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear Groq API key', e);
    }
  },

  getStoredModel: (): string => {
    try {
      return localStorage.getItem(GROQ_MODEL_KEY) || DEFAULT_GROQ_MODEL;
    } catch {
      return DEFAULT_GROQ_MODEL;
    }
  },

  setStoredModel: (model: string): void => {
    try {
      localStorage.setItem(GROQ_MODEL_KEY, model);
    } catch (e) {
      console.error('Failed to store Groq model', e);
    }
  },

  // Check backend status
  checkBackendGroqStatus: async (): Promise<{ configured: boolean; masked_key?: string }> => {
    try {
      const res = await fetch('http://localhost:8000/api/groq/status', { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend not running or unreachable
    }
    return { configured: false };
  },

  // Direct Groq API Client Call
  generateViaGroqDirect: async (
    apiKey: string,
    params: GenerateQuestionsParams,
    modelName: string = DEFAULT_GROQ_MODEL
  ): Promise<InterviewKit> => {
    const exp = params.candidateExperience;
    let expTier = 'Junior (0-2 Yrs)';
    let focusGuideline = 'Focus on core programming fundamentals, structured debugging, data structures, and learning capacity.';
    if (exp >= 8) {
      expTier = 'Lead / Architect (8+ Yrs)';
      focusGuideline = 'Focus on distributed system architecture, trade-offs, technical governance, scaling bottlenecks, and organizational engineering excellence.';
    } else if (exp >= 5) {
      expTier = 'Senior (5-8 Yrs)';
      focusGuideline = 'Focus on complex system resilience, concurrency, microservices/APIs, code maintainability, and team technical leadership.';
    } else if (exp >= 3) {
      expTier = 'Mid-Level (3-5 Yrs)';
      focusGuideline = 'Focus on robust feature architecture, clean modular design, integration testing, and independent problem-solving.';
    }

    const systemPrompt = `You are a Principal Engineering Recruiter and Technical Bar Raiser.
Your goal is to generate an in-depth, tailored interview kit specifically evaluating this candidate against the target role.

Target Position: ${params.jobTitle}
Candidate Name: ${params.candidateName}
Experience: ${exp} Years (${expTier})
Experience Calibration Guide: ${focusGuideline}

Instructions:
1. Thoroughly compare the Candidate's Resume against the Job Description requirements.
2. Identify both strong overlaps and critical skill gaps or stretch areas.
3. Formulate 4 to 6 razor-sharp, realistic, conversational interview questions across four categories:
   - "JD Technical": Direct deep-dive into core technologies and architectures specified in the JD.
   - "Resume Deep-Dive": Scrutinize specific project claims, accomplishments, or metrics in candidate's resume.
   - "Experience & Architecture": Calibrated directly for a candidate with ${exp} years of tenure.
   - "Behavioral & Leadership": Real-world engineering scenarios assessing trade-offs, conflict resolution, and communication.
4. For EACH question, provide:
   - "id": string like "groq-q1"
   - "category": exactly one of ["JD Technical", "Resume Deep-Dive", "Experience & Architecture", "Behavioral & Leadership"]
   - "difficulty": exactly "${expTier}"
   - "question": realistic, thought-provoking question text
   - "rationale": reason for asking this question based on JD/Resume comparison
   - "whatToLookFor": array of 3 distinct evaluation indicators for great vs mediocre responses
   - "followUpProbe": sharp follow-up probe to test depth
5. Provide an estimated match score (0-100) and a 2-3 sentence executive calibration summary.

Respond ONLY with valid JSON in this exact structure:
{
  "jobTitle": "${params.jobTitle}",
  "candidateName": "${params.candidateName}",
  "candidateExperience": ${exp},
  "matchedScore": 86,
  "summary": "Summary text...",
  "questions": [
    {
      "id": "groq-q1",
      "category": "JD Technical",
      "difficulty": "${expTier}",
      "question": "Question text...",
      "rationale": "Rationale...",
      "whatToLookFor": ["Point 1", "Point 2", "Point 3"],
      "followUpProbe": "Follow-up question..."
    }
  ]
}`;

    const userPrompt = `Target Job Title: ${params.jobTitle}
Job Description:
${params.jobDescription}

Candidate Profile:
Name: ${params.candidateName}
Experience: ${exp} years
Resume Content:
${params.candidateResume}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Groq API error: status ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content;
    const parsed = JSON.parse(content);

    return {
      jobTitle: parsed.jobTitle || params.jobTitle,
      candidateName: parsed.candidateName || params.candidateName,
      candidateExperience: parsed.candidateExperience ?? exp,
      matchedScore: parsed.matchedScore ?? 85,
      summary: parsed.summary || `Personalized Groq LLM assessment generated for ${params.candidateName}.`,
      generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      questions: parsed.questions || [],
      source: 'groq-llm',
      model: modelName
    };
  },

  // Main Generator orchestrator
  generateInterviewKit: async (params: GenerateQuestionsParams): Promise<InterviewKit> => {
    const activeKey = params.apiKey || interviewService.getStoredApiKey();
    const chosenModel = params.model || interviewService.getStoredModel();

    // 1. Try FastAPI Backend if available
    try {
      const backendRes = await fetch('http://localhost:8000/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: params.jobTitle,
          job_description: params.jobDescription,
          candidate_name: params.candidateName,
          candidate_resume: params.candidateResume,
          candidate_experience: params.candidateExperience,
          api_key: activeKey || null,
          model: chosenModel
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (backendRes.ok) {
        const json = await backendRes.json();
        if (json.data && json.data.questions && json.data.questions.length > 0) {
          return {
            ...json.data,
            source: 'groq-llm',
            model: chosenModel,
            generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          };
        }
      }
    } catch {
      // Backend not running or timed out; try direct Groq API client
    }

    // 2. Direct Groq API call if user has an API Key
    if (activeKey) {
      try {
        return await interviewService.generateViaGroqDirect(activeKey, params, chosenModel);
      } catch (groqErr: any) {
        console.warn('Groq direct API error, falling back to algorithmic calibrator:', groqErr);
        throw new Error(groqErr?.message || 'Failed to generate with Groq API. Please check your API key.');
      }
    }

    // 3. Fallback: Intelligent Algorithmic Calibration Generator
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const exp = params.candidateExperience;
    let expTier: 'Junior (0-2 Yrs)' | 'Mid-Level (3-5 Yrs)' | 'Senior (5-8 Yrs)' | 'Lead / Architect (8+ Yrs)' = 'Junior (0-2 Yrs)';
    if (exp >= 8) expTier = 'Lead / Architect (8+ Yrs)';
    else if (exp >= 5) expTier = 'Senior (5-8 Yrs)';
    else if (exp >= 3) expTier = 'Mid-Level (3-5 Yrs)';

    const jdText = params.jobDescription.toLowerCase();
    const resumeText = params.candidateResume.toLowerCase();

    const techKeywords = [
      'react', 'typescript', 'javascript', 'python', 'fastapi', 'node', 'django',
      'docker', 'kubernetes', 'aws', 'graphql', 'sql', 'postgresql', 'mongodb',
      'redis', 'tailwind', 'microservices', 'next.js', 'vue', 'ci/cd', 'kafka'
    ];

    const detectedJDSkills = techKeywords.filter(k => jdText.includes(k));
    const detectedResumeSkills = techKeywords.filter(k => resumeText.includes(k));
    const overlapSkills = detectedJDSkills.filter(k => detectedResumeSkills.includes(k));
    const missingJDSkills = detectedJDSkills.filter(k => !detectedResumeSkills.includes(k));

    const primaryTech = overlapSkills[0] || detectedJDSkills[0] || 'Fullstack Architecture';
    const secondaryTech = overlapSkills[1] || detectedJDSkills[1] || 'State Management & APIs';
    const gapTech = missingJDSkills[0] || 'Cloud Deployment & Monitoring';

    const questions: InterviewQuestion[] = [
      {
        id: 'q-jd-1',
        category: 'JD Technical',
        difficulty: expTier,
        question: `Our job description emphasizes heavy use of ${primaryTech.toUpperCase()}. Can you explain how you designed and optimized ${primaryTech.toUpperCase()} applications in your previous projects to handle high-traffic or complex state?`,
        rationale: `Directly assesses core requirement from JD (${primaryTech}) matched against candidate's background.`,
        whatToLookFor: [
          `Clear understanding of ${primaryTech} lifecycle, performance bottlenecks, and best practices.`,
          `Real-world examples of profiling or caching rather than theoretical definitions.`,
          `Awareness of modern ecosystem conventions.`
        ],
        followUpProbe: `What was the most challenging bug or performance regression you encountered with ${primaryTech}, and how did you diagnose it?`
      },
      {
        id: 'q-jd-2',
        category: 'JD Technical',
        difficulty: expTier,
        question: `The role requires familiarity with ${gapTech.toUpperCase()}. How would you bridge your current experience to get up to speed quickly with our ${gapTech.toUpperCase()} pipeline?`,
        rationale: `Identifies adaptability for skill gaps detected between JD requirements and resume content.`,
        whatToLookFor: [
          `Self-directed learning methodology and quick ramp-up framework.`,
          `Transferable concepts from related technologies they already know.`,
          `Honesty about knowledge boundaries paired with high curiosity.`
        ],
        followUpProbe: `Can you walk through a time you had to deliver production code in a technology you had never used before?`
      },
      {
        id: 'q-res-1',
        category: 'Resume Deep-Dive',
        difficulty: expTier,
        question: `In your resume, you highlighted significant accomplishments working with ${secondaryTech.toUpperCase()}. Could you break down the architectural decisions you made, the trade-offs evaluated, and why you selected that particular approach?`,
        rationale: `Validates authenticity of achievements reported on ${params.candidateName}'s resume.`,
        whatToLookFor: [
          `Detailed articulation of technical constraints and business context.`,
          `Ability to defend trade-offs (e.g. build vs buy, performance vs developer velocity).`,
          `Clear distinction of their individual contributions versus the wider team's role.`
        ],
        followUpProbe: `If you had to re-architect that same project today from scratch, what would you do differently?`
      },
      {
        id: 'q-exp-1',
        category: 'Experience & Architecture',
        difficulty: expTier,
        question: exp >= 8
          ? `With over ${exp} years of industry experience, how do you approach establishing engineering standards, mitigating architectural technical debt across multiple teams, and aligning system design with business ROI?`
          : exp >= 5
          ? `As a Senior Engineer with ${exp} years of hands-on experience, how do you design systems to be resilient against partial failures, cascading network outages, and sudden spikes in traffic?`
          : exp >= 3
          ? `With ${exp} years under your belt, how do you balance writing clean, reusable abstraction layers versus keeping code straightforward and easy to maintain by others?`
          : `As an engineer with ${exp} year(s) of experience, can you walk me through your systematic process for debugging a complex, intermittent issue when the error logs aren't immediately clear?`,
        rationale: `Calibrated specifically for a ${expTier} level profile with ${exp} years of tenure.`,
        whatToLookFor: [
          `Depth matching the ${expTier} expectations.`,
          `Concrete real-world examples and trade-off considerations.`,
          `Self-awareness and clarity of communication.`
        ],
        followUpProbe: `Can you describe a specific situation where that approach was challenged by the team?`
      },
      {
        id: 'q-beh-1',
        category: 'Behavioral & Leadership',
        difficulty: expTier,
        question: `Tell me about a time you had a strong technical disagreement with a colleague or product manager regarding how a feature should be built for the ${params.jobTitle} role. How did you resolve it?`,
        rationale: `Assesses emotional intelligence, constructive communication, and collaborative decision making.`,
        whatToLookFor: [
          `Focus on data, user impact, and objective criteria rather than ego.`,
          `Active listening to opposing viewpoints.`,
          `Commitment to the final team decision once consensus was reached.`
        ],
        followUpProbe: `Would you handle that situation any differently in hindsight?`
      }
    ];

    const matchedScore = Math.min(
      98,
      Math.max(65, Math.round((overlapSkills.length / (detectedJDSkills.length || 1)) * 40 + Math.min(exp * 8, 55)))
    );

    return {
      jobTitle: params.jobTitle,
      candidateName: params.candidateName || 'Candidate',
      candidateExperience: exp,
      matchedScore,
      summary: `Algorithmic preview kit generated for ${params.candidateName || 'the candidate'} applying for ${params.jobTitle}. (Connect a Groq API Key for live AI generation).`,
      generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      questions,
      source: 'algorithmic'
    };
  }
};
