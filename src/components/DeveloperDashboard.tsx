import { Booking, HardwareItem, SystemAuditLog } from "../types";
import { Shield, Sparkles, Terminal, RefreshCw, Layers } from "lucide-react";

interface DeveloperDashboardProps {
  bookingsList: Booking[];
  hardwareList: HardwareItem[];
  auditLogs: SystemAuditLog[];
  onResetDatabase: () => void;
  onSimulateInboundInquiry: () => void;
}

export default function DeveloperDashboard({
  bookingsList,
  hardwareList,
  auditLogs,
  onResetDatabase,
  onSimulateInboundInquiry,
}: DeveloperDashboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-white relative z-10">
      
      {/* Sandbox Controls Column */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="glass-card rounded-2xl p-6 border-[#799351]/20">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[#a1c398]" />
            <h3 className="text-base font-bold font-display uppercase tracking-wider">
              Developer Sandbox Controls
            </h3>
          </div>

          <p className="text-xs text-gray-300 font-light leading-relaxed mb-4">
            Simulate advanced state changes instantly inside the Framez.my local session database. Perfect for testing alerts and thresholds.
          </p>

          <div className="space-y-3">
            <button
              onClick={onSimulateInboundInquiry}
              className="w-full py-2.5 bg-[#799351]/10 hover:bg-[#799351]/20 border border-[#799351]/20 text-white font-mono text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#a1c398] animate-pulse" />
              Simulate Client WhatsApp Inquiry
            </button>

            <button
              onClick={onResetDatabase}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-gray-300 font-mono text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-[#a1c398]" />
              Reset Local Storage Database
            </button>
          </div>
        </div>

        {/* Database Quick Stats */}
        <div className="glass-card rounded-2xl p-6 border-[#799351]/20">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#a1c398]" />
            <h3 className="text-base font-bold font-display uppercase tracking-wider">
              Local DB Entities Check
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="text-2xl font-bold text-[#a1c398] font-mono">{bookingsList.length}</span>
              <span className="text-[10px] text-gray-400 block mt-1 uppercase font-mono">Bookings</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="text-2xl font-bold text-amber-500 font-mono">{hardwareList.length}</span>
              <span className="text-[10px] text-gray-400 block mt-1 uppercase font-mono">Hardware Items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Column */}
      <div className="lg:col-span-7">
        <div className="glass-card rounded-2xl p-6 border-[#799351]/20 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-[#a1c398]" />
            <h3 className="text-base font-bold font-display uppercase tracking-wider">
              System Audit Terminal Logs
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300 space-y-2">
            {auditLogs.map((log) => {
              const isWarning = log.severity === "warning";
              const isAlert = log.severity === "alert";
              return (
                <div key={log.id} className="leading-relaxed border-b border-white/5 pb-2">
                  <span className="text-[10px] text-gray-500 block">
                    {new Date(log.timestamp).toLocaleTimeString()} • {log.actor}
                  </span>
                  <span className={isWarning ? "text-amber-400" : isAlert ? "text-red-400" : "text-[#a1c398]"}>
                    {log.action}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
