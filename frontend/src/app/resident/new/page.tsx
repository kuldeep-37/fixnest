"use client";

import { useState, useRef } from "react";
import { Camera, MapPin, CaretLeft, Lightning, Drop, Broom, DotsThree, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const categories = [
  { id: "electrical", name: "Electrical", icon: Lightning, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "plumbing", name: "Plumbing", icon: Drop, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "cleaning", name: "Cleaning", icon: Broom, color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "other", name: "Other", icon: DotsThree, color: "text-slate-500", bg: "bg-slate-100" },
];

export default function NewTicket() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [geoTag, setGeoTag] = useState<{lat: number, lng: number} | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [matchPct, setMatchPct] = useState<number | null>(null);
  const [duplicatePct, setDuplicatePct] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureGeo = () => {
    setGeoLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoTag({ lat: position.coords.latitude, lng: position.coords.longitude });
          setGeoLoading(false);
        },
        (error) => {
          console.error(error);
          setGeoLoading(false);
          alert("Could not capture location. Please allow location access.");
        }
      );
    } else {
      setGeoLoading(false);
      alert("Geolocation is not supported by your browser");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result as string;
        setPhotoBase64(b64);
        verifyMatch(b64, description);
      };
      reader.readAsDataURL(file);
      
      // Auto-capture geo on photo upload if not already captured
      if (!geoTag) {
        handleCaptureGeo();
      }
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDescription(text);
    if (photoBase64 && text.length > 5) {
      verifyMatch(photoBase64, text);
    }
  };

  const verifyMatch = async (b64: string, text: string) => {
    if (!b64 || !text || text.length < 5) return;
    setIsVerifying(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/verify-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_base64: b64, description: text })
      });
      const data = await res.json();
      setMatchPct(data.match_percentage);
      setDuplicatePct(data.duplicate_match_pct);
    } catch (err) {
      console.error("Verification failed", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !photoPreview || !description.trim()) {
      alert("Please fill all mandatory fields.");
      return;
    }
    
    try {
      const res = await fetch("http://127.0.0.1:8000/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident_id: 1, // Mock resident ID
          community_id: 1, // Mock community ID
          category: categories.find(c => c.id === selectedCategory)?.name || "Other",
          description: description,
          photo_base64: photoBase64,
          intake_lat: geoTag?.lat,
          intake_lng: geoTag?.lng,
          unit_no: "402-B" // Mock unit
        })
      });
      
      if (res.ok) {
        alert("Ticket submitted successfully!");
        router.push("/resident");
      } else {
        alert("Failed to submit ticket.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col">
      <header className="px-4 py-4 sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/resident" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100">
            <CaretLeft weight="bold" size={20} />
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Raise Ticket</h1>
        </div>
        <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-xs font-bold border border-slate-200 shadow-inner flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          ID: HSR-402B
        </div>
      </header>

      <main className="flex-1 px-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Category Selection */}
          <section>
            <label className="block text-sm font-semibold text-slate-700 mb-3">What's the issue?</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedCategory === cat.id 
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat.bg} ${cat.color}`}>
                    <cat.icon weight="fill" size={20} />
                  </div>
                  <span className="font-medium text-sm text-slate-800">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Photo Upload */}
          <section>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Add a photo</label>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handlePhotoUpload}
            />
            
            {photoPreview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 text-xs backdrop-blur-md"
                >
                  Retake
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-500 transition-colors"
              >
                <Camera size={32} weight="duotone" className="text-slate-400" />
                <span className="text-sm font-medium">Tap to take photo</span>
              </button>
            )}
          </section>

          {/* Geo Tag (Auto) */}
          <section>
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${geoTag ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  <MapPin weight={geoTag ? "fill" : "regular"} size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Location Tag</p>
                  <p className="text-xs text-slate-500">
                    {geoTag ? `Captured: ${geoTag.lat.toFixed(4)}, ${geoTag.lng.toFixed(4)}` : 'Required for verification'}
                  </p>
                </div>
              </div>
              {!geoTag && (
                <button 
                  type="button"
                  onClick={handleCaptureGeo}
                  disabled={geoLoading}
                  className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full"
                >
                  {geoLoading ? 'Finding...' : 'Capture'}
                </button>
              )}
            </div>
          </section>

          {/* Description */}
          <section>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Description <span className="text-red-500">*</span></label>
            <textarea
              required
              value={description}
              onChange={handleDescriptionChange}
              placeholder="e.g. The tap has been leaking since yesterday..."
              className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none h-24 text-sm"
            ></textarea>
            
            {/* AI Verification Match */}
            {(photoBase64 && description.length > 5) && (
              <div className="mt-3 flex flex-col gap-2">
                <div className={`p-3 rounded-lg border flex justify-between items-center ${matchPct && matchPct > 50 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2">
                    <Lightning weight="fill" className={matchPct && matchPct > 50 ? "text-green-500" : "text-amber-500"} />
                    <span className="text-xs font-medium text-slate-700">AI Photo & Text Match</span>
                  </div>
                  {isVerifying ? (
                    <span className="text-xs font-semibold text-slate-500 animate-pulse">Analyzing...</span>
                  ) : (
                    <span className={`text-sm font-bold ${matchPct && matchPct > 50 ? "text-green-700" : "text-amber-700"}`}>
                      {matchPct ?? 0}%
                    </span>
                  )}
                </div>
                
                <div className={`p-3 rounded-lg border flex justify-between items-center ${duplicatePct && duplicatePct > 80 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <WarningCircle weight="fill" className={duplicatePct && duplicatePct > 80 ? "text-red-500" : "text-slate-500"} />
                    <span className="text-xs font-medium text-slate-700">Problem Match with Existing Tickets</span>
                  </div>
                  {isVerifying ? (
                    <span className="text-xs font-semibold text-slate-500 animate-pulse">Analyzing...</span>
                  ) : (
                    <span className={`text-sm font-bold ${duplicatePct && duplicatePct > 80 ? "text-red-700" : "text-slate-700"}`}>
                      {duplicatePct ?? 0}%
                    </span>
                  )}
                </div>
                {duplicatePct && duplicatePct > 80 && (
                  <p className="text-[10px] text-red-600 font-medium px-1">Warning: A very similar problem was recently reported in this community.</p>
                )}
              </div>
            )}
          </section>

        </form>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto pb-8">
        <button
          onClick={handleSubmit}
          disabled={!selectedCategory || !photoPreview || !geoTag || !description.trim()}
          className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
        >
          Submit Ticket
        </button>
      </div>
    </div>
  );
}
