import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Calendar, FileBarChart, Settings, LogOut, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/tw';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Candidates', href: '/candidates', icon: Users },
    { name: 'New Candidate Match', href: '/upload', icon: Sparkles, isHighlight: true },
    { name: 'Jobs & AI Interview Prep', href: '/jobs', icon: Briefcase },
    { name: 'Settings', href: '#', icon: Settings },
    ...(user?.role === 'ADMIN' ? [{ name: 'Admin Approvals', href: '/admin', icon: ShieldCheck }] : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[rgba(10,4,18,0.96)] backdrop-blur-2xl border-r border-white/10 shadow-[4px_0_30px_rgba(0,0,0,0.8)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center h-20 px-7 border-b border-white/10">
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:border-purple-400 transition-all duration-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#sidebarBrandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="url(#sidebarBrandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="url(#sidebarBrandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="sidebarBrandGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#c084fc" />
                    <stop offset="1" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              CLYPTUS<span className="text-[#a855f7]">.AI</span>
            </span>
          </motion.div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          <div className="px-4 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Recruitment Command
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group overflow-hidden',
                  isActive
                    ? 'text-white bg-gradient-to-r from-purple-500/25 to-purple-500/5 border-l-2 border-[#a855f7] shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                )
              }
              onClick={() => setIsOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: isActive ? 0 : [0, -10, 10, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors z-10 relative",
                      isActive ? "text-[#c084fc]" : (item.isHighlight ? "text-[#d946ef]" : "text-gray-500 group-hover:text-purple-300")
                    )} />
                  </motion.div>
                  <span className="z-10 relative">{item.name}</span>
                  {item.isHighlight && !isActive && (
                    <span className="absolute right-3 w-2 h-2 rounded-full bg-[#c084fc] shadow-[0_0_8px_#c084fc] animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
