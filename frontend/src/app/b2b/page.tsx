"use client";

import { ChartBar, Users, Buildings, Wrench, ArrowUpRight, ArrowDownRight, Star } from "@phosphor-icons/react";

export default function B2BAnalytics() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Portfolio Analytics</h1>
          <p className="text-slate-500 mt-1">Overview of facility operations across all managed properties.</p>
        </div>
        <div className="flex gap-4">
          <select className="bg-white border border-slate-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm">
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>Year to Date</option>
          </select>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-primary-700 transition-colors">
            Export Report
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Wrench size={24} weight="duotone" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} weight="bold" /> 12%
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">1,248</h3>
            <p className="text-sm font-medium text-slate-500">Total Tickets Resolved</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <ChartBar size={24} weight="duotone" />
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowDownRight size={12} weight="bold" /> 2.4h
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">4.2h</h3>
            <p className="text-sm font-medium text-slate-500">Avg. Resolution Time</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users size={24} weight="duotone" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">4.8 <span className="text-lg text-slate-400">/ 5</span></h3>
            <p className="text-sm font-medium text-slate-500">Avg. Resident Rating</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Buildings size={24} weight="duotone" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-900">₹4.2L</h3>
            <p className="text-sm font-medium text-slate-500">Total Maintenance Spend</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Recurring Issues */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Top Recurring Issues by Block</h2>
          <div className="space-y-4">
            {[
              { block: "Block C", issue: "Plumbing Leaks", count: 42, severity: "High" },
              { block: "Block A", issue: "Elevator Faults", count: 28, severity: "Critical" },
              { block: "Block D", issue: "Common Area Cleaning", count: 19, severity: "Routine" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.issue}</h3>
                  <p className="text-sm text-slate-500">{item.block}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{item.count}</p>
                    <p className="text-xs text-slate-500">Incidents</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Vendor Performance Leaderboard</h2>
          <div className="space-y-4">
            {[
              { name: "Urban Company (API)", jobs: 142, rating: 4.9, speed: "2.1h" },
              { name: "Ravi Electricals (Local)", jobs: 89, rating: 4.8, speed: "1.5h" },
              { name: "City Cleaners (Local)", jobs: 210, rating: 4.6, speed: "4.2h" },
            ].map((vendor, i) => (
              <div key={i} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-semibold text-slate-900">{vendor.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-amber-500 mt-1">
                    <Star weight="fill" />
                    <span className="font-bold text-slate-700">{vendor.rating}</span>
                  </div>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="font-bold text-slate-900">{vendor.jobs}</p>
                    <p className="text-xs text-slate-500">Jobs</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{vendor.speed}</p>
                    <p className="text-xs text-slate-500">Avg. Time</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
