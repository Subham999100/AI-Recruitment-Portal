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
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';

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
    let difficulty = 'Beginner';
    let focusGuideline = 'Focus on core programming fundamentals, structured debugging, data structures, and learning capacity.';
    if (exp >= 8) {
      expTier = 'Lead / Architect (8+ Yrs)';
      difficulty = 'Expert';
      focusGuideline = 'Focus on distributed system architecture, trade-offs, technical governance, scaling bottlenecks, and organizational engineering excellence.';
    } else if (exp >= 5) {
      expTier = 'Senior (5-8 Yrs)';
      difficulty = 'Advanced';
      focusGuideline = 'Focus on complex system resilience, concurrency, microservices/APIs, code maintainability, and team technical leadership.';
    } else if (exp >= 3) {
      expTier = 'Mid-Level (3-5 Yrs)';
      difficulty = 'Intermediate';
      focusGuideline = 'Focus on robust feature architecture, clean modular design, integration testing, and independent problem-solving.';
    }

    const difficultyBadge = `${difficulty} (${exp} Yrs Exp)`;

    const systemPrompt = `You are a Principal Engineering Recruiter and Technical Bar Raiser.
Your goal is to generate short, razor-sharp technical interview questions specifically evaluating this candidate against the target role.

Target Position: ${params.jobTitle}
Candidate Name: ${params.candidateName}
Experience: ${exp} Years (${difficultyBadge})
Experience Calibration Guide: ${focusGuideline}

STRICT CONSTRAINTS (MUST COMPLY):
1. QUESTION LENGTH: Each question MUST BE STRICTLY 1 OR 2 LINES (maximum 20-30 words). Never output long paragraphs or multi-part compound setups.
2. DIFFICULTY: The difficulty must strictly match their ${difficultyBadge} tier.
3. Formulate 4 sharp interview questions across categories:
   - "JD Technical": 1-2 lines on core technology requirements.
   - "Resume Deep-Dive": 1-2 lines on candidate's specific claims/projects.
   - "Experience & Architecture": 1-2 lines calibrated to their ${exp} years experience (${difficulty}).
   - "Behavioral & Leadership": 1-2 lines on trade-offs and decision making.
4. For EACH question, provide:
   - "id": string like "groq-q1"
   - "category": exactly one of ["JD Technical", "Resume Deep-Dive", "Experience & Architecture", "Behavioral & Leadership"]
   - "difficulty": "${difficultyBadge}"
   - "question": strictly 1 or 2 line question text
   - "rationale": 1 short sentence reason
   - "whatToLookFor": array of 2 short bullet points
   - "followUpProbe": 1 short follow-up line
5. Provide match score (0-100) and a concise 1-sentence summary.

Respond ONLY with valid JSON in this exact structure:
{
  "jobTitle": "${params.jobTitle}",
  "candidateName": "${params.candidateName}",
  "candidateExperience": ${exp},
  "matchedScore": 86,
  "summary": "Concise 1-sentence executive summary.",
  "questions": [
    {
      "id": "groq-q1",
      "category": "JD Technical",
      "difficulty": "${difficultyBadge}",
      "question": "Short 1 or 2 line question text?",
      "rationale": "Short 1-sentence rationale.",
      "whatToLookFor": ["Point 1", "Point 2"],
      "followUpProbe": "Short 1-line follow-up?"
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

    const modelsToTry = [modelName, 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
    let lastError: any = null;
    let res: Response | null = null;
    let usedModel = modelName;

    for (const mod of modelsToTry) {
      try {
        const attempt = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: mod,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
          })
        });

        if (attempt.ok) {
          res = attempt;
          usedModel = mod;
          break;
        } else {
          lastError = await attempt.json().catch(() => ({}));
          // If not 404 (model not found), don't keep trying others unless it's rate limit or not found
          if (attempt.status !== 404 && attempt.status !== 400) {
            break;
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!res || !res.ok) {
      throw new Error(lastError?.error?.message || 'Groq API request failed. Please verify your API key.');
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
      model: usedModel
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
    let expTier = 'Junior (0-2 Yrs)';
    let difficulty = 'Beginner';
    if (exp >= 8) {
      expTier = 'Lead / Architect (8+ Yrs)';
      difficulty = 'Expert';
    } else if (exp >= 5) {
      expTier = 'Senior (5-8 Yrs)';
      difficulty = 'Advanced';
    } else if (exp >= 3) {
      expTier = 'Mid-Level (3-5 Yrs)';
      difficulty = 'Intermediate';
    }

    const difficultyBadge = `${difficulty} (${exp} Yrs Exp)`;

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
        difficulty: difficultyBadge,
        question: `How have you structured and optimized ${primaryTech.toUpperCase()} applications in production to handle heavy load?`,
        rationale: `Assesses hands-on production depth with ${primaryTech.toUpperCase()} specified in the JD.`,
        whatToLookFor: [
          `Concrete optimization tactics rather than generic definitions.`,
          `Awareness of lifecycle and state bottlenecks.`
        ],
        followUpProbe: `What was the most challenging bug or performance regression you solved in ${primaryTech.toUpperCase()}?`
      },
      {
        id: 'q-jd-2',
        category: 'JD Technical',
        difficulty: difficultyBadge,
        question: `How would you quickly adapt your existing skills to build and deploy within our ${gapTech.toUpperCase()} pipeline?`,
        rationale: `Evaluates technical agility and knowledge transferability for ${gapTech.toUpperCase()}.`,
        whatToLookFor: [
          `Structured methodology for learning new technology.`,
          `Confidence and honesty regarding technical boundaries.`
        ],
        followUpProbe: `Can you share an example where you mastered a new technology quickly under a tight deadline?`
      },
      {
        id: 'q-res-1',
        category: 'Resume Deep-Dive',
        difficulty: difficultyBadge,
        question: `What was the most critical architectural decision or trade-off you made when delivering your ${secondaryTech.toUpperCase()} project?`,
        rationale: `Validates technical depth and ownership of achievements highlighted on ${params.candidateName}'s resume.`,
        whatToLookFor: [
          `Clear rationale defending trade-offs (e.g., complexity vs maintainability).`,
          `Clear articulation of personal contributions.`
        ],
        followUpProbe: `If you were designing that solution again today, what would you do differently?`
      },
      {
        id: 'q-exp-1',
        category: 'Experience & Architecture',
        difficulty: difficultyBadge,
        question: exp >= 8
          ? `With ${exp} years of experience, how do you eliminate cross-system architectural debt and align engineering design with business ROI?`
          : exp >= 5
          ? `As a Senior Engineer with ${exp} years experience, how do you design systems to survive partial network failures and traffic spikes?`
          : exp >= 3
          ? `With ${exp} years under your belt, how do you balance writing reusable abstractions against keeping code easy to debug?`
          : `With ${exp} year(s) of experience, walk me through your step-by-step process for debugging an elusive production bug.`,
        rationale: `Calibrated specifically for ${difficulty} difficulty based on ${exp} years of tenure.`,
        whatToLookFor: [
          `Depth matching ${difficulty} expectations.`,
          `Clear reasoning and real-world considerations.`
        ],
        followUpProbe: `Can you share a situation where that approach was challenged by your team?`
      },
      {
        id: 'q-beh-1',
        category: 'Behavioral & Leadership',
        difficulty: difficultyBadge,
        question: `Describe a difficult technical disagreement you resolved with a teammate regarding system design or code standards.`,
        rationale: `Assesses collaborative decision making, empathy, and professional communication.`,
        whatToLookFor: [
          `Focus on objective metrics and user needs over personal ego.`,
          `Constructive alignment toward team success.`
        ],
        followUpProbe: `How did the final outcome impact the delivery timeline and team morale?`
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
