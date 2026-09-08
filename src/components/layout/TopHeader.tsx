import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export default function TopHeader({ onMenuClick }: TopHeaderProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <header className="bg-white/60 backdrop-blur-xl border-b border-white/40 h-20 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <button
          onClick={onMenuClick}
          className="p-2 text-gray-500 rounded-xl lg:hidden hover:bg-gray-100/50 focus:outline-none transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden lg:flex relative w-96">
          <motion.div 
            animate={{ scale: isSearchFocused ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`relative flex items-center w-full rounded-2xl border transition-colors duration-300 ${isSearchFocused ? 'border-primary-400 bg-white shadow-glow' : 'border-gray-200 bg-white/50'}`}
          >
            <div className="pl-4 flex items-center pointer-events-none">
              <motion.div
                animate={{ rotate: isSearchFocused ? 90 : 0, color: isSearchFocused ? '#3b82f6' : '#94a3b8' }}
              >
                <Search className="h-4 w-4" />
              </motion.div>
            </div>
            <input
              type="text"
              className="block w-full pl-3 pr-4 py-2.5 bg-transparent border-none focus:ring-0 sm:text-sm text-dark-900 placeholder-gray-400 outline-none"
              placeholder="Search candidates, skills, or jobs..."
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </motion.div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 text-gray-400 hover:text-dark-900 transition-colors rounded-full hover:bg-gray-100/50"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 block w-2 h-2 rounded-full bg-accent-500 ring-2 ring-white animate-pulse-glow" />
        </motion.button>
        
        <div className="flex items-center gap-4 pl-6 border-l border-gray-200/50 relative" ref={dropdownRef}>
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-dark-900">{user?.name || 'Recruiter'}</p>
            <p className="text-xs text-primary-600 font-medium capitalize">{user?.role || 'Admin'}</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="cursor-pointer"
          >
            <Avatar fallback={user?.name || 'R'} className="border-2 border-white shadow-sm" />
          </motion.div>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-[calc(100%+0.5rem)] mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-premium border border-white/50 z-50 overflow-hidden p-1"
              >
                <button 
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 hover:text-primary-600 rounded-xl flex items-center gap-3 transition-colors font-medium"
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserIcon className="w-4 h-4" /> My Profile
                </button>
                <div className="h-px bg-gray-100 my-1 mx-2" />
                <button 
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/50 rounded-xl flex items-center gap-3 transition-colors font-medium"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
