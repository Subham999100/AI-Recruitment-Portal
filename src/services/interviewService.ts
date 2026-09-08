import { InterviewKit, InterviewQuestion } from '../types';

interface GenerateQuestionsParams {
  jobTitle: string;
  jobDescription: string;
  candidateName: string;
  candidateResume: string;
  candidateExperience: number; // in years
  focusArea?: string;
}

export const interviewService = {
  generateInterviewKit: async (params: GenerateQuestionsParams): Promise<InterviewKit> => {
    // Simulate AI inference latency with realistic progression
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const exp = params.candidateExperience;
    let expTier: 'Junior (0-2 Yrs)' | 'Mid-Level (3-5 Yrs)' | 'Senior (5-8 Yrs)' | 'Lead / Architect (8+ Yrs)' = 'Junior (0-2 Yrs)';
    if (exp >= 8) expTier = 'Lead / Architect (8+ Yrs)';
    else if (exp >= 5) expTier = 'Senior (5-8 Yrs)';
    else if (exp >= 3) expTier = 'Mid-Level (3-5 Yrs)';

    // Extract key skills from JD and Resume for tailoring
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

    const primaryTech = overlapSkills[0] || detectedJDSkills[0] || 'Modern Fullstack Architecture';
    const secondaryTech = overlapSkills[1] || detectedJDSkills[1] || 'State Management & APIs';
    const gapTech = missingJDSkills[0] || 'Cloud Deployment & Monitoring';

    const questions: InterviewQuestion[] = [];

    // 1. JD Technical Competency Questions
    questions.push({
      id: 'q-jd-1',
      category: 'JD Technical',
      difficulty: expTier,
      question: `Our job description emphasizes heavy use of ${primaryTech.toUpperCase()}. Can you explain how you designed and optimized ${primaryTech.toUpperCase()} applications in your previous projects to handle high-traffic or complex state?`,
      rationale: `Directly assesses core requirement from JD (${primaryTech}) matched against candidate's claims.`,
      whatToLookFor: [
        `Clear understanding of ${primaryTech} lifecycle, performance bottlenecks, and best practices.`,
        `Real-world examples of profiling or caching rather than theoretical definitions.`,
        `Awareness of modern ecosystem conventions.`
      ],
      followUpProbe: `What was the most challenging bug or performance regression you encountered with ${primaryTech}, and how did you diagnose it?`
    });

    if (gapTech) {
      questions.push({
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
      });
    }

    // 2. Resume Deep-Dive Questions
    questions.push({
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
    });

    questions.push({
      id: 'q-res-2',
      category: 'Resume Deep-Dive',
      difficulty: expTier,
      question: `Looking at your recent project history, describe the automated testing and deployment workflow you established. How did you ensure zero-downtime and high reliability?`,
      rationale: `Probes testing rigor, CI/CD maturity, and production readiness from candidate's background.`,
      whatToLookFor: [
        `Experience with unit, integration, and E2E testing strategies.`,
        `Understanding of rollback mechanisms, blue/green or canary deployments.`,
        `Focus on developer ergonomics and continuous integration stability.`
      ],
      followUpProbe: `How did your team handle flaky integration tests in the deployment pipeline?`
    });

    // 3. Experience & Architecture (Heavily calibrated to years of experience!)
    if (exp >= 8) {
      questions.push({
        id: 'q-exp-1',
        category: 'Experience & Architecture',
        difficulty: 'Lead / Architect (8+ Yrs)',
        question: `With over ${exp} years of industry experience, how do you approach establishing engineering standards, mitigating architectural technical debt across multiple teams, and aligning system design with business ROI?`,
        rationale: `Calibrated specifically for a Lead/Staff level profile with ${exp} years of tenure.`,
        whatToLookFor: [
          `Long-term vision balancing velocity with maintainability.`,
          `Concrete frameworks for deprecation strategies and architecture decision records (ADRs).`,
          `Influence without authority and cross-org technical alignment.`
        ],
        followUpProbe: `Describe a scenario where engineering wanted to refactor a legacy system, but product leadership pushed for features. How did you negotiate?`
      });
    } else if (exp >= 5) {
      questions.push({
        id: 'q-exp-1',
        category: 'Experience & Architecture',
        difficulty: 'Senior (5-8 Yrs)',
        question: `As a Senior Engineer with ${exp} years of hands-on experience, how do you design systems to be resilient against partial failures, cascading network outages, and sudden spikes in traffic?`,
        rationale: `Tests senior-level system design instincts and failure-mode resilience.`,
        whatToLookFor: [
          `Application of circuit breakers, rate limiting, idempotency, and fallback states.`,
          `Observability practices: structured logging, distributed tracing, and actionable metrics.`,
          `Experience mentoring junior engineers through production incidents.`
        ],
        followUpProbe: `How do you decide between synchronous REST/GraphQL calls and asynchronous event-driven messaging?`
      });
    } else if (exp >= 3) {
      questions.push({
        id: 'q-exp-1',
        category: 'Experience & Architecture',
        difficulty: 'Mid-Level (3-5 Yrs)',
        question: `With ${exp} years under your belt, how do you balance writing clean, reusable abstraction layers versus keeping code straightforward and easy to maintain by others?`,
        rationale: `Evaluates mid-level engineering maturity and avoiding premature optimization.`,
        whatToLookFor: [
          `Appreciation of the YAGNI (You Aren't Gonna Need It) and DRY principles.`,
          `Readability and documentation focus.`,
          `Practical refactoring experience.`
        ],
        followUpProbe: `Tell me about a time an abstraction you created turned out to be too rigid. How did you resolve it?`
      });
    } else {
      questions.push({
        id: 'q-exp-1',
        category: 'Experience & Architecture',
        difficulty: 'Junior (0-2 Yrs)',
        question: `As an engineer with ${exp} year(s) of experience, can you walk me through your systematic process for debugging a complex, intermittent issue when the error logs aren't immediately clear?`,
        rationale: `Probes fundamental problem-solving logic and debugging grit suitable for junior/early-career engineers.`,
        whatToLookFor: [
          `Methodical elimination of variables rather than random trial-and-error.`,
          `Proficiency with browser devtools, network inspection, and debuggers.`,
          `Knowing when to research independently and when to ask for senior guidance.`
        ],
        followUpProbe: `What resources or tools do you turn to first when you hit an unfamiliar error message?`
      });
    }

    // 4. Behavioral & Leadership
    questions.push({
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
    });

    const matchedScore = Math.min(
      98,
      Math.max(65, Math.round((overlapSkills.length / (detectedJDSkills.length || 1)) * 40 + Math.min(exp * 8, 55)))
    );

    return {
      jobTitle: params.jobTitle,
      candidateName: params.candidateName || 'Candidate',
      candidateExperience: exp,
      matchedScore,
      summary: `Tailored interview kit generated for ${params.candidateName || 'the candidate'} applying for ${params.jobTitle}. Evaluated ${exp} years of recorded experience against role requirements with ${questions.length} calibrated questions.`,
      generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      questions
    };
  }
};
