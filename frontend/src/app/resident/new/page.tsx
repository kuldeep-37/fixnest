"use client";

import { useState, useRef } from "react";
import { Camera, MapPin, CaretLeft, Lightning, Drop, Broom, DotsThree } from "@phosphor-icons/react";
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
      
      // Auto-capture geo on photo upload if not already captured
      if (!geoTag) {
        handleCaptureGeo();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !photoPreview) {
      alert("Please select a category and upload a photo.");
      return;
    }
    // Implement API call here
    console.log({ selectedCategory, description, geoTag });
    router.push("/resident");
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col">
      <header className="px-4 py-4 sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 flex items-center gap-4">
        <Link href="/resident" className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100">
          <CaretLeft weight="bold" size={20} />
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Raise Ticket</h1>
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
            <label className="block text-sm font-semibold text-slate-700 mb-3">Additional details (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. The tap has been leaking since yesterday..."
              className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none h-24 text-sm"
            ></textarea>
          </section>

        </form>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto pb-8">
        <button
          onClick={handleSubmit}
          disabled={!selectedCategory || !photoPreview || !geoTag}
          className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
        >
          Submit Ticket
        </button>
      </div>
    </div>
  );
}
