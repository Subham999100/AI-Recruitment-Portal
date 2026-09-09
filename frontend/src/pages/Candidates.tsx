import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, CheckCircle, XCircle, Users } from 'lucide-react';
import { candidateService } from '../services/candidateService';
import { Candidate } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/common/Table';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const response = await candidateService.getCandidates();
      setCandidates(response.data);
      setFilteredCandidates(response.data);
    } catch (err) {
      setError('Failed to load candidates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Handle filtering
    let result = [...candidates];

    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lowercasedSearch) ||
        c.email.toLowerCase().includes(lowercasedSearch) ||
        c.skills.some(s => s.toLowerCase().includes(lowercasedSearch))
      );
    }

    if (statusFilter) {
      result = result.filter(c => c.status === statusFilter);
    }

    // Sort by match percentage (high matching first)
    result.sort((a, b) => b.matchScore - a.matchScore);

    setFilteredCandidates(result);
    setCurrentPage(1); // Reset page on filter
  }, [searchTerm, statusFilter, candidates]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await candidateService.updateCandidateStatus(id, newStatus);
      // Update local state
      setCandidates(candidates.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (error) return <div className="text-red-500 p-4">{error} <Button onClick={fetchCandidates} className="ml-4" size="sm">Retry</Button></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Candidates</h1>
          <p className="text-sm text-gray-400 mt-1">Review applicant profiles, AI match scores, and hiring stages</p>
        </div>
        <Button onClick={() => navigate('/upload')}>
          Add Candidate
        </Button>
      </div>

      <div className="bg-[rgba(17,10,27,0.75)] backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/10 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or skills..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64 flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            className="w-full bg-[rgba(10,5,18,0.8)] border border-white/15 rounded-xl shadow-sm text-white focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] sm:text-sm py-2.5 px-3 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="" className="bg-[#0e071a] text-white">All Statuses</option>
            <option value="New" className="bg-[#0e071a] text-white">New</option>
            <option value="Under Review" className="bg-[#0e071a] text-white">Under Review</option>
            <option value="Shortlisted" className="bg-[#0e071a] text-white">Shortlisted</option>
            <option value="Interview Scheduled" className="bg-[#0e071a] text-white">Interview Scheduled</option>
            <option value="Selected" className="bg-[#0e071a] text-white">Selected</option>
            <option value="Rejected" className="bg-[#0e071a] text-white">Rejected</option>
          </select>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="bg-[rgba(17,10,27,0.75)] backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
            <Users className="h-8 w-8 text-[#c084fc]" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {candidates.length === 0 ? 'No candidates' : 'No candidates found'}
          </h3>
          <p className="mt-1 text-sm text-gray-400 max-w-sm mx-auto">
            {candidates.length === 0 
              ? 'There are currently no candidates in the portal. Upload resumes to get started.'
              : 'No candidates matched your search and filter criteria.'}
          </p>
          {candidates.length === 0 ? (
            <div className="mt-6">
              <Button onClick={() => navigate('/upload')}>Upload Resumes</Button>
            </div>
          ) : (
            <div className="mt-6">
              <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter(''); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-white">{candidate.name}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{candidate.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300 font-medium">{candidate.experience} yrs</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                      {candidate.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-semibold rounded-md">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-300 text-[10px] font-semibold rounded-md">
                          +{candidate.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-bold ${candidate.matchScore >= 85 ? 'text-emerald-400' : candidate.matchScore >= 70 ? 'text-amber-400' : 'text-gray-400'}`}>
                      {candidate.matchScore}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={candidate.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/candidates/${candidate.id}`)} title="View Profile">
                        <Eye className="w-4 h-4 text-gray-400 hover:text-[#c084fc]" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(candidate.id, 'Shortlisted')} title="Shortlist">
                        <CheckCircle className="w-4 h-4 text-gray-400 hover:text-emerald-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(candidate.id, 'Rejected')} title="Reject">
                        <XCircle className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages || 1}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
