"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, NavigationArrow, Camera, CheckCircle, Warning, Clock, SignOut, X } from "@phosphor-icons/react";

export default function VendorDashboard() {
  const router = useRouter();
  const [activeJob, setActiveJob] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoResult, setGeoResult] = useState<{ match: boolean; distance: number | null } | null>(null);

  // Active Ticket ID
  const ticketId = 1;

  const handleCompleteJob = async () => {
    setIsSubmitting(true);
    
    // Capture photo and getting location
    const requestData = {
      vendor_id: 1, // Active vendor ID
      completion_lat: 12.9121,
      completion_lng: 77.6446,
      after_photo_base64: "data:image/jpeg;base64,camera-photo-data"
    };

    try {
      const response = await fetch(`http://127.0.0.1:8000/vendor/jobs/${ticketId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      const data = await response.json();
      
      setIsCameraOpen(false);
      setGeoResult({ match: data.geo_match, distance: data.distance });
      
      setTimeout(() => {
        setGeoResult(null);
        setActiveJob(false);
      }, 3000);
      
    } catch (error) {
      console.error("Failed to complete job", error);
      alert("Error completing job. Please ensure backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col max-w-md mx-auto relative">
      <header className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Pro App</h1>
          <p className="text-sm text-slate-400">Ravi Electrician</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            ONLINE
          </div>
          <button onClick={() => router.push("/")} className="text-slate-400 hover:text-red-400 transition-colors">
            <SignOut size={24} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Today's Earnings</p>
            <p className="text-2xl font-bold text-white">₹1,250</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Jobs Done</p>
            <p className="text-2xl font-bold text-white">3</p>
          </div>
        </div>

        {geoResult && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${geoResult.match ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
            {geoResult.match ? <CheckCircle size={24} className="text-green-400 shrink-0" weight="fill" /> : <Warning size={24} className="text-red-400 shrink-0" weight="fill" />}
            <div>
              <h3 className={`font-bold ${geoResult.match ? 'text-green-400' : 'text-red-400'}`}>
                {geoResult.match ? "Geo-Tag Verified!" : "Location Mismatch!"}
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                {geoResult.match 
                  ? `Location verified within ${Math.round(geoResult.distance || 0)}m of reported issue.` 
                  : `You are ${(geoResult.distance || 0).toFixed(1)}m away from the issue location. A manual review is required.`}
              </p>
            </div>
          </div>
        )}

        {activeJob && !geoResult ? (
          <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-amber-400 p-4 flex justify-between items-start">
              <div>
                <span className="uppercase text-[10px] font-bold tracking-wider text-amber-900 bg-amber-300 px-2 py-0.5 rounded">Current Job</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Electrical Sparking</h2>
              </div>
              <div className="text-right">
                <span className="text-amber-900 font-bold text-xl">₹400</span>
                <p className="text-xs font-medium text-amber-800">Est. payout</p>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="flex gap-4 items-start">
                <div className="mt-1 bg-slate-100 p-2 rounded-full text-slate-500">
                  <MapPin size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Unit 402, Block B</h3>
                  <p className="text-slate-500 text-sm">Sunrise Valley Community</p>
                  <p className="text-slate-500 text-sm mt-1">1.2 km away</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm font-semibold text-slate-700 mb-2">Issue Description</p>
                <p className="text-sm text-slate-600">"Kitchen socket is sparking when I plug in the microwave."</p>
                
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded border border-red-100">
                  <Warning size={16} weight="fill" />
                  HIGH SEVERITY - RESPOND QUICKLY
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 rounded-xl transition-colors">
                  <NavigationArrow size={20} weight="bold" />
                  Navigate
                </button>
                <button 
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-primary-600/30"
                >
                  <Camera size={20} weight="bold" />
                  Finish Job
                </button>
              </div>
            </div>
          </div>
        ) : !activeJob ? (
          <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Clock size={32} weight="duotone" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Waiting for jobs...</h3>
            <p className="text-sm text-slate-400 mb-6">Stay online to receive requests in your area.</p>
            <button 
              onClick={() => setActiveJob(true)}
              className="text-xs font-bold bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Refresh Jobs
            </button>
          </div>
        ) : null}
      </main>

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/80 to-transparent">
            <button onClick={() => setIsCameraOpen(false)} className="p-2 bg-white/20 rounded-full backdrop-blur">
              <X size={24} />
            </button>
            <span className="font-semibold text-sm">Capture Completion Photo</span>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center">
            {/* Viewfinder */}
            <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 flex flex-col items-center">
              <Camera size={48} className="mb-2" />
              <p className="text-center px-8">Point camera at the fixed issue.<br/>Location will be automatically tagged.</p>
            </div>
          </div>

          <div className="bg-black pb-12 pt-6 px-8 flex justify-center">
            <button 
              onClick={handleCompleteJob}
              disabled={isSubmitting}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1"
            >
              <div className={`w-full h-full bg-white rounded-full transition-transform ${isSubmitting ? 'scale-75 opacity-50' : 'active:scale-90'}`}></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
