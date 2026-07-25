"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, Wrench, WarningCircle, CheckCircle, SignOut, 
  House, ListBullets, BellRinging, Gear, Star, X, Info
} from "@phosphor-icons/react";

// Types
type Ticket = {
  id: number;
  category: string;
  description: string;
  status: string;
  created_at: string;
  triage_result?: {
    severity_tier: string;
    classification: string;
    reason: string;
  };
  comments?: {
    id: number;
    content: string;
    created_at: string;
  }[];
};

export default function ResidentDashboard() {
  const router = useRouter();
  
  // State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  
  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active session resident
  const residentId = 1;

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/resident/${residentId}/tickets`);
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    
    // Set up SSE connection
    const eventSource = new EventSource("http://127.0.0.1:8000/stream");
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "ticket_created" || data.event === "ticket_updated") {
          fetchTickets(); // Refresh list on any change
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };
    
    return () => {
      eventSource.close();
    };
  }, []);

  const handleOpenFeedback = (ticketId: number) => {
    setActiveTicketId(ticketId);
    setRating(0);
    setComment("");
    setIsFeedbackOpen(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await fetch(`http://127.0.0.1:8000/tickets/${activeTicketId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident_id: residentId,
          stars: rating,
          comment: comment
        })
      });
      
      setIsFeedbackOpen(false);
      // Refresh tickets to show updated status (Closed or Reopened)
      fetchTickets();
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback. Ensure backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Submitted", "Progress", "Completed", "Feedback"];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-primary-400">FixNest</h1>
          <p className="text-xs text-slate-400 mt-1">Sunrise Valley Community</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "dashboard" ? "bg-primary-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <House size={20} />
            My Dashboard
          </button>
          <button onClick={() => setActiveTab("tickets")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "tickets" ? "bg-primary-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <ListBullets size={20} />
            My Requests
          </button>
          <button onClick={() => setActiveTab("notices")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "notices" ? "bg-primary-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <BellRinging size={20} />
            Noticeboard
          </button>
          <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "settings" ? "bg-primary-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <Gear size={20} />
            Settings
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold">
              A
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Alex</p>
              <p className="text-xs text-slate-400">Unit 402-B</p>
            </div>
          </div>
          <button onClick={() => router.push("/")} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <SignOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">
            {activeTab === "tickets" ? "My Requests" : activeTab}
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-sm font-bold border border-slate-200 shadow-inner flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              ID: HSR-402B
            </div>
            <Link 
              href="/resident/new"
              className="flex items-center gap-2 bg-primary-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus weight="bold" />
              Raise Ticket
            </Link>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          {activeTab === "dashboard" || activeTab === "tickets" ? (
            <div className="max-w-5xl mx-auto space-y-8">
              
              {/* Dashboard Stats */}
              {activeTab === "dashboard" && (
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-primary-100 font-medium text-sm">Active Requests</p>
                      <h3 className="text-4xl font-bold mt-2">{tickets.filter(t => t.status !== 'Closed').length}</h3>
                    </div>
                    <Wrench className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" weight="duotone" />
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                    <p className="text-slate-500 font-medium text-sm">Resolved This Year</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{tickets.filter(t => t.status === 'Closed').length}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                    <p className="text-slate-500 font-medium text-sm">Next Maintenance Dues</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">₹4,500</h3>
                    <p className="text-xs text-emerald-600 font-medium mt-1">Due in 14 days</p>
                  </div>
                </div>
              )}

              {/* Ticket List */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {activeTab === "dashboard" ? "Recent Requests" : "All Requests"}
                </h3>
                
                {isLoading ? (
                  <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900">All clear!</h4>
                    <p className="text-slate-500 mt-1">You don't have any maintenance requests.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {tickets.map((ticket) => {
                      let currentStepIndex = 0;
                      if (ticket.status === "In Progress" || ticket.status === "Vendor Assigned") currentStepIndex = 1;
                      else if (ticket.status === "Completed") currentStepIndex = 2;
                      else if (ticket.status === "Closed" || ticket.status === "Reopened") currentStepIndex = 3;

                      const severity = ticket.triage_result?.severity_tier || "Routine";

                      return (
                        <div key={ticket.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4 items-start">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                ticket.status === 'Closed' ? 'bg-green-100 text-green-600' : 
                                ticket.status === 'Completed' ? 'bg-blue-100 text-blue-600' :
                                ticket.status === 'Reopened' ? 'bg-red-100 text-red-600' :
                                'bg-amber-100 text-amber-600'
                              }`}>
                                {ticket.status === 'Closed' ? <CheckCircle weight="fill" size={28} /> : 
                                 ticket.status === 'Reopened' ? <WarningCircle weight="fill" size={28} /> : 
                                 <Wrench weight="fill" size={28} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="font-bold text-slate-900 text-lg">TKT-{ticket.id}: {ticket.category} Issue</h3>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                    ticket.status === 'Closed' ? 'bg-green-50 text-green-700 border border-green-200' : 
                                    ticket.status === 'Completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    ticket.status === 'Reopened' ? 'bg-red-50 text-red-700 border border-red-200' :
                                    'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {ticket.status}
                                  </span>
                                  {ticket.triage_result?.classification && (
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                      ticket.triage_result.classification === 'Genuine' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      ticket.triage_result.classification === 'Duplicate' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                      'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                      AI: {ticket.triage_result.classification}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>
                                
                                {ticket.triage_result?.reason && (
                                  <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-200 flex items-start gap-2">
                                    <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-slate-600">{ticket.triage_result.reason}</p>
                                  </div>
                                )}
                                
                                {ticket.comments && ticket.comments.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    <p className="text-xs font-bold text-slate-700">Admin Comments:</p>
                                    {ticket.comments.map(c => (
                                      <div key={c.id} className="bg-blue-50/50 p-2 rounded border border-blue-100 text-sm text-slate-700">
                                        "{c.content}"
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right flex flex-col items-end">
                              <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-2">
                                <span>Reported: {new Date(ticket.created_at).toLocaleDateString()}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className={severity === 'Critical' ? 'text-red-600' : ''}>{severity} Priority</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-4 relative max-w-2xl">
                            <div className="absolute top-2 left-6 right-6 h-1 bg-slate-100 z-0 rounded"></div>
                            <div 
                              className="absolute top-2 left-6 h-1 bg-primary-500 z-0 transition-all duration-1000 ease-out rounded"
                              style={{ width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 3rem)` }}
                            ></div>
                            
                            <div className="flex justify-between relative z-10">
                              {steps.map((step, idx) => (
                                <div key={step} className="flex flex-col items-center gap-2 w-1/4">
                                  <div className={`w-5 h-5 rounded-full border-[3px] bg-white transition-colors duration-500 ${
                                    idx <= currentStepIndex ? 'border-primary-500' : 'border-slate-200'
                                  }`}>
                                    {idx <= currentStepIndex && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full m-0.5"></div>}
                                  </div>
                                  <span className={`text-[11px] font-semibold text-center ${idx <= currentStepIndex ? 'text-slate-900' : 'text-slate-400'}`}>
                                    {step}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {ticket.status === "Completed" && (
                            <div className="mt-2 pt-4 border-t border-slate-100">
                              <div className="bg-primary-50 p-4 rounded-xl flex justify-between items-center border border-primary-100">
                                <div className="flex gap-3 items-center">
                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 shadow-sm">
                                    <Star weight="fill" size={20} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-primary-900 text-sm">Job Finished!</h4>
                                    <p className="text-xs text-primary-700">Please confirm resolution and rate the vendor.</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleOpenFeedback(ticket.id)}
                                  className="px-5 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                >
                                  Rate & Provide Feedback
                                </button>
                              </div>
                            </div>
                          )}

                          {ticket.status === "Reopened" && (
                            <div className="mt-2 pt-4 border-t border-slate-100">
                              <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                <Info size={18} weight="bold" />
                                This ticket has been automatically reopened due to poor rating and escalated to admin.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <Info size={32} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-700">Coming Soon</h3>
              <p className="text-sm text-center max-w-sm mt-1">
                The {activeTab} section is currently under development.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Rate Resolution
              </h3>
              <button onClick={() => setIsFeedbackOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} weight="bold" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitFeedback} className="p-6">
              <p className="text-slate-600 text-sm mb-6 text-center">
                How satisfied are you with the resolution of Ticket #{activeTicketId}?
              </p>
              
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star 
                      size={40} 
                      weight={star <= rating ? "fill" : "regular"} 
                      className={star <= rating ? "text-amber-400" : "text-slate-300"}
                    />
                  </button>
                ))}
              </div>

              {rating > 0 && rating <= 2 && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 flex items-start gap-2">
                  <WarningCircle size={20} className="shrink-0 mt-0.5" weight="fill" />
                  <p>A rating of 2 stars or lower will automatically reopen this ticket for admin review.</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Comments (Optional)</label>
                <textarea 
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none text-sm" 
                  placeholder="Tell us what went well or what could be improved..." 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={rating === 0 || isSubmitting}
                className="w-full py-3 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-md shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
