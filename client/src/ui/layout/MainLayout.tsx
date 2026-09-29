import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

export default function MainLayout() {
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-4 py-2.5 font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 font-semibold'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`;

  return (
    <div className="flex min-h-screen bg-[#f8f9fb] font-sans text-gray-900 antialiased">
      {/* Sidebar */}
      <aside className="flex w-[260px] flex-col border-r border-gray-200 bg-white">
        <div className="p-6 pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mondays</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-1 px-4 mb-8">
            <NavLink to="/dashboard" className={getNavClass}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              Dashboard
            </NavLink>
            <NavLink to="/projects" className={getNavClass}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Projects
            </NavLink>
            <NavLink to="/my-task" className={getNavClass}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              My Task
            </NavLink>
            <NavLink to="/chats" className={getNavClass}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              Chats
            </NavLink>
            <NavLink to="/documents" className={getNavClass}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
              Documents
            </NavLink>
            <NavLink to="/receipts" className={getNavClass}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              Receipts
            </NavLink>
          </nav>

          <div className="px-4">
            <div className="flex items-center justify-between px-4 mb-2">
              <h3 className="text-xs font-bold text-gray-900">Projects</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <NavLink to="/projects/event-planning" className={getNavClass}>
                <span className="h-2.5 w-2.5 rounded-sm bg-fuchsia-400"></span>
                Event Planning
              </NavLink>
              <NavLink to="/projects/breakfast-plan" className={getNavClass}>
                <span className="h-2.5 w-2.5 rounded-sm bg-green-400"></span>
                Breakfast Plan
              </NavLink>
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-1 mt-auto">
          <NavLink to="/settings" className={getNavClass}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Settings
          </NavLink>
          <NavLink to="/support" className={({ isActive }) => `flex items-center justify-between rounded-lg px-4 py-2.5 font-medium transition-colors ${isActive ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Help & Support
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded bg-green-100 text-xs font-bold text-green-600">8</span>
          </NavLink>
        </div>
      </aside>

      <Outlet />
    </div>
  );
}
