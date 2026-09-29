import React from 'react';

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col bg-[#f8f9fb]">
      {/* Top Header / Search */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex w-96 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500">
          <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" placeholder="Search or type a command" className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" />
          <span className="rounded bg-white border border-gray-200 px-1.5 py-0.5 text-xs text-gray-400 shadow-sm font-medium">⌘F</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center shadow-sm">
            <button className="flex items-center rounded-l-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              New Project
            </button>
            <button className="flex items-center rounded-r-lg border-l border-blue-700 bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>
          <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-pink-500"></span>
          </button>
          <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200 border border-gray-200">
            <img src="https://i.pravatar.cc/150?img=11" alt="User Avatar" className="h-full w-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Thursday, 20th February</p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Good Evening! John,</h1>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
              Share
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add Task
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 flex flex-wrap gap-4">
          <div className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
            <svg className="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="font-bold text-gray-900">12hrs</span> Time Saved
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
            <svg className="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            <span className="font-bold text-gray-900">24</span> Projects Completed
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
            <svg className="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            <span className="font-bold text-gray-900">7</span> Projects In-progress
          </div>
        </div>

        {/* Projects Table */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                My Projects
              </h2>
              <select className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-700 outline-none shadow-sm cursor-pointer">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>
            <button className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">See All</button>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500">
                <th className="px-6 py-4 font-semibold">Task Name</th>
                <th className="px-6 py-4 font-semibold">Assign</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              <tr className="transition-colors hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <span className="font-medium text-gray-700">Help DStudio get more customers</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <img src="https://i.pravatar.cc/150?img=5" alt="Phoenix" className="h-6 w-6 rounded-full" />
                    Phoenix Winters
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">In Progress</span>
                </td>
              </tr>
              <tr className="transition-colors hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="font-medium text-gray-700">Plan a trip</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <img src="https://i.pravatar.cc/150?img=8" alt="Cohen" className="h-6 w-6 rounded-full" />
                    Cohen Merritt
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-700">Pending</span>
                </td>
              </tr>
              <tr className="transition-colors hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    <span className="font-medium text-gray-700">Return a package</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <img src="https://i.pravatar.cc/150?img=11" alt="Lukas" className="h-6 w-6 rounded-full" />
                    Lukas Juarez
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">Completed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Schedule */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                   <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   <h2 className="text-lg font-bold text-gray-900">Schedule</h2>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                   <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
                </button>
             </div>
             
             {/* Date Picker Mock */}
             <div className="flex justify-between mb-8 text-center text-sm border-b border-gray-100 pb-4">
                <div className="flex flex-col gap-1 text-gray-400 font-medium"><span>Mo</span><span className="font-bold text-gray-900">15</span></div>
                <div className="flex flex-col gap-1 text-gray-400 font-medium"><span>Tu</span><span className="font-bold text-gray-900">16</span></div>
                <div className="flex flex-col gap-1 bg-fuchsia-100 text-fuchsia-700 rounded-lg px-2 py-1 font-medium shadow-sm"><span>We</span><span className="font-bold">17</span></div>
                <div className="flex flex-col gap-1 text-gray-400 font-medium"><span>Th</span><span className="font-bold text-gray-900">18</span></div>
                <div className="flex flex-col gap-1 text-gray-400 font-medium"><span>Fr</span><span className="font-bold text-gray-900">19</span></div>
                <div className="flex flex-col gap-1 text-gray-400 font-medium"><span>Sa</span><span className="font-bold text-gray-900">20</span></div>
                <div className="flex flex-col gap-1 text-gray-400 font-medium"><span>Su</span><span className="font-bold text-gray-900">14</span></div>
             </div>

             <div className="space-y-6">
                <div className="flex items-start">
                   <div className="border-l-2 border-green-500 pl-4">
                     <h4 className="font-bold text-gray-900">Kickoff Meeting</h4>
                     <p className="text-xs font-medium text-gray-400 mt-1">01:00 PM to 02:30 PM</p>
                   </div>
                   <div className="ml-auto flex -space-x-2">
                     <img className="h-6 w-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=12" alt=""/>
                     <img className="h-6 w-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=33" alt=""/>
                   </div>
                </div>
                
                <div className="flex items-start">
                   <div className="border-l-2 border-blue-500 pl-4">
                     <h4 className="font-bold text-gray-900">Create Wordpress website for event Registration</h4>
                     <p className="text-xs font-medium text-gray-400 mt-1">04:00 PM to 02:30 PM</p>
                   </div>
                   <div className="ml-auto flex -space-x-2">
                     <img className="h-6 w-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=1" alt=""/>
                     <img className="h-6 w-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=2" alt=""/>
                   </div>
                </div>
                
                <div className="flex items-start">
                   <div className="border-l-2 border-indigo-500 pl-4">
                     <h4 className="font-bold text-gray-900">Create User flow for hotel booking</h4>
                     <p className="text-xs font-medium text-gray-400 mt-1">05:00 PM to 02:30 PM</p>
                   </div>
                   <div className="ml-auto flex -space-x-2">
                     <img className="h-6 w-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=3" alt=""/>
                     <img className="h-6 w-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/150?img=4" alt=""/>
                   </div>
                </div>
             </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <h2 className="text-lg font-bold text-gray-900">Notes</h2>
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="h-5 w-5 rounded-full border-[1.5px] border-gray-300 mt-0.5 flex-shrink-0 cursor-pointer hover:border-gray-400 transition-colors"></div>
                   <div>
                      <h4 className="font-semibold text-gray-900">Landing Page For Website</h4>
                      <p className="text-xs font-medium text-gray-500 mt-1.5 leading-relaxed">To get started on a landing page, could you provide a bit more detail about its purpose?</p>
                   </div>
                </div>
                <div className="border-t border-gray-100"></div>
                <div className="flex gap-4">
                   <div className="h-5 w-5 rounded-full border-[1.5px] border-gray-300 mt-0.5 flex-shrink-0 cursor-pointer hover:border-gray-400 transition-colors"></div>
                   <div>
                      <h4 className="font-semibold text-gray-900">Fixing icons with dark backgrounds</h4>
                      <p className="text-xs font-medium text-gray-500 mt-1.5 leading-relaxed">Use icons that are easily recognizable and straightforward. Avoid overly complex designs that might confuse users</p>
                   </div>
                </div>
                <div className="border-t border-gray-100"></div>
                <div className="flex gap-4">
                   <div className="h-5 w-5 rounded-full bg-fuchsia-500 mt-0.5 flex-shrink-0 flex items-center justify-center cursor-pointer shadow-sm">
                     <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                   <div>
                      <h4 className="font-semibold text-gray-900 line-through text-opacity-50">Discussion regarding userflow improvement</h4>
                      <p className="text-xs font-medium text-gray-400 mt-1.5 leading-relaxed">What's the main goal of the landing page? (e.g., lead generation, product)</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
