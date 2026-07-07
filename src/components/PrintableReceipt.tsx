import React, { useState } from "react";
import { Booking } from "../types";
import { 
  Printer, 
  Download, 
  CheckCircle, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  User, 
  Calendar 
} from "lucide-react";
import { PACKAGES } from "../data";

interface PrintableReceiptProps {
  booking: Booking;
  onClose?: () => void;
}

export default function PrintableReceipt({ booking, onClose }: PrintableReceiptProps) {
  const [downloading, setDownloading] = useState(false);

  // Parse the package price dynamically or default to standard packages price mapping
  const pkgData = PACKAGES.find(p => p.name.toLowerCase() === booking.packageName.toLowerCase()) || PACKAGES[1];
  const packageBasePrice = pkgData.price;
  
  // Estimate addon costs (subtract package from total)
  const addonCostTotal = Math.max(0, booking.totalPrice - packageBasePrice);

  // Generate unique invoice number
  const invoiceNumber = `FRM-2026-${booking.id.toUpperCase().substring(0, 8)}`;
  
  // Standard SSM Registration, contact, and bank coordinates for Framez Photobooth Services
  const businessDetails = {
    name: "Framez Photobooth Services Ltd.",
    registration: "SSM Registration No: 202603099811 (Framez Media Enterprise)",
    phone: "+60 12-445 6789",
    email: "billing@framez.my",
    address: "A-12-03, Level 12, Empire Tower, Jalan SS 16/1, 47500 Subang Jaya, Selangor, Malaysia",
    bankName: "Maybank Malaysia",
    bankAccount: "5124 4567 8901",
    bankHolder: "Framez Media Enterprise"
  };

  const handlePrint = () => {
    window.print();
  };

  // Simulate an authentic invoice HTML download that they can save as a separate vector page
  const handleDownloadSimulatedPDF = () => {
    setDownloading(true);
    
    setTimeout(() => {
      // Build high fidelity standalone invoice HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917; background-color: #f5f5f4; margin: 0; padding: 40px; }
            .invoice-box { max-width: 800px; margin: auto; padding: 40px; border: 1px solid #e7e5e4; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { display: flex; justify-content: space-between; border-b: 2px solid #e7e5e4; padding-bottom: 20px; margin-bottom: 25px; }
            .business-title { font-size: 24px; font-weight: bold; color: #799351; letter-spacing: -0.025em; }
            .business-sub { font-size: 11px; color: #78716c; margin-top: 4px; font-family: monospace; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #a1c398; letter-spacing: 0.1em; margin-bottom: 8px; border-bottom: 1px solid #f5f5f4; padding-bottom: 4px; }
            .detail-text { font-size: 13px; line-height: 1.5; color: #44403c; }
            .bold { font-weight: bold; color: #1c1917; }
            .table { width: 100%; border-collapse: collapse; text-align: left; margin: 25px 0; }
            .table th { border-bottom: 2px solid #e7e5e4; padding: 12px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #78716c; font-family: monospace; }
            .table td { border-bottom: 1px solid #f5f5f4; padding: 14px 10px; font-size: 13px; color: #44403c; }
            .total-calc { display: flex; flex-direction: column; align-items: flex-end; margin-top: 20px; border-top: 1px solid #e7e5e4; padding-top: 15px; }
            .calc-row { display: flex; width: 300px; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
            .grand-total { font-size: 20px; font-weight: bold; color: #799351; margin-top: 8px; border-top: 2px solid #799351; padding-top: 8px; }
            .terms { font-size: 10px; color: #a8a29e; line-height: 1.6; margin-top: 40px; border-top: 1px dashed #e7e5e4; padding-top: 15px; }
            .watermark { text-align: center; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em; padding: 8px 16px; border: 2px solid; border-radius: 6px; display: inline-block; margin-top: 15px; }
            .paid-watermark { color: #16a34a; border-color: #16a34a; background-color: #f0fdf4; }
            .pending-watermark { color: #d97706; border-color: #d97706; background-color: #fffbeb; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <table style="width: 100%;">
              <tr>
                <td>
                  <span class="business-title">FRAMEZ PHOTOBOOTH</span>
                  <div class="business-sub">${businessDetails.registration}</div>
                </td>
                <td style="text-align: right; font-size: 13px; color: #78716c;">
                  <strong style="color: #1c1917; font-size: 15px;">TAX INVOICE / RECEIPT</strong><br/>
                  Invoice #: <span style="font-family: monospace; font-weight: bold; color: #1c1917;">${invoiceNumber}</span><br/>
                  Issue Date: 2026-07-06<br/>
                  Event Date: ${booking.date}
                </td>
              </tr>
            </table>

            <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 20px 0;"/>

            <div class="grid-2">
              <div>
                <div class="section-title">Corporate Service Provider</div>
                <div class="detail-text">
                  <strong class="bold">${businessDetails.name}</strong><br/>
                  ${businessDetails.address}<br/>
                  Phone: ${businessDetails.phone}<br/>
                  Email: ${businessDetails.email}
                </div>
              </div>
              <div>
                <div class="section-title">Client Billing Account</div>
                <div class="detail-text">
                  Name: <strong class="bold">${booking.clientName}</strong><br/>
                  Email: ${booking.clientEmail}<br/>
                  Phone: ${booking.clientPhone}<br/>
                  Location: ${booking.locationAddress || "Kuala Lumpur Area"}<br/>
                  State: <span style="text-transform: uppercase; font-family: monospace;">${booking.state}</span>
                </div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th style="text-align: right;">Unit Price (RM)</th>
                  <th style="text-align: right;">Total Price (RM)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong class="bold">${booking.packageName}</strong> Plan<br/>
                    <span style="font-size: 11px; color: #78716c;">Includes unlimited dye-sublimation live photo printing, custom branding templates, backdrop, and support coordinator on-site.</span>
                  </td>
                  <td>1</td>
                  <td style="text-align: right;">${packageBasePrice.toFixed(2)}</td>
                  <td style="text-align: right;">${packageBasePrice.toFixed(2)}</td>
                </tr>
                ${addonCostTotal > 0 ? `
                <tr>
                  <td>
                    <strong class="bold">Custom Upgrade Package Add-ons</strong><br/>
                    <span style="font-size: 11px; color: #78716c;">${(booking.addOns || []).join(", ") || "Custom physical prop and time additions"}</span>
                  </td>
                  <td>1</td>
                  <td style="text-align: right;">${addonCostTotal.toFixed(2)}</td>
                  <td style="text-align: right;">${addonCostTotal.toFixed(2)}</td>
                </tr>
                ` : ""}
              </tbody>
            </table>

            <div class="total-calc">
              <div class="calc-row">
                <span>Subtotal (Exclusive of SST):</span>
                <span>RM ${(booking.totalPrice / 1.06).toFixed(2)}</span>
              </div>
              <div class="calc-row">
                <span>Sales & Service Tax (6% SST):</span>
                <span>RM ${(booking.totalPrice - (booking.totalPrice / 1.06)).toFixed(2)}</span>
              </div>
              <div class="calc-row grand-total">
                <span>Grand Total (SST Inclusive):</span>
                <span>RM ${booking.totalPrice.toFixed(2)}</span>
              </div>
              
              <div class="watermark ${booking.status === 'BOOKED' ? 'paid-watermark' : 'pending-watermark'}">
                Status: ${booking.status === 'BOOKED' ? '✔ TRANSACTION PAID' : '⌛ VERIFICATION PENDING'}
              </div>
            </div>

            <div class="terms">
              <strong>Terms of Payment & Service:</strong><br/>
              1. A 50% non-refundable retainer deposit is required to secure calendar dates.<br/>
              2. Final balance must be settled on or before the live print day.<br/>
              3. Unrestricted high-res Google Drive memory link will be released within 48 hours post-event.
            </div>
          </div>
        </body>
        </html>
      `;

      // Trigger download
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${invoiceNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(false);
    }, 700);
  };

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6 max-w-4xl mx-auto">
      
      {/* Dynamic injection of Print CSS to target only this receipt card container when printing */}
      <style>{`
        @media print {
          /* Hide all page layouts, menus, and sidebars entirely */
          body * {
            visibility: hidden !important;
          }
          /* Show only the printable receipt card and fill page */
          #printable-receipt-area, #printable-receipt-area * {
            visibility: visible !important;
          }
          #printable-receipt-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 30px !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          /* Set text contrast to extreme black on white for clear receipt printouts */
          #printable-receipt-area span, 
          #printable-receipt-area h3, 
          #printable-receipt-area h4, 
          #printable-receipt-area th, 
          #printable-receipt-area td, 
          #printable-receipt-area p, 
          #printable-receipt-area strong {
            color: #111111 !important;
          }
          #printable-receipt-area .badge-paid {
            border-color: #16a34a !important;
            color: #16a34a !important;
            background: #f0fdf4 !important;
          }
          /* Hide buttons */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header bar within portal preview */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold font-display uppercase tracking-wider text-white">
            🧾 Official Tax Invoice & Print Receipt
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Standard itemized invoice containing SST tax coordinates and direct payment confirmations.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#799351] hover:bg-[#5f743e] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadSimulatedPDF}
            disabled={downloading}
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-gray-300 font-bold rounded-xl text-xs uppercase tracking-wider border border-white/10 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Compiling..." : "Save HTML Invoice"}</span>
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* THE ACTUAL HIGH FIDELITY PRINTABLE RECEIPT CARD */}
      <div 
        id="printable-receipt-area" 
        className="p-8 bg-black/40 border border-white/10 rounded-2xl space-y-6 text-white relative overflow-hidden"
      >
        {/* Framez Branding and Invoice Reference */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#a1c398] uppercase tracking-widest font-bold">
              ⚡ LIVE PRINT EXPERIENCES
            </span>
            <h3 className="text-xl font-bold font-display tracking-tight text-white uppercase">
              FRAMEZ PHOTOBOOTH
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">
              {businessDetails.registration}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 sm:space-y-0.5">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">
              OFFICIAL TAX DOCUMENT
            </span>
            <div className="text-xs">
              <span className="text-gray-400 font-mono">Invoice No:</span>{" "}
              <strong className="font-mono text-white text-sm tracking-wider uppercase">{invoiceNumber}</strong>
            </div>
            <div className="text-xs">
              <span className="text-gray-400 font-mono">Issued:</span>{" "}
              <strong className="text-gray-300 font-mono">2026-07-06</strong>
            </div>
            <div className="text-xs">
              <span className="text-gray-400 font-mono">Event Date:</span>{" "}
              <strong className="text-amber-400 font-mono">{booking.date}</strong>
            </div>
          </div>
        </div>

        {/* Coords Grid: Issuer & Customer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed border-b border-white/5 pb-6">
          {/* Corporate Provider */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-[#a1c398] font-bold font-mono uppercase text-[9px] tracking-widest">
              <Building className="w-3.5 h-3.5" />
              <span>Service Provider</span>
            </div>
            <div className="text-gray-300 space-y-1">
              <p className="font-bold text-white">{businessDetails.name}</p>
              <p className="text-gray-400 font-light max-w-sm">{businessDetails.address}</p>
              <div className="flex items-center gap-1.5 font-mono text-[11px] mt-1">
                <Phone className="w-3 h-3 text-gray-500" />
                <span>{businessDetails.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Mail className="w-3 h-3 text-gray-500" />
                <span>{businessDetails.email}</span>
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-[#a1c398] font-bold font-mono uppercase text-[9px] tracking-widest">
              <User className="w-3.5 h-3.5" />
              <span>Client Account</span>
            </div>
            <div className="text-gray-300 space-y-1">
              <p className="font-bold text-white">{booking.clientName}</p>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Mail className="w-3 h-3 text-gray-500" />
                <span>{booking.clientEmail}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Phone className="w-3 h-3 text-gray-500" />
                <span>{booking.clientPhone}</span>
              </div>
              <div className="flex items-start gap-1.5 mt-1">
                <MapPin className="w-3 h-3 text-gray-500 shrink-0 mt-0.5" />
                <p className="text-gray-400 font-light truncate max-w-xs uppercase">
                  {booking.locationAddress || "Specified Klang Valley Hall Address"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">
            ITEMIZED EXPERIENCE REVENUE SUMMARY
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 font-mono text-[10px] uppercase">
                  <th className="py-3 px-2">Description</th>
                  <th className="py-3 px-2">Qty</th>
                  <th className="py-3 px-2 text-right">Unit Price</th>
                  <th className="py-3 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {/* Core Package */}
                <tr className="border-b border-white/5 font-light">
                  <td className="py-4 px-2">
                    <span className="font-semibold text-white block">{booking.packageName}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Unlimited live printouts, custom photo template design, studio studio backdrops & coordinator.
                    </span>
                  </td>
                  <td className="py-4 px-2 font-mono">1</td>
                  <td className="py-4 px-2 text-right font-mono text-gray-300">RM {packageBasePrice.toFixed(2)}</td>
                  <td className="py-4 px-2 text-right font-mono text-white font-medium">RM {packageBasePrice.toFixed(2)}</td>
                </tr>

                {/* Add-ons upgraded block */}
                {addonCostTotal > 0 && (
                  <tr className="border-b border-white/5 font-light">
                    <td className="py-4 px-2">
                      <span className="font-semibold text-white block">Event Upgrade & Accessories Add-ons</span>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        Included: {(booking.addOns || []).join(", ") || "Custom physical props set and time block upgrades"}
                      </span>
                    </td>
                    <td className="py-4 px-2 font-mono">1</td>
                    <td className="py-4 px-2 text-right font-mono text-gray-300">RM {addonCostTotal.toFixed(2)}</td>
                    <td className="py-4 px-2 text-right font-mono text-white font-medium">RM {addonCostTotal.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-white/10">
          
          {/* Bank Coordinates for settlements */}
          <div className="p-4 bg-neutral-950/60 border border-white/5 rounded-xl space-y-2 text-[11px] max-w-sm">
            <div className="flex items-center gap-1.5 text-[#a1c398] font-bold font-mono uppercase text-[9px] tracking-widest">
              <CreditCard className="w-3.5 h-3.5" />
              <span>DuitNow / Bank coordinates</span>
            </div>
            <div className="space-y-1 font-light text-gray-300">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Bank:</span>
                <span className="font-bold">{businessDetails.bankName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Account No:</span>
                <span className="font-mono bg-black px-1 rounded text-white font-bold">{businessDetails.bankAccount}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Account Name:</span>
                <span className="font-mono text-white truncate text-[10px]">{businessDetails.bankHolder}</span>
              </div>
            </div>
          </div>

          {/* Pricing settlement maths */}
          <div className="w-full sm:w-[320px] space-y-2 text-xs">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal (Exclusive of SST):</span>
              <span className="font-mono">RM {(booking.totalPrice / 1.06).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Tax Rate (6% Service Tax):</span>
              <span className="font-mono">RM {(booking.totalPrice - (booking.totalPrice / 1.06)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-white border-t border-white/5 pt-2">
              <span className="font-bold text-sm">Grand Total (Inclusive):</span>
              <span className="text-lg font-bold text-[#a1c398] font-mono">RM {booking.totalPrice.toFixed(2)}</span>
            </div>

            {/* Stamp Status Overlay */}
            <div className="pt-2">
              {booking.status === "BOOKED" ? (
                <div className="badge-paid px-3 py-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold uppercase font-mono tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Paid & Confirmed</span>
                </div>
              ) : (
                <div className="px-3 py-2 bg-amber-950/40 border border-amber-500/30 text-amber-400 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold uppercase font-mono tracking-wider">
                  <span>Deposit Slip Awaiting Auth</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Notes */}
        <div className="border-t border-white/5 pt-6 text-[10px] text-gray-500 space-y-1.5 leading-relaxed font-light">
          <p className="font-mono uppercase text-[9px] text-[#a1c398] font-bold">Standard Client Retainer Policy:</p>
          <p>1. Payments are direct bank transfers processed to Maybank coordinates. Screenshots or PDF receipts uploaded inside Framez Client Workspace lock the dates.</p>
          <p>2. Event date bookings are locked pending validation. Framez Media retains right to release unpaid reservations 14 days prior to event day.</p>
          <p>3. Dynamic Google Drive gallery link will be active for 1 year post-event under standard platinum SLA.</p>
          <p className="text-center text-gray-400 font-mono mt-4 uppercase tracking-widest text-[9px]">
            Thank you for coordinating with Framez. Let's make your memories timeless.
          </p>
        </div>

      </div>

    </div>
  );
}
