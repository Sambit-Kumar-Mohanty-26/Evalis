"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2, Building2, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardWizard() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [aisheCode, setAisheCode] = useState("");
  const [institutionData, setInstitutionData] = useState<any>(null);
  
  const [adminData, setAdminData] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [otp, setOtp] = useState("");
  const [preAuthToken, setPreAuthToken] = useState("");

  // Step 4 State: The Quick Blueprint
  const [programs, setPrograms] = useState([
    { name: "B.Tech", durationYears: 4, branchesInput: "Computer Science, Mechanical" }
  ]);

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  // --- STEP 1: AISHE LOOKUP ---
  const handleAisheLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`http://localhost:3001/api/v1/institutions/lookup?code=${aisheCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setInstitutionData(data.data);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Institution not found.");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: SEND OTP ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost:3001/api/v1/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminData.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: VERIFY OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost:3001/api/v1/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminData.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setPreAuthToken(data.preAuthToken);
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 4: SUBMIT MASSIVE TRANSACTION ---
  const handleCompleteSetup = async () => {
    setLoading(true); setError("");
    
    try {
      // 1. Auto-generate the massive nested JSON structure dynamically
      const academicStructure = programs.map(prog => {
        const semesterCount = prog.durationYears * 2;
        const branchNames = prog.branchesInput.split(",").map(b => b.trim()).filter(b => b.length > 0);
        
        return {
          name: prog.name,
          durationYears: prog.durationYears,
          branches: branchNames.map(bName => ({
            name: bName,
            // Auto-generate semesters (1 through N) with an empty subjects array to start
            semesters: Array.from({ length: semesterCount }, (_, i) => ({
              semesterNumber: i + 1,
              subjects:[] 
            }))
          }))
        };
      });

      // 2. Call our Enterprise Onboarding Route!
      const payload = {
        idempotencyKey: crypto.randomUUID(), // Prevents double-clicks natively!
        preAuthToken,
        institutionDetails: {
          aisheCode: institutionData.aishe_code,
          customName: institutionData.institution_name
        },
        adminDetails: adminData,
        academicStructure
      };

      const res = await fetch("http://localhost:3001/api/v1/auth/onboard", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // BOOM! SUCCESS!
      setStep(5);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#F4F2EB] flex flex-col items-center py-12 px-4 md:px-6 overflow-x-hidden">
      
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-10 md:mb-16">
        <Link href="/" className="font-serif text-2xl md:text-3xl text-[#2C2A26] tracking-tight">
          evalis<span className="text-[#FFB3D9]">.</span>
        </Link>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((dot) => (
            <div key={dot} className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${step >= dot ? 'w-6 md:w-8 bg-[#84A942]' : 'w-2 bg-[#2C2A26]/10'}`} />
          ))}
        </div>
      </div>

      {/* The Wizard Container */}
      <div className="w-full max-w-xl relative bg-white p-6 md:p-10 rounded-xl shadow-2xl border border-black/5 overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: AISHE LOOKUP */}
          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
              <div className="w-12 h-12 bg-[#84A942]/10 rounded-full flex items-center justify-center mb-6 text-[#84A942]">
                <Building2 size={24} />
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-[#2C2A26] mb-2">Find your Institution</h2>
              <p className="text-[#2C2A26]/60 mb-8 text-sm md:text-base">Enter your official AISHE code to link your workspace.</p>
              
              <form onSubmit={handleAisheLookup}>
                <input 
                  type="text" required placeholder="e.g., U-0001"
                  value={aisheCode} onChange={(e) => setAisheCode(e.target.value)}
                  className="w-full bg-[#F4F2EB] border border-black/10 rounded-md py-3 md:py-4 px-4 text-base md:text-lg focus:outline-none focus:border-[#84A942] uppercase tracking-wide mb-4"
                />
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-3.5 md:py-4 rounded-md bg-[#2C2A26] text-[#F4F2EB] flex items-center justify-center gap-2 hover:bg-black transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : <>Search Directory <ArrowRight size={18} /></>}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: ADMIN DETAILS */}
          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
              <div className="bg-[#84A942]/10 p-4 rounded-lg border border-[#84A942]/20 mb-8 flex items-start gap-4">
                <CheckCircle2 className="text-[#84A942] flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-bold text-[#2C2A26] text-sm md:text-base">{institutionData?.institution_name}</h4>
                  <p className="text-xs md:text-sm text-[#2C2A26]/60">{institutionData?.district}, {institutionData?.state}</p>
                </div>
              </div>

              <h2 className="font-serif text-2xl md:text-3xl text-[#2C2A26] mb-6">Create Admin Account</h2>
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <input type="text" required placeholder="Full Name" value={adminData.fullName} onChange={(e) => setAdminData({...adminData, fullName: e.target.value})} className="w-full bg-[#F4F2EB] border border-black/10 rounded-md py-3 px-4 focus:outline-none focus:border-[#84A942]" />
                <input type="email" required placeholder="Official Email" value={adminData.email} onChange={(e) => setAdminData({...adminData, email: e.target.value})} className="w-full bg-[#F4F2EB] border border-black/10 rounded-md py-3 px-4 focus:outline-none focus:border-[#84A942]" />
                <input type="password" required placeholder="Secure Password" value={adminData.password} onChange={(e) => setAdminData({...adminData, password: e.target.value})} className="w-full bg-[#F4F2EB] border border-black/10 rounded-md py-3 px-4 focus:outline-none focus:border-[#84A942]" />
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="w-full mt-2 py-3.5 md:py-4 rounded-md bg-[#2C2A26] text-white flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : "Send Verification Code"}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: OTP VERIFICATION */}
          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
              <h2 className="font-serif text-3xl text-[#2C2A26] mb-2">Check your email</h2>
              <p className="text-[#2C2A26]/60 mb-8 text-sm md:text-base">We sent a 6-digit code to <strong>{adminData.email}</strong>.</p>
              
              <form onSubmit={handleVerifyOtp}>
                <input 
                  type="text" required placeholder="000000" maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#F4F2EB] border border-black/10 rounded-md py-4 px-4 text-2xl md:text-3xl text-center tracking-[0.5em] md:tracking-[1em] focus:outline-none focus:border-[#84A942] mb-6"
                />
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-3.5 md:py-4 rounded-md bg-[#84A942] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#6c8b36] transition-all shadow-lg shadow-[#84A942]/20">
                  {loading ? <Loader2 className="animate-spin" /> : "Verify & Continue"}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 4: DYNAMIC ACADEMIC BLUEPRINT */}
          {step === 4 && (
            <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#84A942]/10 rounded-full flex items-center justify-center text-[#84A942]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="font-serif text-2xl text-[#2C2A26]">Curriculum Blueprint</h2>
                  <p className="text-[#2C2A26]/60 text-xs md:text-sm">We'll auto-generate your semesters automatically.</p>
                </div>
              </div>

              <div className="flex flex-col gap-6 max-h-[50vh] overflow-y-auto pr-2">
                {programs.map((prog, index) => (
                  <div key={index} className="p-4 md:p-5 bg-[#F4F2EB] rounded-lg border border-black/5 relative">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-bold text-[#2C2A26]/50 uppercase tracking-wider mb-1 block">Program Name</label>
                        <input type="text" value={prog.name} onChange={(e) => { const newP = [...programs]; newP[index].name = e.target.value; setPrograms(newP); }} className="w-full bg-white border border-black/10 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-[#84A942]" placeholder="e.g. B.Tech" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#2C2A26]/50 uppercase tracking-wider mb-1 block">Duration (Years)</label>
                        <select value={prog.durationYears} onChange={(e) => { const newP = [...programs]; newP[index].durationYears = parseInt(e.target.value); setPrograms(newP); }} className="w-full bg-white border border-black/10 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-[#84A942]">
                          {[1, 2, 3, 4, 5].map(yr => <option key={yr} value={yr}>{yr} Year{yr>1?'s':''}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#2C2A26]/50 uppercase tracking-wider mb-1 block">Branches (Comma separated)</label>
                      <input type="text" value={prog.branchesInput} onChange={(e) => { const newP = [...programs]; newP[index].branchesInput = e.target.value; setPrograms(newP); }} className="w-full bg-white border border-black/10 rounded-md py-2 px-3 text-sm focus:outline-none focus:border-[#84A942]" placeholder="e.g. Computer Science, Mechanical" />
                    </div>
                  </div>
                ))}

                <button onClick={() => setPrograms([...programs, { name: "", durationYears: 3, branchesInput: "" }])} className="text-[#84A942] font-semibold text-sm flex items-center justify-center gap-1 hover:text-[#6c8b36] py-2 border-2 border-dashed border-[#84A942]/30 rounded-lg">
                  <Plus size={16} /> Add Another Program
                </button>
              </div>
              
              {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
              
              <button onClick={handleCompleteSetup} disabled={loading} className="w-full mt-6 py-4 rounded-md bg-[#2C2A26] text-white font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl">
                {loading ? <Loader2 className="animate-spin" /> : "Complete Setup & Launch"}
              </button>
            </motion.div>
          )}

          {/* STEP 5: SUCCESS CELEBRATION */}
          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="w-24 h-24 bg-[#84A942] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(132,169,66,0.4)]">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-[#2C2A26] mb-4">Workspace Created!</h2>
              <p className="text-[#2C2A26]/60 mb-8 max-w-sm mx-auto">
                Welcome to Evalis. Your tenant, admin account, and academic structures are now live and secured.
              </p>
              <button onClick={() => router.push('/login')} className="w-full py-4 rounded-md bg-[#2C2A26] text-[#F4F2EB] font-bold text-lg hover:scale-105 transition-transform">
                Go to Login
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}