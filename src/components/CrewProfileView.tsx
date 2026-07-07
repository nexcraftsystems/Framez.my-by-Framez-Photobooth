import React, { useState } from "react";
import { CrewLead, Role } from "../types";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  ShieldAlert, 
  Upload, 
  CheckCircle, 
  Users, 
  CreditCard,
  UserCheck,
  Shield,
  Trash2
} from "lucide-react";

interface CrewProfileViewProps {
  profile: CrewLead;
  onUpdateCrewLeads: React.Dispatch<React.SetStateAction<CrewLead[]>>;
  role: Role;
  onAddAuditLog: (actor: string, action: string, severity: "info" | "warning" | "alert") => void;
  allCrewList: CrewLead[];
}

export default function CrewProfileView({
  profile,
  onUpdateCrewLeads,
  role,
  onAddAuditLog,
  allCrewList,
}: CrewProfileViewProps) {
  const isDeveloper = role === "DEVELOPER";

  // Self customization form fields
  const [name, setName] = useState(profile?.name || "");
  const [gender, setGender] = useState<CrewLead["gender"]>(profile?.gender || "Male");
  const [coverArea, setCoverArea] = useState(profile?.coverArea || "Selangor / Kuala Lumpur");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [gmailAccount, setGmailAccount] = useState(profile?.gmailAccount || "");
  const [bankName, setBankName] = useState(profile?.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(profile?.bankAccountNumber || "");
  const [bankAccountHolder, setBankAccountHolder] = useState(profile?.bankAccountHolder || "");
  
  // Stats
  const [completedJobsCount, setCompletedJobsCount] = useState(profile?.completedJobsCount || 0);
  const [totalIncome, setTotalIncome] = useState(profile?.totalIncome || 0);

  // Avatar simulated upload
  const [avatarPreview, setAvatarPreview] = useState<string>(
    profile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80"
  );
  const [isUploading, setIsUploading] = useState(false);

  // Developer specific: selected crew to configure role
  const [selectedCrewId, setSelectedCrewId] = useState<string>(profile?.id || allCrewList[0]?.id || "");
  const selectedCrewToConfigure = allCrewList.find(c => c.id === selectedCrewId) || profile;
  const [targetAccountRole, setTargetAccountRole] = useState<Role>(selectedCrewToConfigure?.accountRole || "CREW");

  // Save changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateCrewLeads((prev) =>
      prev.map((c) => {
        if (c.id === profile.id) {
          return {
            ...c,
            name: name.trim(),
            gender,
            coverArea: coverArea.trim(),
            phone: phone.trim(),
            gmailAccount: gmailAccount.trim(),
            bankName: bankName.trim(),
            bankAccountNumber: bankAccountNumber.trim(),
            bankAccountHolder: bankAccountHolder.trim(),
            completedJobsCount,
            totalIncome,
            avatarUrl: avatarPreview,
          };
        }
        return c;
      })
    );

    onAddAuditLog(
      name,
      `Updated their coordinator profile details and coordinates.`,
      "info"
    );

    alert("✨ Your coordinator profile has been successfully updated!");
  };

  // Simulate file upload
  const handleSimulateAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setTimeout(() => {
          setAvatarPreview(reader.result as string);
          setIsUploading(false);
          alert("📸 Profile picture uploaded and cropped successfully!");
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };

  // Developer Only: Configure role
  const handleDeveloperSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCrewLeads((prev) =>
      prev.map((c) => {
        if (c.id === selectedCrewId) {
          return {
            ...c,
            accountRole: targetAccountRole,
          };
        }
        return c;
      })
    );

    onAddAuditLog(
      "Developer Superuser",
      `Upgraded/Modified system credentials for ${selectedCrewToConfigure.name} to role: ${targetAccountRole}`,
      "alert"
    );

    alert(`🔑 Role successfully updated! ${selectedCrewToConfigure.name} is now registered as ${targetAccountRole}.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-white relative z-10">
      
      {/* Visual Identity ID Badge - Left side */}
      <div className="lg:col-span-4 flex flex-col items-center">
        <div className="w-full bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/10 rounded-[2rem] p-6 text-center space-y-6 relative overflow-hidden shadow-2xl">
          {/* Subtle glow accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#a1c398] to-transparent" />
          
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black text-[#a1c398] uppercase tracking-widest bg-[#799351]/10 px-3 py-1 rounded-full border border-[#799351]/20">
              Coordinator ID Card
            </span>
            <p className="text-[10px] text-gray-500 font-mono font-bold mt-1">FRAMEZ LOGISTICS SECURE PROT</p>
          </div>

          {/* Avatar Area with dynamic hover overlay */}
          <div className="relative group w-32 h-32 rounded-full mx-auto overflow-hidden border-4 border-white/10 shadow-xl bg-black/60">
            <img 
              src={avatarPreview} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              alt="Avatar"
              referrerPolicy="no-referrer"
            />
            
            {/* Interactive Upload Overlay */}
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Upload className="w-5 h-5 text-[#a1c398] animate-bounce" />
              <span className="text-[9px] font-bold font-mono uppercase text-gray-300 mt-1">Change photo</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleSimulateAvatarUpload}
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase animate-pulse">Uploading...</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold font-display uppercase tracking-wider text-white">
              {name || "Untitled Coordinator"}
            </h4>
            <span className="text-xs text-[#a1c398] font-mono uppercase bg-[#799351]/10 px-2 py-0.5 rounded border border-[#799351]/10">
              {profile?.role || "Field Operator"}
            </span>
          </div>

          {/* Tabular ID stats */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-left space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-white/5 pb-1.5 text-[10px] text-gray-400">
              <span>ACC NUMBER</span>
              <span className="text-white font-bold">{bankAccountNumber || "NOT SET"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1.5 text-[10px] text-gray-400">
              <span>COVER AREA</span>
              <span className="text-white font-bold text-right max-w-[120px] truncate">{coverArea}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>ASSIGNED JOBS</span>
              <span className="text-[#a1c398] font-bold">{completedJobsCount} JOBS</span>
            </div>
          </div>

          <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[9px] font-mono text-gray-500 uppercase block">Total Income Payouts</span>
              <span className="text-lg font-mono font-bold text-[#a1c398]">RM {totalIncome}</span>
            </div>
            <DollarSign className="w-8 h-8 text-[#799351]/30 shrink-0" />
          </div>
        </div>
      </div>

      {/* Profile Modification Form - Middle section */}
      <div className="lg:col-span-5 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6">
        <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white border-b border-white/5 pb-3">
          ⚙️ Self-Customization Coordinates
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Coordinator Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Gender Identity</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Cover Area Hub</label>
              <input
                type="text"
                required
                value={coverArea}
                onChange={(e) => setCoverArea(e.target.value)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Gmail Address</label>
              <input
                type="email"
                required
                value={gmailAccount}
                onChange={(e) => setGmailAccount(e.target.value)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Bank Institution</label>
              <input
                type="text"
                required
                placeholder="e.g. Maybank / CIMB"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Bank Account Number</label>
              <input
                type="text"
                required
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Account Holder Name</label>
              <input
                type="text"
                required
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Total Assigned Jobs (Simulation)</label>
              <input
                type="number"
                min="0"
                value={completedJobsCount}
                onChange={(e) => setCompletedJobsCount(parseInt(e.target.value) || 0)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Total Earned Income (RM)</label>
              <input
                type="number"
                min="0"
                value={totalIncome}
                onChange={(e) => setTotalIncome(parseInt(e.target.value) || 0)}
                className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#799351] hover:bg-[#5f743e] text-white font-bold text-xs uppercase font-mono tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            Apply Profile Adjustments
          </button>
        </form>
      </div>

      {/* Developer Role Credentials setting - Right section */}
      <div className="lg:col-span-3">
        {isDeveloper ? (
          <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 text-amber-500">
              <Shield className="w-5 h-5" />
              <h3 className="text-xs font-bold font-display uppercase tracking-wider">
                Developer Credentials Override
              </h3>
            </div>

            <p className="text-[11px] text-gray-400 font-light leading-relaxed">
              As Developer Admin, you hold secure credentials to elevate or downgrade role clearances.
            </p>

            <form onSubmit={handleDeveloperSaveRole} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Select Staff Member</label>
                <select
                  value={selectedCrewId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedCrewId(id);
                    const crewMatch = allCrewList.find(c => c.id === id);
                    if (crewMatch) setTargetAccountRole(crewMatch.accountRole || "CREW");
                  }}
                  className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                >
                  {allCrewList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono text-gray-400 uppercase">System Clearance Role</label>
                <select
                  value={targetAccountRole}
                  onChange={(e) => setTargetAccountRole(e.target.value as any)}
                  className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="CREW">Coordinator Crew</option>
                  <option value="OWNER">Founder Owner</option>
                  <option value="DEVELOPER">Superuser Developer</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Override Role
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md text-center space-y-4">
            <ShieldAlert className="w-10 h-10 text-gray-600 mx-auto" />
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white">Security Protocol Locked</h4>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Modifying system access Roles is restricted solely to the **Developer Admin**. Owners/Crew cannot escalate account roles.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
