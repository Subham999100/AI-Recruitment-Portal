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
  { 
    id: 1, 
    title: 'Senior Frontend Engineer', 
    department: 'Engineering', 
    location: 'Remote', 
    type: 'Full-time', 
    requiredExperience: 5, 
    skills: ['React', 'TypeScript', 'Tailwind', 'Next.js', 'State Management', 'GraphQL'], 
    candidateCount: 45,
    description: `We are looking for a Senior Frontend Engineer with 5+ years of experience to lead the development of our high-scale cloud interfaces. You will architect responsive, accessible web applications using React, TypeScript, and Tailwind CSS, collaborate with backend teams on GraphQL APIs, and mentor junior engineers.`
  },
  { 
    id: 2, 
    title: 'Backend Developer', 
    department: 'Engineering', 
    location: 'New York, NY', 
    type: 'Full-time', 
    requiredExperience: 3, 
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Redis'], 
    candidateCount: 32,
    description: `Seeking a Backend Developer with 3+ years of experience in Python and microservices architecture. Responsible for high-performance REST APIs, database query optimization with PostgreSQL, and cloud deployments with Docker and CI/CD pipelines.`
  },
  { 
    id: 3, 
    title: 'Staff Fullstack Architect', 
    department: 'Engineering', 
    location: 'San Francisco, CA', 
    type: 'Full-time', 
    requiredExperience: 8, 
    skills: ['System Design', 'React', 'Node.js', 'AWS', 'Kubernetes', 'Microservices'], 
    candidateCount: 18,
    description: `Looking for a Staff Fullstack Architect with 8+ years experience to define our overarching technical strategy, lead system design for distributed services, evaluate architectural trade-offs, and elevate engineering standards across the entire organization.`
  }
];

export const sampleCandidatePresets = [
  {
    name: 'Alex Chen',
    experience: 5,
    skills: ['React', 'TypeScript', 'Redux', 'Tailwind CSS', 'REST APIs', 'Jest'],
    resume: `Senior Frontend Developer with 5 years experience building performant web applications. Spearheaded the redesign of an enterprise analytics dashboard in React & TypeScript, cutting render times by 42%. Built reusable design systems with Tailwind CSS. Collaborated with backend teams on REST API integrations and established CI/CD automated test suites.`
  },
  {
    name: 'Priya Sharma',
    experience: 3,
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git'],
    resume: `Software Engineer with 3 years of backend development experience. Designed and deployed RESTful microservices with Python and FastAPI. Optimized complex SQL queries in PostgreSQL, improving response times by 35%. Containerized services with Docker and managed continuous deployment workflows.`
  },
  {
    name: 'Marcus Vance',
    experience: 8,
    skills: ['System Design', 'React', 'Node.js', 'AWS', 'Microservices', 'Kubernetes'],
    resume: `Lead Fullstack Architect with 8+ years designing fault-tolerant, distributed cloud systems. Architected multi-region AWS cloud infrastructure handling 20M+ daily requests. Led a team of 14 engineers across frontend and backend disciplines. Introduced Architecture Decision Records (ADRs) and reduced cloud hosting costs by $180k/yr.`
  }
];

