import React, { useState } from "react";
import { InventoryLocation, InventoryItem, InventoryRequest, Role } from "../types";
import { 
  Package, 
  MapPin, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Send, 
  CheckCircle, 
  XCircle, 
  Camera, 
  FileText, 
  Trash2, 
  AlertTriangle,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Map
} from "lucide-react";

interface InventoryManagerProps {
  locations: InventoryLocation[];
  inventory: InventoryItem[];
  inventoryRequests: InventoryRequest[];
  onUpdateInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onUpdateLocations: React.Dispatch<React.SetStateAction<InventoryLocation[]>>;
  onUpdateRequests: React.Dispatch<React.SetStateAction<InventoryRequest[]>>;
  onAddAuditLog: (actor: string, action: string, severity: "info" | "warning" | "alert") => void;
  role: Role;
  userName: string;
}

export default function InventoryManager({
  locations,
  inventory,
  inventoryRequests,
  onUpdateInventory,
  onUpdateLocations,
  onUpdateRequests,
  onAddAuditLog,
  role,
  userName,
}: InventoryManagerProps) {
  // Tabs for sub-views
  const [invTab, setInvTab] = useState<"directory" | "requests" | "locations">("directory");

  // Cart system state
  const [cartType, setCartType] = useState<"IN" | "OUT">("OUT");
  const [cartLocationId, setCartLocationId] = useState<string>(locations[0]?.id || "");
  const [cartItems, setCartItems] = useState<{ [itemId: string]: number }>({});

  // Form state for Damage report / Add New Stock
  const [reportType, setReportType] = useState<"ADD_NEW" | "DAMAGE">("DAMAGE");
  const [reportItemId, setReportItemId] = useState<string>(inventory[0]?.id || "");
  const [reportLocationId, setReportLocationId] = useState<string>(locations[0]?.id || "");
  const [reportQty, setReportQty] = useState<number>(1);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportProofFileName, setReportProofFileName] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // New location creation state (Owner/Developer only)
  const [newLocName, setNewLocName] = useState<string>("");
  const [newLocAddress, setNewLocAddress] = useState<string>("");

  // New catalog item creation state (Owner/Developer only)
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<string>("Consumables");
  const [newItemThreshold, setNewItemThreshold] = useState<number>(2);

  const canManageLocations = role === "DEVELOPER" || role === "OWNER";

  // ADD TO CART helper
  const handleAddToCart = (itemId: string, type: "IN" | "OUT") => {
    setCartType(type);
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleUpdateCartQty = (itemId: string, val: number) => {
    if (val <= 0) {
      const copy = { ...cartItems };
      delete copy[itemId];
      setCartItems(copy);
    } else {
      setCartItems((prev) => ({ ...prev, [itemId]: val }));
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    const copy = { ...cartItems };
    delete copy[itemId];
    setCartItems(copy);
  };

  // Submit Cart as request to Owner
  const handleSubmitCartRequest = () => {
    const itemsList = Object.keys(cartItems).map((id) => {
      const item = inventory.find((i) => i.id === id);
      return {
        itemId: id,
        name: item?.name || "Unknown",
        quantity: cartItems[id],
      };
    });

    if (itemsList.length === 0) {
      alert("Please add items to your cart first.");
      return;
    }

    const newRequest: InventoryRequest = {
      id: "inv_req_" + Math.random().toString(36).substr(2, 9),
      type: cartType,
      requesterName: userName,
      requesterRole: role,
      items: itemsList,
      locationId: cartLocationId,
      status: "PENDING",
      timestamp: new Date().toISOString(),
    };

    onUpdateRequests((prev) => [newRequest, ...prev]);
    onAddAuditLog(
      userName,
      `Submitted inventory request (${cartType}) for approval at ${locations.find(l => l.id === cartLocationId)?.name}`,
      "info"
    );

    // Reset
    setCartItems({});
    alert("🚀 Inventory Slip request successfully sent to Owner for approval!");
  };

  // Simulate Proof Upload
  const handleSimulateProofUpload = () => {
    setIsUploadingProof(true);
    setUploadProgress(10);
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsUploadingProof(false);
          setReportProofFileName(`proof_photo_${Math.floor(Math.random() * 9000 + 1000)}.jpg`);
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  // Submit Damage Report / New Stock Form
  const handleSubmitReportForm = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find((i) => i.id === reportItemId);
    if (!item) return;

    if (!reportProofFileName) {
      alert("Please upload a photo as proof of action.");
      return;
    }

    const newRequest: InventoryRequest = {
      id: "inv_req_" + Math.random().toString(36).substr(2, 9),
      type: reportType,
      requesterName: userName,
      requesterRole: role,
      items: [{ itemId: reportItemId, name: item.name, quantity: reportQty }],
      locationId: reportLocationId,
      proofImageUrl: `https://framez.my/storage/proofs/${reportProofFileName}`,
      status: "PENDING",
      timestamp: new Date().toISOString(),
      rejectionReason: reportReason,
    };

    onUpdateRequests((prev) => [newRequest, ...prev]);
    onAddAuditLog(
      userName,
      `Reported stock adjustment (${reportType}) for ${item.name} at location: ${locations.find(l => l.id === reportLocationId)?.name}`,
      reportType === "DAMAGE" ? "warning" : "info"
    );

    // Reset form
    setReportQty(1);
    setReportReason("");
    setReportProofFileName(null);
    alert(`📄 Slip receipt created! Damage/Stock report sent as approval request to the Owner.`);
  };

  // Approve Request (Updates live stock counts!)
  const handleApproveRequest = (req: InventoryRequest) => {
    onUpdateInventory((prevInventory) => {
      return prevInventory.map((item) => {
        const cartItemMatch = req.items.find((x) => x.itemId === item.id);
        if (cartItemMatch) {
          const currentQty = item.locations[req.locationId] || 0;
          let newQty = currentQty;

          if (req.type === "IN" || req.type === "ADD_NEW") {
            newQty += cartItemMatch.quantity;
          } else if (req.type === "OUT" || req.type === "DAMAGE") {
            newQty = Math.max(0, currentQty - cartItemMatch.quantity);
          }

          return {
            ...item,
            locations: {
              ...item.locations,
              [req.locationId]: newQty,
            },
          };
        }
        return item;
      });
    });

    onUpdateRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "APPROVED" } : r))
    );

    onAddAuditLog(
      "Owner Admin",
      `APPROVED Inventory request (${req.type}) submitted by ${req.requesterName}. Stock adjusted.`,
      "info"
    );
  };

  // Reject Request
  const handleRejectRequest = (reqId: string) => {
    const reason = prompt("Enter rejection reason:") || "Rejected by administrator";
    onUpdateRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: "REJECTED", rejectionReason: reason } : r))
    );
    onAddAuditLog("Owner Admin", `REJECTED Inventory request ID: ${reqId}.`, "warning");
  };

  // Add Location
  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName) return;

    const newLoc: InventoryLocation = {
      id: "loc_" + Math.random().toString(36).substr(2, 5),
      name: newLocName.trim(),
      address: newLocAddress.trim() || "TBD address details",
    };

    onUpdateLocations((prev) => [...prev, newLoc]);
    onAddAuditLog(role, `Created new inventory storage hub location: ${newLoc.name}`, "info");

    setNewLocName("");
    setNewLocAddress("");
    alert(`📍 New inventory storage hub location created successfully!`);
  };

  // Add Item to Catalog
  const handleCreateCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    // Default 0 for all current locations
    const initialLocs: { [key: string]: number } = {};
    locations.forEach((loc) => {
      initialLocs[loc.id] = 0;
    });

    const newItem: InventoryItem = {
      id: "inv_" + Math.random().toString(36).substr(2, 9),
      name: newItemName.trim(),
      category: newItemCategory,
      threshold: newItemThreshold,
      locations: initialLocs,
    };

    onUpdateInventory((prev) => [...prev, newItem]);
    onAddAuditLog(role, `Added new hardware equipment entity to master inventory catalog: ${newItem.name}`, "info");

    setNewItemName("");
    setNewItemThreshold(2);
    alert(`📦 ${newItem.name} registered into master inventory tracking catalog.`);
  };

  return (
    <div className="space-y-6">
      {/* Tab select Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#a1c398]" />
          <div>
            <h3 className="text-base font-bold font-display uppercase tracking-widest text-white">📦 Master Multi-Location Inventory</h3>
            <span className="text-[10px] text-gray-400 font-mono">Verify equipment levels, manage depots, and coordinate dispatch slips</span>
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex gap-2 font-mono text-[10px] uppercase font-bold">
          <button
            onClick={() => setInvTab("directory")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              invTab === "directory" ? "bg-[#799351] text-white" : "bg-black/40 text-gray-400 hover:text-white"
            }`}
          >
            📋 Directory Stock
          </button>
          <button
            onClick={() => setInvTab("requests")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              invTab === "requests" ? "bg-[#799351] text-white" : "bg-black/40 text-gray-400 hover:text-white"
            }`}
          >
            📄 Slip Approvals
            {inventoryRequests.filter((r) => r.status === "PENDING").length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setInvTab("locations")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              invTab === "locations" ? "bg-[#799351] text-white" : "bg-black/40 text-gray-400 hover:text-white"
            }`}
          >
            📍 Depot Locations
          </button>
        </div>
      </div>

      {/* 1. CART SYSTEM CONTAINER (Always visible at top when items are added) */}
      {Object.keys(cartItems).length > 0 && (
        <div className="bg-[#799351]/10 border-2 border-dashed border-[#799351]/40 rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#a1c398]" />
              Active Dispatch Cart: Requesting <span className="text-[#a1c398]">{cartType}</span> slip
            </h4>
            <button
              onClick={() => setCartItems({})}
              className="text-[10px] font-mono font-bold text-red-400 hover:underline"
            >
              Clear Cart
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-gray-400 uppercase">Target Depot Location:</label>
              <select
                value={cartLocationId}
                onChange={(e) => setCartLocationId(e.target.value)}
                className="w-full p-2 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCartType("OUT")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border font-mono ${
                  cartType === "OUT" ? "bg-amber-950/40 border-amber-500/40 text-amber-400" : "bg-neutral-950 border-white/5 text-gray-500"
                }`}
              >
                📥 Checking OUT (To Field)
              </button>
              <button
                onClick={() => setCartType("IN")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border font-mono ${
                  cartType === "IN" ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400" : "bg-neutral-950 border-white/5 text-gray-500"
                }`}
              >
                📤 Checking IN (To Storage)
              </button>
            </div>
          </div>

          {/* Cart item rows */}
          <div className="bg-black/30 rounded-2xl border border-white/5 p-3 space-y-2 max-h-[150px] overflow-y-auto">
            {Object.keys(cartItems).map((itemId) => {
              const item = inventory.find((i) => i.id === itemId);
              const qty = cartItems[itemId];
              return (
                <div key={itemId} className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 truncate max-w-[200px]">{item?.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-neutral-950 border border-white/10 rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateCartQty(itemId, qty - 1)}
                        className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold text-white w-5 text-center">{qty}</span>
                      <button
                        onClick={() => handleUpdateCartQty(itemId, qty + 1)}
                        className="p-1 hover:bg-white/5 text-gray-400 hover:text-white rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(itemId)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSubmitCartRequest}
            className="w-full py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white text-xs font-bold uppercase font-mono tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Dispatch Request to Owner for Approval
          </button>
        </div>
      )}

      {/* 2. DIRECTORY STOCK VIEW */}
      {invTab === "directory" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Stock Table List */}
          <div className="lg:col-span-8 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-mono text-[#a1c398] font-bold uppercase tracking-widest">📋 Active Stock Levels across hubs</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-500 font-mono uppercase text-[9px]">
                    <th className="py-3">Equipment Item Details</th>
                    {locations.map((loc) => (
                      <th key={loc.id} className="py-3 px-2 text-center truncate max-w-[100px]">{loc.name.split(" ")[0]}</th>
                    ))}
                    <th className="py-3 text-center">Threshold</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inventory.map((item) => {
                    const totalAcrossLocs = Object.values(item.locations).reduce((a, b) => a + b, 0);
                    const isBelowThreshold = totalAcrossLocs < item.threshold;
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 pr-3">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-white/10" alt={item.name} referrerPolicy="no-referrer" />
                            )}
                            <div>
                              <span className="font-bold text-white block leading-tight">{item.name}</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] font-mono bg-neutral-950 px-1.5 py-0.5 rounded text-gray-400 uppercase">{item.category}</span>
                                {isBelowThreshold && (
                                  <span className="text-[8px] font-mono uppercase bg-red-950/60 border border-red-500/20 text-red-400 px-1 rounded flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Low Stock
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {locations.map((loc) => {
                          const count = item.locations[loc.id] || 0;
                          return (
                            <td key={loc.id} className="py-4 px-2 text-center font-mono">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                count === 0 ? "bg-red-950/30 text-red-500" : count < item.threshold ? "bg-amber-950/30 text-amber-500" : "bg-black/40 text-[#a1c398]"
                              }`}>
                                {count}
                              </span>
                            </td>
                          );
                        })}

                        <td className="py-4 text-center font-mono font-semibold text-gray-400">
                          {item.threshold}
                        </td>

                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleAddToCart(item.id, "OUT")}
                              title="Checkout OUT (To Event)"
                              className="px-2 py-1 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/20 text-amber-400 font-mono text-[9px] uppercase font-bold rounded-md"
                            >
                              Out
                            </button>
                            <button
                              onClick={() => handleAddToCart(item.id, "IN")}
                              title="Check IN (Return to Warehouse)"
                              className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase font-bold rounded-md"
                            >
                              In
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Damage / New Stock Report Form */}
          <div className="lg:col-span-4 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-mono text-amber-400 font-bold uppercase tracking-widest">⚠️ Report Broken / Damage Stock</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed font-light">
              If any hardware is broken, damaged, or if we purchased new local inventory stock, report it here.
            </p>

            <form onSubmit={handleSubmitReportForm} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setReportType("DAMAGE")}
                    className={`py-2 rounded-xl font-bold uppercase tracking-wider border transition-all ${
                      reportType === "DAMAGE"
                        ? "bg-red-950/40 border-red-500/40 text-red-400"
                        : "bg-black/30 border-white/5 text-gray-500"
                    }`}
                  >
                    💔 Broken / Damaged
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("ADD_NEW")}
                    className={`py-2 rounded-xl font-bold uppercase tracking-wider border transition-all ${
                      reportType === "ADD_NEW"
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                        : "bg-black/30 border-white/5 text-gray-500"
                    }`}
                  >
                    ✨ Add New Stock
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Select Catalog Item</label>
                <select
                  value={reportItemId}
                  onChange={(e) => setReportItemId(e.target.value)}
                  className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Hub Storage Location</label>
                <select
                  value={reportLocationId}
                  onChange={(e) => setReportLocationId(e.target.value)}
                  className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Quantity Affected</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reportQty}
                  onChange={(e) => setReportQty(parseInt(e.target.value) || 1)}
                  className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Reason / Context Notes</label>
                <textarea
                  required
                  placeholder="e.g. Printer roller cracked during transit, or new consumables purchased via corporate card."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white h-20 outline-none"
                />
              </div>

              {/* Picture Upload Proof */}
              <div className="space-y-2">
                <label className="text-[9px] font-mono text-gray-400 uppercase">Upload Stock Picture as Proof</label>
                <div className="relative border border-dashed border-white/10 hover:border-[#799351]/30 rounded-xl p-4 text-center bg-black/30">
                  <input
                    type="button"
                    onClick={handleSimulateProofUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-full bg-[#799351]/15 text-[#a1c398] flex items-center justify-center mx-auto">
                      {reportProofFileName ? (
                        <FileCheck className="w-4 h-4 text-[#a1c398]" />
                      ) : (
                        <Camera className="w-4 h-4 text-[#a1c398]" />
                      )}
                    </div>
                    {reportProofFileName ? (
                      <span className="text-[10px] text-emerald-400 block font-mono truncate">{reportProofFileName}</span>
                    ) : isUploadingProof ? (
                      <span className="text-[10px] text-gray-400 block font-mono">Uploading... {uploadProgress}%</span>
                    ) : (
                      <span className="text-[10px] text-gray-400 block">Tap to upload snapshot proof</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase font-mono tracking-wider rounded-xl transition-all"
              >
                📥 File Adjustment Slip Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. SLIP APPROVALS VIEW (Requests list) */}
      {invTab === "requests" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#a1c398]" />
              Active Dispatch Slips & Approval Requests
            </h4>
            <span className="text-[10px] font-mono text-gray-500 uppercase">{inventoryRequests.length} Slips registered</span>
          </div>

          {inventoryRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500 italic text-xs">
              No inventory adjustment slips found in portal ledger history.
            </div>
          ) : (
            <div className="space-y-4">
              {inventoryRequests.map((req) => {
                const targetLoc = locations.find((l) => l.id === req.locationId)?.name || "Default Hub";
                const isPending = req.status === "PENDING";
                const isDamage = req.type === "DAMAGE";
                const isAddNew = req.type === "ADD_NEW";

                return (
                  <div
                    key={req.id}
                    className="p-5 bg-black/40 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                          req.type === "IN" ? "bg-emerald-950 text-emerald-400" :
                          req.type === "OUT" ? "bg-amber-950 text-amber-400" :
                          req.type === "DAMAGE" ? "bg-red-950 text-red-400" : "bg-sky-950 text-sky-400"
                        }`}>
                          {req.type} SLIP
                        </span>
                        <span className="text-gray-500 text-[10px] font-mono">{new Date(req.timestamp).toLocaleString()}</span>
                        <span className={`ml-auto md:ml-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                          req.status === "APPROVED" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/20" :
                          req.status === "REJECTED" ? "bg-red-950 text-red-400 border border-red-500/20" : "bg-neutral-800 text-gray-300 border border-white/10"
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white block">Requested by: {req.requesterName} ({req.requesterRole})</span>
                        <span className="text-xs text-[#a1c398] block font-mono">Depot Hub: {targetLoc}</span>
                      </div>

                      <div className="space-y-1.5 p-3 bg-neutral-950 rounded-xl border border-white/5 text-xs">
                        <span className="font-mono text-[9px] uppercase text-gray-500 block mb-1">Items Listed:</span>
                        {req.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-mono">
                            <span className="text-gray-300">{it.name}</span>
                            <span className="text-white font-bold">QTY: {it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {req.rejectionReason && (
                        <div className="p-2.5 rounded-lg bg-neutral-950 border border-white/5 text-[11px] text-gray-400">
                          <span className="font-bold text-amber-500 font-mono block uppercase text-[9px]">Justification / Reason:</span>
                          "{req.rejectionReason}"
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between items-end gap-3 min-w-[150px]">
                      {req.proofImageUrl ? (
                        <div className="bg-neutral-950 p-1.5 rounded-lg border border-white/10 text-center w-full">
                          <span className="text-[8px] font-mono text-gray-500 block uppercase mb-1">Attached Photo Proof:</span>
                          <a href="#" className="text-[#a1c398] hover:underline font-mono text-[10px] flex items-center justify-center gap-1">
                            <Camera className="w-3.5 h-3.5" />
                            View Slip Image
                          </a>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-[10px] italic font-mono">No photobook attachment</div>
                      )}

                      {isPending && (role === "OWNER" || role === "DEVELOPER") && (
                        <div className="flex gap-2 w-full mt-auto">
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="flex-1 py-1.5 bg-red-950 hover:bg-red-900 text-red-400 font-bold text-[10px] uppercase font-mono rounded-lg transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveRequest(req)}
                            className="flex-1 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-bold text-[10px] uppercase font-mono rounded-lg transition-all"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. LOCATIONS & HUB SETTING (For Owners/Developers) */}
      {invTab === "locations" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Active storage hubs */}
          <div className="lg:col-span-7 bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-mono text-[#a1c398] font-bold uppercase tracking-widest">📍 Active Depot Stations</h4>
            
            <div className="space-y-3">
              {locations.map((loc) => (
                <div key={loc.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#a1c398] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-white text-xs">{loc.name}</h5>
                    <p className="text-[11px] text-gray-400 font-light mt-1 leading-relaxed">{loc.address || "No precise coordinate address log."}</p>
                    <span className="text-[9px] font-mono uppercase font-bold text-gray-500 mt-2 block">ID: {loc.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Location Creator Form */}
          <div className="lg:col-span-5 space-y-6">
            {canManageLocations ? (
              <>
                <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
                  <h4 className="text-xs font-mono text-[#a1c398] font-bold uppercase tracking-widest">✨ Create New Hub Depot</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                    Add another transit node point state. This will expand the multi-depot inventory grid spreadsheet.
                  </p>

                  <form onSubmit={handleCreateLocation} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono text-gray-400 uppercase">Station Hub Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Northern Hub (Penang)"
                        value={newLocName}
                        onChange={(e) => setNewLocName(e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono text-gray-400 uppercase">Hub Physical Address</label>
                      <textarea
                        required
                        placeholder="e.g. No. 56, Jalan Gurney, 10250 Georgetown, Penang"
                        value={newLocAddress}
                        onChange={(e) => setNewLocAddress(e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white h-20 outline-none focus:border-[#799351]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#799351] hover:bg-[#5f743e] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                    >
                      📍 Create Storage Hub Depot
                    </button>
                  </form>
                </div>

                {/* Developer Catalog Registrator */}
                <div className="bg-neutral-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md space-y-4">
                  <h4 className="text-xs font-mono text-amber-500 font-bold uppercase tracking-widest">⚙️ Register New Catalog Item</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                    Add new hardware classes (e.g. LED displays, iPad booths) into the database.
                  </p>

                  <form onSubmit={handleCreateCatalogItem} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-mono text-gray-400 uppercase">Equipment Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. iPad Booth Station Lite 1"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#799351]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-mono text-gray-400 uppercase">Category</label>
                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value)}
                          className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white outline-none"
                        >
                          <option value="Camera">Camera</option>
                          <option value="Printer">Printer</option>
                          <option value="Backdrop">Backdrop</option>
                          <option value="Consumables">Consumables</option>
                          <option value="Lighting">Lighting</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-mono text-gray-400 uppercase">Low Limit Threshold</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={newItemThreshold}
                          onChange={(e) => setNewItemThreshold(parseInt(e.target.value) || 2)}
                          className="p-2.5 bg-neutral-950 border border-white/10 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-white/10 text-white text-xs font-bold uppercase font-mono tracking-wider rounded-xl transition-all"
                    >
                      📦 Register Catalog Hardware
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="p-6 bg-red-950/20 border border-red-500/10 rounded-3xl text-center text-xs space-y-2">
                <ShieldCheck className="w-8 h-8 text-red-400 mx-auto" />
                <span className="font-bold text-white block">Depot Controls Restricted</span>
                <p className="text-gray-400">Only Developer and Owner credentials can create depot hubs or modify master equipment definitions.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
