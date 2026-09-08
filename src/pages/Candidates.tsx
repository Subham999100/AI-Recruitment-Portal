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
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <Button>Add Candidate</Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
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
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm py-2 px-3 border"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {candidates.length === 0 ? 'No candidates' : 'No candidates found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            {candidates.length === 0 
              ? 'There are currently no candidates in the portal. Upload resumes to get started.'
              : 'No candidates matched your search and filter criteria.'}
          </p>
          {candidates.length === 0 ? (
            <div className="mt-6">
              <Button onClick={() => navigate('/upload-match')}>Upload Resumes</Button>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                      <div className="font-medium text-gray-900">{candidate.name}</div>
                      <div className="text-gray-500 text-xs">{candidate.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{candidate.experience} yrs</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {candidate.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                          +{candidate.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${candidate.matchScore >= 85 ? 'text-green-600' : candidate.matchScore >= 70 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {candidate.matchScore}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={candidate.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/candidates/${candidate.id}`)} title="View Profile">
                        <Eye className="w-4 h-4 text-gray-500 hover:text-primary-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(candidate.id, 'Shortlisted')} title="Shortlist">
                        <CheckCircle className="w-4 h-4 text-gray-500 hover:text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(candidate.id, 'Rejected')} title="Reject">
                        <XCircle className="w-4 h-4 text-gray-500 hover:text-red-600" />
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
