import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Download, BrainCircuit, Briefcase, GraduationCap } from 'lucide-react';
import { candidateService } from '../services/candidateService';
import { Candidate, MatchResult } from '../types';
import { Button } from '../components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { Avatar } from '../components/common/Avatar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCandidateDetails = async () => {
      setIsLoading(true);
      try {
        const candidateId = parseInt(id || '0', 10);
        const [candidateRes, matchRes] = await Promise.all([
          candidateService.getCandidateById(candidateId),
          candidateService.getCandidateMatch(candidateId)
        ]);
        
        setCandidate(candidateRes.data);
        setMatchResult(matchRes.data);
      } catch (err) {
        setError('Failed to load candidate details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidateDetails();
  }, [id]);

  if (isLoading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (error || !candidate) return <div className="text-red-500 p-4">{error || 'Candidate not found'}</div>;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/candidates')}
          className="flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Candidates
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline">Reject</Button>
          <Button>Shortlist Candidate</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar size="xl" fallback={candidate.name} className="h-24 w-24 text-2xl bg-purple-500/20 border-2 border-purple-500/40 text-[#c084fc]" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold text-white">{candidate.name}</h1>
                      <p className="text-gray-400 mt-1 text-sm">{candidate.qualification} • {candidate.experience} years experience</p>
                    </div>
                    <StatusBadge status={candidate.status} />
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#c084fc]" /> {candidate.email}</div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#c084fc]" /> {candidate.phone}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#c084fc]" /> {candidate.location}</div>
                  </div>
                </div>
              </div>
              
              {candidate.summary && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="font-semibold text-white mb-2">Professional Summary</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{candidate.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map(skill => (
                  <Badge key={skill} variant="primary" className="px-3 py-1 text-xs">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {candidate.experienceDetails && candidate.experienceDetails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#c084fc]" /> Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {candidate.experienceDetails.map((exp, index) => (
                  <div key={index} className="relative pl-5 border-l-2 border-white/10 last:border-0 pb-2">
                    <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[7px] top-1.5 ring-4 ring-[#030006]" />
                    <h4 className="font-semibold text-white">{exp.jobTitle}</h4>
                    <p className="text-sm font-medium text-[#c084fc] mb-1">{exp.company} <span className="text-gray-500 mx-1">•</span> <span className="text-gray-400 font-normal">{exp.duration}</span></p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-300">
                      {exp.responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {candidate.education && candidate.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-[#c084fc]" /> Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.education.map((edu, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-white">{edu.degree}</h4>
                    <p className="text-sm text-gray-400">{edu.university} • {edu.passingYear}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - AI Match & Resume */}
        <div className="space-y-6">
          {matchResult && (
            <Card className="border-white/10 bg-[rgba(17,10,27,0.78)]">
              <CardHeader className="border-b-0 pb-0">
                <CardTitle className="flex items-center gap-2 text-white">
                  <BrainCircuit className="w-5 h-5 text-[#c084fc]" /> AI Match Score
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-purple-500/20 mb-2 relative">
                    <svg className="w-full h-full absolute top-0 left-0 -rotate-90 transform" viewBox="0 0 36 36">
                      <path
                        className="text-white/10"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="text-[#c084fc] transition-all duration-1000 ease-out"
                        strokeDasharray={`${matchResult.overallScore}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="text-3xl font-extrabold text-white">{matchResult.overallScore}%</span>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Overall Match</p>
                </div>

                <div className="space-y-4">
                  <ProgressBar showValue value={matchResult.skillMatch} className="text-xs" />
                  <ProgressBar showValue value={matchResult.experienceMatch} className="text-xs" colorClass="bg-gradient-to-r from-purple-500 to-indigo-500" />
                  <ProgressBar showValue value={matchResult.qualificationMatch} className="text-xs" colorClass="bg-gradient-to-r from-fuchsia-500 to-pink-500" />
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-2">Matched Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.matchedSkills.map(skill => (
                      <span key={skill} className="px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-300 rounded-md border border-emerald-500/30">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <h4 className="text-sm font-semibold text-white mt-4 mb-2">Missing Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.missingSkills.map(skill => (
                      <span key={skill} className="px-2 py-0.5 text-xs bg-red-500/15 text-red-300 rounded-md border border-red-500/30">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Resume</CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.resumeFile ? (
                <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-[#c084fc] border border-purple-500/30">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="text-sm font-medium text-white truncate">
                      {candidate.resumeFile}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" title="Download Resume">
                    <Download className="w-4 h-4 text-gray-400 hover:text-white" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No resume uploaded</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
