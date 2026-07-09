import React, { useState } from "react";
import { SystemNotification, Role } from "../types";
import { 
  Bell, 
  Send, 
  User, 
  Check, 
  AlertCircle, 
  Megaphone, 
  Clipboard, 
  Calendar,
  X,
  Users,
  Eye
} from "lucide-react";

interface NotificationManagerProps {
  notifications: SystemNotification[];
  onUpdateNotifications: React.Dispatch<React.SetStateAction<SystemNotification[]>>;
  role: Role;
  userEmail: string;
  onAddAuditLog?: (actor: string, action: string, severity: "info" | "warning" | "alert") => void;
  targetCrewId?: string;
}

export default function NotificationManager({
  notifications,
  onUpdateNotifications,
  role,
  userEmail,
  onAddAuditLog,
  targetCrewId,
}: NotificationManagerProps) {
  // Creator form state (Developer only)
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState<SystemNotification["type"]>("INFO");
  const [newTarget, setNewTarget] = useState<SystemNotification["targetRole"]>("ALL");

  const isDeveloper = role === "DEVELOPER";
  const isComposerAllowed = role === "DEVELOPER" || role === "OWNER";

  // Filter notifications: matches target role OR "ALL" OR matches personal crew ID
  const visibleNotifications = notifications.filter((notif) => {
    if (role === "DEVELOPER") return true; // Developer superuser can monitor all notifications across portals
    if (notif.targetRole === "ALL") return true;
    if (notif.targetRole === role) return true;
    if (role === "CREW" && notif.recipientRole === "PERSONAL_CREW" && targetCrewId && notif.targetCrewId === targetCrewId) {
      return true;
    }
    return false;
  });

  // Mark single as read helper
  const handleMarkAsRead = (id: string) => {
    onUpdateNotifications((prev) =>
      prev.map((notif) => {
        if (notif.id === id) {
          const reads = notif.isReadBy || [];
          if (!reads.includes(userEmail)) {
            return { ...notif, isReadBy: [...reads, userEmail] };
          }
        }
        return notif;
      })
    );
  };

  // Mark all visible as read
  const handleMarkAllAsRead = () => {
    onUpdateNotifications((prev) =>
      prev.map((notif) => {
        const matchesTarget = 
          role === "DEVELOPER" ||
          notif.targetRole === "ALL" || 
          notif.targetRole === role ||
          (role === "CREW" && notif.recipientRole === "PERSONAL_CREW" && targetCrewId && notif.targetCrewId === targetCrewId);
        if (matchesTarget) {
          const reads = notif.isReadBy || [];
          if (!reads.includes(userEmail)) {
            return { ...notif, isReadBy: [...reads, userEmail] };
          }
        }
        return notif;
      })
    );
    alert("Checked off all visible alerts as read!");
  };

  // Submit custom notification as developer or owner
  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    const newNotif: SystemNotification = {
      id: "notif_" + Math.random().toString(36).substr(2, 9),
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newType,
      targetRole: newTarget,
      recipientRole: "ALL",
      sender: role === "DEVELOPER" ? "System Admin" : "Irfan (Co-Founder)",
      timestamp: new Date().toISOString(),
      isReadBy: [],
    };

    onUpdateNotifications((prev) => [newNotif, ...prev]);
    if (onAddAuditLog) {
      onAddAuditLog(
        role === "DEVELOPER" ? "Developer Superuser" : "Irfan (Co-Founder)",
        `Created and broadcasted System Bulletin: "${newNotif.title}" to target audience: ${newNotif.targetRole}`,
        "alert"
      );
    }

    setNewTitle("");
    setNewMessage("");
    setNewType("INFO");
    setNewTarget("ALL");
    alert("📣 Custom alert dispatched successfully across active systems!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-white relative z-10">
      
      {/* List of Notifications - Left side */}
      <div className="lg:col-span-8 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#a1c398]" />
            <div>
              <h3 className="text-base font-bold font-display uppercase tracking-widest">🔔 Active System Bulletins</h3>
              <p className="text-[10px] text-gray-400 font-mono">Central news feed, crew dispatchments, and developer broadcast logs</p>
            </div>
          </div>

          {visibleNotifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] font-mono font-bold text-[#a1c398] hover:underline bg-[#799351]/10 px-3 py-1.5 rounded-lg border border-[#799351]/20 self-start sm:self-auto"
            >
              ✓ Clear All Alerts
            </button>
          )}
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <Bell className="w-12 h-12 text-gray-600 mx-auto animate-pulse" />
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-gray-400">All caught up!</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              There are no new system alerts, task briefs, or general broadcasts assigned to your profile role right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleNotifications.map((notif) => {
              const isRead = (notif.isReadBy || []).includes(userEmail);
              
              // Map types to beautiful colors
              let typeColor = "bg-neutral-950 text-gray-400 border-white/5";
              if (notif.type === "BROADCAST") typeColor = "bg-red-950/40 text-red-400 border-red-500/20";
              if (notif.type === "TASK") typeColor = "bg-amber-950/40 text-amber-400 border-amber-500/20";
              if (notif.type === "SYSTEM") typeColor = "bg-sky-950/40 text-sky-400 border-sky-500/20";

              return (
                <div
                  key={notif.id}
                  className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                    isRead 
                      ? "bg-black/30 border-white/5 opacity-60" 
                      : "bg-gradient-to-r from-neutral-900 to-neutral-800/80 border-[#799351]/30 shadow-md shadow-[#799351]/5"
                  }`}
                >
                  {/* Read state dot / badge */}
                  <div className="mt-1">
                    {isRead ? (
                      <div className="w-5 h-5 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-gray-500">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Mark as read"
                        className="w-5 h-5 rounded-full bg-[#799351]/20 border border-[#a1c398] hover:bg-[#799351] text-[#a1c398] hover:text-white flex items-center justify-center transition-all"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-xs font-bold font-display ${isRead ? "text-gray-400" : "text-white"}`}>
                          {notif.title}
                        </h4>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono border ${typeColor}`}>
                          {notif.type}
                        </span>
                        {notif.targetRole !== "ALL" && (
                          <span className="bg-neutral-950 text-[8px] font-bold font-mono text-amber-500 px-1 border border-white/5 uppercase">
                            Target: {notif.targetRole}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-gray-500 shrink-0">
                        {new Date(notif.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isRead ? "text-gray-400 font-light" : "text-gray-200"}`}>
                      {notif.message}
                    </p>

                    {/* Developer tracking analytics */}
                    {isDeveloper && (notif.isReadBy || []).length > 0 && (
                      <div className="pt-2 flex items-center gap-1 text-[9px] font-mono text-gray-500 border-t border-white/5">
                        <Eye className="w-3 h-3 text-[#a1c398]" />
                        <span>Seen by: {(notif.isReadBy || []).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Developer Notification dispatch controls - Right side */}
      <div className="lg:col-span-4 space-y-6">
        {isComposerAllowed ? (
          <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-amber-500">
                Dispatch System Broadcasts
              </h3>
            </div>

            <p className="text-[11px] text-gray-400 font-light leading-relaxed">
              Create a custom notification that appears in the portals of all selected roles instantly. Logs in the developer audits automatically.
            </p>

            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Alert Heading Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Server Upgrade scheduled"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-gray-400 uppercase">Alert Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="INFO">Information</option>
                    <option value="TASK">Task brief</option>
                    <option value="SYSTEM">Server Alert</option>
                    <option value="BROADCAST">Broadcast Bulletin</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-gray-400 uppercase">Target Role</label>
                  <select
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value as any)}
                    className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="ALL">Everyone (ALL)</option>
                    <option value="CREW">Coordinators (CREW)</option>
                    <option value="OWNER">Founders (OWNER)</option>
                    <option value="DEVELOPER">Superusers (DEVELOPER)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Alert Message Body</label>
                <textarea
                  required
                  placeholder="Draft clear directions or alert announcements here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white h-24 outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Dispatch Broadcast Slip
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md text-center space-y-4">
            <Users className="w-10 h-10 text-gray-600 mx-auto" />
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white">Broadcast Panel Blocked</h4>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              Only verified **Founders** or **Developers** have secure protocol clearance to broadcast manual custom notifications across the systems.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
