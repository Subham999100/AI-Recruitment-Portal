import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030006] text-white flex overflow-hidden relative font-['Outfit',sans-serif]">
      {/* Ambient background glows matching landing & login page */}
      <div 
        className="fixed w-[700px] h-[700px] rounded-full pointer-events-none opacity-20 filter blur-[160px] -top-[250px] -right-[150px] -z-10"
        style={{ background: 'radial-gradient(circle, #a855f7, #d946ef)' }} 
      />
      <div 
        className="fixed w-[700px] h-[700px] rounded-full pointer-events-none opacity-20 filter blur-[160px] -bottom-[250px] -left-[150px] -z-10"
        style={{ background: 'radial-gradient(circle, #8b5cf6, #4c1d95)' }} 
      />

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

