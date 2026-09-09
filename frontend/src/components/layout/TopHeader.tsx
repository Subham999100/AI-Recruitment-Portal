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
    <header className="bg-[rgba(10,4,18,0.85)] backdrop-blur-xl border-b border-white/10 h-20 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <button
          onClick={onMenuClick}
          className="p-2 text-gray-400 rounded-xl lg:hidden hover:bg-white/5 hover:text-white focus:outline-none transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden lg:flex relative w-96">
          <motion.div 
            animate={{ scale: isSearchFocused ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`relative flex items-center w-full rounded-2xl border transition-all duration-300 ${
              isSearchFocused 
                ? 'border-[#a855f7] bg-[rgba(17,10,27,0.95)] shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                : 'border-white/10 bg-[rgba(17,10,27,0.6)]'
            }`}
          >
            <div className="pl-4 flex items-center pointer-events-none">
              <motion.div
                animate={{ rotate: isSearchFocused ? 90 : 0, color: isSearchFocused ? '#c084fc' : '#9ca3af' }}
              >
                <Search className="h-4 w-4" />
              </motion.div>
            </div>
            <input
              type="text"
              className="block w-full pl-3 pr-4 py-2.5 bg-transparent border-none focus:ring-0 sm:text-sm text-white placeholder-gray-500 outline-none"
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
          className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 block w-2 h-2 rounded-full bg-[#c084fc] ring-2 ring-[#030006] shadow-[0_0_8px_#c084fc] animate-pulse" />
        </motion.button>
        
        <div className="flex items-center gap-4 pl-6 border-l border-white/10 relative" ref={dropdownRef}>
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-white">{user?.name || 'Recruiter'}</p>
            <p className="text-xs text-[#c084fc] font-medium uppercase tracking-wider">{user?.role || 'Admin'}</p>
          </div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="cursor-pointer"
          >
            <Avatar fallback={user?.name || 'R'} className="border-2 border-purple-500/40 shadow-sm bg-purple-500/20 text-[#c084fc]" />
          </motion.div>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-[calc(100%+0.5rem)] mt-2 w-56 bg-[rgba(14,7,26,0.96)] backdrop-blur-2xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10 z-50 overflow-hidden p-1.5"
              >
                <button 
                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl flex items-center gap-3 transition-colors font-medium"
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserIcon className="w-4 h-4 text-[#c084fc]" /> My Profile
                </button>
                <div className="h-px bg-white/10 my-1 mx-2" />
                <button 
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/15 hover:text-red-300 rounded-xl flex items-center gap-3 transition-colors font-medium"
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
