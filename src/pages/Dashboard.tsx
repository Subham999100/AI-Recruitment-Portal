import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Briefcase, UserCheck, Calendar, Activity, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats, Job, Candidate } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Avatar } from '../components/common/Avatar';
import { ProgressBar } from '../components/common/ProgressBar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await dashboardService.getDashboardData();
        setStats(response.data.stats);
        setRecentJobs(response.data.recentJobs);
        setRecentCandidates(response.data.recentCandidates);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!stats) return null;

  const statCards = [
    { title: 'Total Candidates', value: stats.totalCandidates, icon: Users, color: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/20' },
    { title: 'Active Jobs', value: stats.totalJobs, icon: Briefcase, color: 'from-indigo-500 to-purple-500', shadow: 'shadow-indigo-500/20' },
    { title: 'Shortlisted AI Match', value: stats.shortlistedCandidates, icon: Zap, color: 'from-fuchsia-500 to-pink-500', shadow: 'shadow-pink-500/20' },
    { title: 'Interviews Scheduled', value: stats.interviewsScheduled, icon: Calendar, color: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/20' },
  ];

  return (
    <motion.div 
      className="space-y-8 relative"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply animate-pulse-glow" />
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 mix-blend-multiply animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
            AI Command Center
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500 animate-pulse" />
            System nominal. Real-time candidate analytics active.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div 
            key={index}
            variants={itemVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl ${stat.shadow} group`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="p-6 relative z-10">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-4xl font-black text-gray-900">{stat.value}</p>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
            </div>
            {/* Bottom animated border line */}
            <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${stat.color} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Candidates */}
        <motion.div variants={itemVariants} className="flex flex-col bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl shadow-gray-200/50 overflow-hidden relative">
          <div className="p-6 border-b border-gray-100/50 bg-white/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Live Candidate Stream
            </h3>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
          <div className="divide-y divide-gray-100/50 flex-1 overflow-auto p-2">
            {recentCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3 border border-gray-100">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-800">No candidates</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Upload resumes to view real-time candidate matches.
                </p>
              </div>
            ) : (
              recentCandidates.map((candidate, i) => (
                <motion.div 
                  key={candidate.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.9)' }}
                  className="p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar fallback={candidate.name} size="lg" className="ring-2 ring-white shadow-md" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{candidate.name}</h4>
                      <p className="text-xs font-medium text-primary-600">{candidate.skills.slice(0, 2).join(' • ')}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <StatusBadge status={candidate.status} />
                    <div className="w-28 relative group">
                      <ProgressBar value={candidate.matchScore} className="h-2" colorClass={candidate.matchScore > 85 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-primary-400 to-indigo-500'} />
                      <span className="text-[10px] font-bold text-gray-500 mt-1 block tracking-wider uppercase">
                        {candidate.matchScore}% Match
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Jobs */}
        <motion.div variants={itemVariants} className="flex flex-col bg-gray-900 rounded-3xl shadow-2xl overflow-hidden relative text-white">
          {/* Animated gradient background for dark mode card */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 animate-gradient-x opacity-80" />
          
          <div className="p-6 border-b border-gray-800 relative z-10 flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Active AI Deployments
            </h3>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs font-semibold text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 transition-all border border-indigo-500/30 flex items-center gap-1.5"
            >
              <span>Jobs & Prep Kits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-gray-800 flex-1 overflow-auto p-2 relative z-10">
            {recentJobs.map((job, i) => (
              <motion.div 
                key={job.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ x: 5 }}
                className="p-4 rounded-xl hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-base font-bold text-white">{job.title}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {job.department} • {job.location}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-1 rounded-full font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                      {job.candidateCount} Matches
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {job.skills.map((skill, idx) => (
                    <span key={idx} className="text-[10px] font-bold tracking-wider uppercase text-gray-300 bg-gray-800 border border-gray-700 px-2 py-1 rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
