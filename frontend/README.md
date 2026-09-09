# AI Recruitment Portal - Frontend

Modern, high-performance web interface for the AI Recruitment Portal. Built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**, styled in the Clyptus dark luxury aesthetic.

## Features
- **High-Tech Landing Page**: Dynamic talent audit and candidate evaluation showcase.
- **Role-Based Authentication**: Secure authentication flow for HR managers and recruiters.
- **Candidate Management**: Dossiers, skill matching breakdown, resume vectorization, and scoring metrics.
- **Job Creation & Matching**: Interactive job posting and automatic resume-to-job matching.
- **Interview Rubric Generation**: AI-synthesized tailored interview questions per candidate.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_API_URL=http://localhost:8000
```

### 3. Run Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173/`.

### 4. Build for Production
```bash
npm run build
```
The production bundle will be output to the `dist/` directory.
