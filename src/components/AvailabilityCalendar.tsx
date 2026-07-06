import { Booking } from "../types";
import { CheckCircle, Clock, Calendar, HelpCircle, Lock } from "lucide-react";

interface AvailabilityCalendarProps {
  bookingsList: Booking[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedState: string;
}

export default function AvailabilityCalendar({
  bookingsList,
  selectedDate,
  onSelectDate,
  selectedState,
}: AvailabilityCalendarProps) {
  
  // Create 15 days representation of the calendar for July 2026
  const startDay = 10;
  const totalDays = 15;
  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const dayNum = startDay + i;
    return `2026-07-${dayNum}`;
  });

  return (
    <div className="glass-card rounded-2xl p-6 border-emerald-900/30 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold font-display uppercase tracking-wider text-white">
            📅 Live Status Availability Calendar
          </h2>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-neutral-800 border border-white/5" />
            Available (Slate)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded bg-amber-600/30 border border-amber-500/40" />
            Pre-Booking (Yellow)
          </span>
          <span className="flex items-center gap-1 text-[#a1c398]">
            <span className="w-2 h-2 rounded bg-[#799351]/30 border border-[#a1c398]/50" />
            Booked (Green)
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-300 font-light leading-relaxed mb-4">
        Click a slot to set your event date on the booking form. Slots are fully synchronized across Selangor, Negeri Sembilan, Melaka, Johor, and Pahang.
      </p>

      {/* Grid of Slots */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {daysArray.map((dateStr) => {
          const booking = bookingsList.find((b) => b.date === dateStr);
          const isSelected = selectedDate === dateStr;
          
          let cardStyle = "bg-neutral-900/40 border-white/5 text-gray-300 hover:border-[#799351]/40";
          let labelStyle = "text-gray-400";
          let statusText = "Available";
          let Icon = Calendar;

          if (booking) {
            if (booking.status === "BOOKED") {
              cardStyle = "bg-[#799351]/10 border-[#799351]/40 text-[#a1c398] hover:border-[#799351] shadow-[0_0_10px_rgba(121,147,81,0.05)]";
              labelStyle = "text-[#a1c398]";
              statusText = "✅ Booked";
              Icon = Lock;
            } else if (booking.status === "PREBOOKED") {
              cardStyle = "bg-amber-950/40 border-amber-500/40 text-amber-300 hover:border-amber-500 shadow-[0_0_10px_rgba(217,119,6,0.05)]";
              labelStyle = "text-amber-400";
              statusText = "⏳ Pre-Booked";
              Icon = Clock;
            }
          }

          if (isSelected) {
            cardStyle += " ring-2 ring-[#799351] ring-offset-2 ring-offset-black scale-[1.02]";
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`p-3.5 rounded-xl border flex flex-col justify-between items-start text-left transition-all ${cardStyle}`}
            >
              <div className="flex justify-between items-center w-full mb-1">
                <span className="text-xs font-mono font-bold tracking-wider">
                  {new Date(dateStr).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <Icon className="w-3.5 h-3.5 opacity-60" />
              </div>

              <div className="mt-2 w-full">
                <span className={`text-[9px] font-mono font-bold uppercase ${labelStyle}`}>
                  {statusText}
                </span>
                {booking && (
                  <span className="text-[10px] text-white/80 block font-light truncate mt-0.5">
                    {booking.clientName}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
