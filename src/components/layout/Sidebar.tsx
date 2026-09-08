import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Calendar, FileBarChart, Settings, LogOut, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/tw';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Candidates', href: '/candidates', icon: Users },
    { name: 'New Candidate Match', href: '/upload', icon: Sparkles, isHighlight: true },
    { name: 'Jobs', href: '#', icon: Briefcase },
    { name: 'Settings', href: '#', icon: Settings },
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
            className="fixed inset-0 z-40 bg-dark-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center h-20 px-8 border-b border-gray-100/50">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-premium flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-dark-900 to-dark-600">
              TalentAI
            </span>
          </motion.div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          <div className="px-4 mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group overflow-hidden',
                  isActive
                    ? 'text-primary-700 bg-primary-50/50'
                    : 'text-gray-500 hover:text-dark-900 hover:bg-gray-50'
                )
              }
              onClick={() => setIsOpen(false)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-premium rounded-r-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-50/80 to-transparent opacity-50 pointer-events-none" />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: isActive ? 0 : [0, -10, 10, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors z-10 relative",
                      isActive ? "text-primary-600" : (item.isHighlight ? "text-accent-500" : "text-gray-400 group-hover:text-primary-500")
                    )} />
                  </motion.div>
                  <span className="z-10 relative">{item.name}</span>
                  {item.isHighlight && !isActive && (
                    <span className="absolute right-3 w-2 h-2 rounded-full bg-accent-500 animate-pulse-glow" />
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
