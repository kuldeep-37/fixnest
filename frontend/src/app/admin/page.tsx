"use client";
import { useState, useEffect } from "react";
import { Buildings, ListChecks, WarningOctagon, MagnifyingGlass, User, ShieldWarning, ShieldCheck, UserPlus, X, SignOut } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("queue");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserUnit, setNewUserUnit] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`User ${newUserName} registered successfully!`);
    setIsRegisterModalOpen(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserUnit("");
    setNewUserPassword("");
  };

  const [tickets, setTickets] = useState<any[]>([]);

  const fetchTickets = () => {
    fetch("http://127.0.0.1:8000/admin/tickets")
      .then(res => res.json())
      .then(data => setTickets(data))
      .catch(err => console.error("Error fetching tickets:", err));
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
  
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !commentText.trim()) return;
    try {
      await fetch(`http://127.0.0.1:8000/tickets/${activeTicketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 3, content: commentText }) // mock admin user_id
      });
      setIsCommentModalOpen(false);
      setCommentText("");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight text-primary-400">FixNest <span className="text-white">Admin</span></h1>
          <p className="text-xs text-slate-400 mt-1">Sunrise Valley Community</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("queue")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "queue" ? "bg-primary-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <ListChecks size={20} />
            Ticket Queue
          </button>
          <button onClick={() => setActiveTab("disputes")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "disputes" ? "bg-primary-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <WarningOctagon size={20} />
            Disputes & Flags
          </button>
          <button onClick={() => setActiveTab("vendors")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "vendors" ? "bg-primary-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            <Buildings size={20} />
            Vendors
          </button>
          <button onClick={() => setIsRegisterModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 text-emerald-400 hover:text-white hover:bg-emerald-600/20 rounded-lg text-sm font-medium transition-colors text-left mt-4 border border-emerald-500/20">
            <UserPlus size={20} />
            Register User
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">Facility Sec.</p>
              <p className="text-xs text-slate-400">Admin</p>
            </div>
          </div>
          <button onClick={() => router.push("/")} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <SignOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">
            {activeTab === "queue" && "Ticket Queue"}
            {activeTab === "disputes" && "Disputes & Flags"}
            {activeTab === "vendors" && "Vendor Management"}
          </h2>
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search tickets, residents..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          {activeTab === "queue" ? (
            <>
              {/* Actionable Metrics */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Needs Review</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">12</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Critical Priority</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">3</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">In Progress</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">8</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">Auto-Approved (24h)</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">24</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 font-medium">
                      <th className="py-3 px-6">Ticket ID</th>
                      <th className="py-3 px-6">Issue & Resident</th>
                      <th className="py-3 px-6">AI Triage</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.map(ticket => (
                      <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-slate-900">
                          TKT-{ticket.id}
                          <p className="text-xs text-slate-400 font-normal mt-1">{new Date(ticket.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-slate-900">{ticket.category}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{ticket.description}</p>
                          <p className="text-xs font-medium text-slate-700 mt-1">Unit: {ticket.unit_no || 'Unknown'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                ticket.triage_result?.severity_tier === 'Critical' ? 'bg-red-100 text-red-700' : 
                                ticket.triage_result?.severity_tier === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {ticket.triage_result?.severity_tier || 'Routine'}
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <ShieldCheck size={14} className="text-green-500" />
                                {Math.round((ticket.triage_result?.category_confidence || 0) * 100)}% match
                              </span>
                            </div>
                            
                            {/* Advanced ML Metrics Box */}
                            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs flex flex-col gap-1 mt-1 w-max">
                               <div className="flex justify-between gap-4">
                                  <span className="text-slate-500">Genuine:</span>
                                  <span className={`font-medium ${ticket.triage_result?.genuineness_pct < 50 ? 'text-red-500 font-bold' : 'text-green-600'}`}>{ticket.triage_result?.genuineness_pct ?? '--'}%</span>
                               </div>
                               <div className="flex justify-between gap-4">
                                  <span className="text-slate-500">Keyword Match:</span>
                                  <span className="font-medium text-slate-700">{ticket.triage_result?.category_match_pct ?? '--'}%</span>
                               </div>
                               <div className="flex justify-between gap-4">
                                  <span className="text-slate-500">Duplicate:</span>
                                  <span className={`font-medium ${ticket.triage_result?.duplicate_match_pct > 80 ? 'text-amber-600 font-bold' : 'text-slate-700'}`}>{ticket.triage_result?.duplicate_match_pct ?? 0}%</span>
                               </div>
                            </div>

                            {ticket.triage_result?.duplicate_flag && (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-max">
                                <ShieldWarning size={12} />
                                Duplicate of TKT-{ticket.triage_result?.duplicate_of_ticket_id}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            ticket.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' : 
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col gap-2 items-end">
                            {ticket.status === 'Pending' ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleUpdateStatus(ticket.id, 'Invalid')} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50">Reject</button>
                                <button onClick={() => handleUpdateStatus(ticket.id, 'Approved')} className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700">Approve</button>
                              </div>
                            ) : ticket.status === 'Approved' ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleUpdateStatus(ticket.id, 'In Progress')} className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700">Assign Vendor</button>
                                <button onClick={() => handleUpdateStatus(ticket.id, 'Closed')} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50">Close</button>
                              </div>
                            ) : (
                              <button onClick={() => handleUpdateStatus(ticket.id, 'Closed')} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50">Close</button>
                            )}
                            <button 
                              onClick={() => { setActiveTicketId(ticket.id); setIsCommentModalOpen(true); }}
                              className="text-xs font-medium text-primary-600 hover:text-primary-700"
                            >
                              Add Comment
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <ListChecks size={32} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-700">Coming Soon</h3>
              <p className="text-sm text-center max-w-sm mt-1">
                The {activeTab} section is currently under development and will be available in the next release.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Register User Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="text-primary-600" /> Register New User
              </h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} weight="bold" />
              </button>
            </div>
            <form onSubmit={handleRegisterUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input required type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. john@society.in" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit Number</label>
                <input required type="text" value={newUserUnit} onChange={e => setNewUserUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. 101-A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                <input required type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Set a password for the user" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm">Register User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add Admin Comment</h3>
              <button onClick={() => setIsCommentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} weight="bold" />
              </button>
            </div>
            <form onSubmit={handleAddComment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
                <textarea 
                  required 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]" 
                  placeholder="Enter a public update for the resident..." 
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCommentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm">Post Comment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
