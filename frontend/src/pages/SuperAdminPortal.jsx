import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, Bed, Calendar, Users, DollarSign, Activity, 
  MessageSquare, BarChart3, Check, X, ShieldCheck, 
  ChevronRight, Clock, Star, Lock, Send, Download, 
  TrendingUp, Award, CheckCircle2, Plus, Info, MapPin, FileText, Sparkles, Settings,
  Mail, MailCheck, Bell, Key, Copy, ExternalLink, CheckCheck, Eye, ShieldAlert, Trash2
} from "lucide-react";
import { authService } from "../services/auth.service";
import { apiClient } from "../services/apiClient";
import { useToast } from "../context/ToastContext";
import { secureStorage } from "../services/secureStorage";
import logoImage from "../assets/images/logo.png";

export default function SuperAdminPortal() {
  const toast = useToast();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Selected Section State
  const [activeTab, setActiveTab] = useState("dashboard");

  // Global State variables
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResorts: 0,
    pendingRequests: 0,
    approvedResorts: 0,
    activeBookings: 0,
    cancelledBookings: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    pendingReports: 3,
    pendingReviews: 1
  });

  const [usersList, setUsersList] = useState([]);
  const [resortsList, setResortsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [pendingHosts, setPendingHosts] = useState([]);
  const [pendingResorts, setPendingResorts] = useState([]);
  const [couponsList, setCouponsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, admin: "reservo@mail.in", action: "PLATFORM_INITIALIZED", target: "System", time: "2026-08-24 10:00 AM" },
    { id: 2, admin: "reservo@mail.in", action: "COUPON_CREATED", target: "WELCOME10", time: "2026-08-24 04:30 PM" }
  ]);
  const [reportsList, setReportsList] = useState([
    { id: 101, reporter: "Amit Sharma", stay: "Azure Bay Resort", issue: "Fake photos uploaded", status: "New", date: "2026-08-25" },
    { id: 102, reporter: "Sneha Patel", stay: "Royal Oasis", issue: "Charged extra for amenities", status: "Under Review", date: "2026-08-24" },
    { id: 103, reporter: "Rohan Das", stay: "Himalayan Ridge", issue: "Wrong location coordinates", status: "Resolved", date: "2026-08-23" }
  ]);
  const [reviewsList, setReviewsList] = useState([
    { id: 201, author: "Rahul K.", rating: 2.0, text: "Extremely dirty place. Do not recommend.", stay: "Azure Bay Resort", status: "Reported" },
    { id: 202, author: "Pooja M.", rating: 5.0, text: "Absolute heaven! Best hospitality ever.", stay: "Royal Oasis", status: "Published" }
  ]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms states
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [selectedRequestUserId, setSelectedRequestUserId] = useState(null);
  const [changesComment, setChangesComment] = useState("");

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minimumAmount: "",
    expiryDate: "",
    usageLimit: "100"
  });

  const [notification, setNotification] = useState({
    target: "all_users",
    title: "",
    message: ""
  });

  // Search filter states
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [searchResortQuery, setSearchResortQuery] = useState("");
  const [searchBookingQuery, setSearchBookingQuery] = useState("");

  // Audit logger helper
  const addAuditLog = (action, target) => {
    const newLog = {
      id: Date.now(),
      admin: currentUser?.email || "admin@reservo",
      action: action,
      target: target,
      time: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Load all platform data
  const loadPlatformData = async () => {
    try {
      setLoading(true);
      const [usersRes, resortsRes, bookingsRes, pendingRes, couponsRes] = await Promise.all([
        apiClient.get("/api/v1/user/all-users").catch(() => ({ success: false })),
        apiClient.get("/api/v1/resorts/admin-all").catch(() => ({ success: false })),
        apiClient.get("/api/v1/bookings/admin-all").catch(() => ({ success: false })),
        apiClient.get("/api/v1/admin/resorts/pending").catch(() => ({ success: false })),
        apiClient.get("/api/v1/admin/coupons").catch(() => ({ success: false }))
      ]);

      const users = usersRes?.data || [];
      const resorts = resortsRes?.data || [];
      const bookings = bookingsRes?.data || [];
      const pending = pendingRes?.data || [];
      const coupons = couponsRes?.data || [];

      setUsersList(users);
      setResortsList(resorts);
      setBookingsList(bookings);
      setPendingResorts(pending);
      setCouponsList(coupons);
      // Keep the legacy host-application list separate. Property approval is now
      // driven by the Resort PENDING_APPROVAL status, not by host/KYC approval.
      setPendingHosts([]);

      // Extract statistics
      const totalRev = bookings
        .filter(b => b.status === "Confirmed" || b.status === "Completed")
        .reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);

      setStats({
        totalUsers: users.length,
        totalResorts: resorts.length,
        pendingRequests: pending.length,
        approvedResorts: resorts.filter(r => r.status === "APPROVED").length,
        activeBookings: bookings.filter(b => b.status === "Confirmed" || b.status === "Upcoming").length,
        cancelledBookings: bookings.filter(b => b.status === "Cancelled").length,
        todayRevenue: Math.floor(totalRev * 0.05), // Mock today's revenue estimate
        totalRevenue: totalRev,
        pendingReports: 3,
        pendingReviews: 1
      });

    } catch (err) {
      console.error("Failed to load platform dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  // Approve Host Request
  const handleApproveHost = async (userId, userName) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/api/v1/user/approve-host?userId=${userId}`);
      if (res && res.success) {
        // Silently approved — no popup
        addAuditLog("OWNER_APPROVED", `${userName || "User ID " + userId} promoted to Owner`);
        loadPlatformData();
      }
    } catch (err) {
      toast("Failed to approve host application: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Host Request
  const handleRejectHost = async (userId, userName) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/api/v1/user/reject-host?userId=${userId}`);
      if (res && res.success) {
        toast(`Rejected host application for ${userName || "User"}`, "info");
        addAuditLog("OWNER_REJECTED", `${userName || "User ID " + userId} application rejected`);
        loadPlatformData();
      }
    } catch (err) {
      toast("Failed to reject host: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Request Changes Handler
  const openChangesModal = (userId) => {
    setSelectedRequestUserId(userId);
    setChangesComment("");
    setShowChangesModal(true);
  };

  const submitChangesRequest = async () => {
    if (!changesComment.trim()) {
      toast("Please provide changes feedback details.", "warning");
      return;
    }
    setActionLoading(true);
    try {
      const user = pendingHosts.find(h => h.id === selectedRequestUserId);
      
      toast("Changes request feedback submitted successfully!", "info");
      addAuditLog("CHANGES_REQUESTED", `Requested changes for user ${user?.name || selectedRequestUserId}: ${changesComment}`);
      
      setPendingHosts(prev => prev.filter(h => h.id !== selectedRequestUserId));
      setShowChangesModal(false);
    } catch (err) {
      toast("Error submitting changes request: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Change User Status (Active/Suspended/Blocked)
  const handleChangeUserStatus = async (userId, userName, status) => {
    try {
      const res = await apiClient.post(`/api/v1/user/change-status?userId=${userId}&status=${status}`);
      if (res && res.success) {
        toast(`Successfully updated status of ${userName} to ${status}`, "success");
        addAuditLog("USER_STATUS_CHANGED", `${userName} account status set to ${status}`);
        loadPlatformData();
      }
    } catch (err) {
      toast("Failed to change user status: " + err.message, "error");
    }
  };

  // Change Resort Listing Status (Approved, Suspended, Inactive)
  const handleChangeResortStatus = async (resortId, resortName, status) => {
    try {
      const res = await apiClient.patch(`/api/v1/admin/resorts/${encodeURIComponent(resortId)}/status?status=${encodeURIComponent(status)}`);
      if (res && res.success) {
        toast(`Successfully changed status of '${resortName}' to ${status}`, "success");
        addAuditLog("PROPERTY_STATUS_CHANGED", `'${resortName}' listing status set to ${status}`);
        setPendingResorts(prev => prev.filter(r => String(r.id) !== String(resortId)));
        loadPlatformData();
      }
    } catch (err) {
      toast("Failed to update property listing status: " + err.message, "error");
    }
  };

  // Change Booking Status (Cancelled, Refunded, Confirmed)
  const handleChangeBookingStatus = async (bookingId, bookingCode, status) => {
    try {
      const res = await apiClient.post(`/api/v1/bookings/update-status?bookingId=${bookingId}&status=${status}`);
      if (res && res.success) {
        toast(`Booking status updated to ${status}`, "success");
        addAuditLog("BOOKING_STATUS_CHANGED", `Booking ${bookingCode} set to ${status}`);
        loadPlatformData();
      }
    } catch (err) {
      toast("Failed to update booking status: " + err.message, "error");
    }
  };

  // Handle Coupon Creation
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim() || !newCoupon.discountValue) {
      toast("Please fill in coupon code and value details", "warning");
      return;
    }
    try {
      const payload = {
        code: newCoupon.code.trim().toUpperCase(),
        discountType: newCoupon.discountType,
        discountValue: parseFloat(newCoupon.discountValue),
        minimumAmount: parseFloat(newCoupon.minimumAmount || 0),
        expiryDate: newCoupon.expiryDate || null,
        usageLimit: parseInt(newCoupon.usageLimit || 100),
        usedCount: 0,
        status: "ACTIVE",
        userId: null,
        resortId: null
      };

      const res = await apiClient.post("/api/v1/admin/coupons", payload);
      if (!res?.success) {
        throw new Error(res?.message || "Failed to create coupon.");
      }

      const created = res.data;
      setCouponsList(prev => [created, ...prev.filter(c => String(c.id) !== String(created.id))]);
      toast(`Successfully created coupon ${created.code}!`, "success");
      addAuditLog("COUPON_CREATED", `Platform coupon ${created.code} created`);
      setNewCoupon({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        minimumAmount: "",
        expiryDate: "",
        usageLimit: "100"
      });
    } catch (err) {
      toast("Failed to create coupon: " + err.message, "error");
    }
  };

  // Handle Global Notifications Broadcast
  const handleSendNotification = (e) => {
    e.preventDefault();
    if (!notification.title || !notification.message) {
      toast("Please fill in both announcement title and body.", "warning");
      return;
    }
    toast(`Notification broadcast sent to target: ${notification.target}`, "success");
    addAuditLog("NOTIFICATION_BROADCAST", `Broadcast sent: "${notification.title}" to ${notification.target}`);
    setNotification({ target: "all_users", title: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased">
      
      {/* 🛡️ SIDEBAR PANEL */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          <div className="p-6 border-b border-slate-200 flex items-center gap-3">
            <img src={logoImage} alt="Reservo Logo" className="w-10 h-10 object-contain transition-transform duration-300 hover:scale-105" />
            <div>
              <h1 className="text-sm font-black tracking-wider text-slate-800 font-serif">RESERVO TEAM</h1>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-0.5">Super Admin Mode</p>
            </div>
          </div>

          {/* User profile info */}
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center font-serif text-sm font-extrabold">
              RA
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-700 truncate">Reservo Team Admin</div>
              <div className="text-[9.5px] text-slate-400 truncate mt-0.5">{currentUser?.email || "admin@reservo.in"}</div>
            </div>
          </div>

          {/* Navigation options */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[60vh] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "host_requests", label: "Property Requests", icon: Clock, badge: pendingResorts.length > 0 ? pendingResorts.length : null },
              { id: "properties", label: "Properties", icon: Building2 },
              { id: "users", label: "Users", icon: Users },
              { id: "bookings", label: "Bookings", icon: Calendar },
              { id: "payments", label: "Payments", icon: DollarSign },
              { id: "coupons", label: "Coupons & Rewards", icon: Award },
              { id: "reviews", label: "Reviews", icon: Star },
              { id: "reports", label: "Reports & Support", icon: ShieldAlert, badge: reportsList.filter(r => r.status === "New").length || null },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "audit_logs", label: "Audit Logs", icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-none transition text-xs font-bold cursor-pointer text-left ${
                    active 
                      ? "bg-blue-50 text-blue-600 border border-blue-200/60" 
                      : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[9px] font-extrabold bg-[#2563EB] text-white px-1.5 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-2 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-350 text-xs font-bold rounded-xl cursor-pointer transition-all"
          >
            ← Leave Admin Area
          </button>
        </div>
      </aside>

      {/* 🖥️ MAIN WORKSPACE */}
      <main className="flex-grow p-8 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200">
        
        {/* Loading overlay */}
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Admin Ledger...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header section */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-2xl font-black font-serif tracking-wide capitalize text-slate-800">
                  {activeTab.replace("_", " ")}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Reservo platform overview for Super Admin. Update listings, configure promos, and moderate users.
                </p>
              </div>
              <button
                onClick={loadPlatformData}
                className="p-2 bg-white border border-slate-250 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer transition-all"
                title="Refresh Ledger"
              >
                <Activity size={16} />
              </button>
            </div>

            {/* TAB CONTENT MAPPINGS */}
            
            {/* 1. DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                
                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Platform Users", val: stats.totalUsers, color: "text-[#2563EB]", desc: "Registered accounts" },
                    { label: "Properties / Hotels", val: stats.totalResorts, color: "text-blue-500", desc: "Listed inventory" },
                    { label: "Pending Host Approvals", val: stats.pendingRequests, color: "text-amber-600", desc: "Awaiting review" },
                    { label: "Active Booking Passes", val: stats.activeBookings, color: "text-indigo-600", desc: "Current guest stays" },
                    { label: "Total Platform Volume", val: `₹${stats.totalRevenue.toLocaleString()}`, color: "text-[#2563EB]", desc: "Stripe & Sandbox escrow" },
                    { label: "Pending Disputes", val: stats.pendingReports, color: "text-rose-600", desc: "Complaints filed" }
                  ].map((s, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between min-h-[120px] shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</span>
                      <div className={`text-2xl font-extrabold ${s.color} mt-2`}>{s.val}</div>
                      <span className="text-[10.5px] text-slate-500 mt-1 block font-medium">{s.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Quick actions box */}
                <div className="bg-gradient-to-br from-blue-50/40 to-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Super Administrator Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setActiveTab("host_requests")}
                      className="py-3 px-4 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none shadow transition-all"
                    >
                      Verify Pending Hosts ({stats.pendingRequests})
                    </button>
                    <button
                      onClick={() => setActiveTab("coupons")}
                      className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      Configure Coupons
                    </button>
                    <button
                      onClick={() => setActiveTab("notifications")}
                      className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      Broadcast Announcement
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PROPERTY VERIFICATION REQUESTS */}
            {activeTab === "host_requests" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Property Requests</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Review property applications submitted by users. Only approved properties become visible on the public platform.
                  </p>
                </div>

                {pendingResorts.length === 0 ? (
                  <div className="text-center py-16 border border-slate-200 bg-white rounded-3xl shadow-xs">
                    <div className="text-4xl mb-3">🏡</div>
                    <h3 className="text-sm font-bold text-slate-700">No pending property requests</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      New owner submissions with PENDING_APPROVAL status will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingResorts.map(resort => (
                      <div
                        key={resort.id}
                        className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xs"
                      >
                        <div className="flex gap-4 items-start min-w-0">
                          <img
                            src={resort.imageUrl || ""}
                            alt={resort.name || "Property"}
                            className="w-28 h-20 rounded-xl object-cover bg-slate-100 shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="min-w-0 space-y-2">
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-800">
                                {resort.name || "Untitled Property"}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {resort.location || "Location not provided"} • Owner ID: {resort.ownerId || "Unknown"}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[10px]">
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                PENDING APPROVAL
                              </span>
                              {resort.category && (
                                <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                                  {resort.category}
                                </span>
                              )}
                              {resort.pricePerNight != null && (
                                <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                                  ₹{Number(resort.pricePerNight).toLocaleString("en-IN")}/night
                                </span>
                              )}
                            </div>

                            {resort.description && (
                              <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl">
                                {resort.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end">
                          <button
                            onClick={() => handleChangeResortStatus(resort.id, resort.name, "REJECTED")}
                            className="flex-1 lg:flex-none text-xs font-bold px-4 py-2.5 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleChangeResortStatus(resort.id, resort.name, "APPROVED")}
                            className="flex-1 lg:flex-none text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer border-none shadow transition-all"
                          >
                            Approve & Publish
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. PROPERTIES MANAGEMENT */}
            {activeTab === "properties" && (
              <div className="space-y-6">
                {/* Search bar */}
                <div className="relative max-w-sm">
                  <input
                    type="text"
                    placeholder="Search resorts..."
                    value={searchResortQuery}
                    onChange={(e) => setSearchResortQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl outline-none focus:border-blue-600"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {resortsList
                    .filter(r => r.name?.toLowerCase().includes(searchResortQuery.toLowerCase()) || r.location?.toLowerCase().includes(searchResortQuery.toLowerCase()))
                    .map(resort => (
                      <div key={resort.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                        <div className="flex gap-4 items-center">
                          <img
                            src={resort.imageUrl || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=150"}
                            alt={resort.name}
                            className="w-16 h-12 rounded-lg object-cover bg-slate-100"
                          />
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800">{resort.name}</h4>
                            <p className="text-[11px] text-slate-500">{resort.location} • Owner ID: {resort.owner?.id || "System"}</p>
                            <span className={`inline-block text-[9.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-full mt-2 border ${
                              resort.status === "APPROVED" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                                : resort.status === "PENDING_APPROVAL"
                                ? "bg-amber-50 text-amber-700 border-amber-250"
                                : "bg-red-50 text-red-700 border-red-250"
                            }`}>
                              {resort.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                          {resort.status === "APPROVED" ? (
                            <button
                              onClick={() => handleChangeResortStatus(resort.id, resort.name, "SUSPENDED")}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer"
                            >
                              Suspend Listing
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangeResortStatus(resort.id, resort.name, "APPROVED")}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white border-none cursor-pointer"
                            >
                              Approve / Activate Listing
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 4. USER MANAGEMENT */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="relative max-w-sm">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl outline-none focus:border-blue-600"
                  />
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>

                <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-550 border-b border-slate-200">
                        <th className="p-4 font-bold">Name</th>
                        <th className="p-4 font-bold">Email</th>
                        <th className="p-4 font-bold">Role</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 text-right font-bold">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList
                        .filter(u => u.name?.toLowerCase().includes(searchUserQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchUserQuery.toLowerCase()))
                        .map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 text-slate-700">
                            <td className="p-4 font-extrabold text-slate-800">{user.name}</td>
                            <td className="p-4 text-slate-500">{user.email}</td>
                            <td className="p-4 text-slate-550">{user.role}</td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                user.status === "ACTIVE" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {user.status === "ACTIVE" ? (
                                <button
                                  onClick={() => handleChangeUserStatus(user.id, user.name, "BLOCKED")}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded border border-red-200 text-red-655 bg-red-50 hover:bg-red-100 cursor-pointer"
                                >
                                  Block
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleChangeUserStatus(user.id, user.name, "ACTIVE")}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded border border-emerald-200 text-emerald-655 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                                >
                                  Unblock
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. BOOKINGS MANAGEMENT */}
            {activeTab === "bookings" && (
              <div className="space-y-6">
                <div className="relative max-w-sm">
                  <input
                    type="text"
                    placeholder="Search bookings code..."
                    value={searchBookingQuery}
                    onChange={(e) => setSearchBookingQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs rounded-xl outline-none focus:border-blue-600"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>

                <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-550 border-b border-slate-200">
                        <th className="p-4 font-bold">Code</th>
                        <th className="p-4 font-bold">Stay</th>
                        <th className="p-4 font-bold">Check-in / Out</th>
                        <th className="p-4 font-bold">Amount</th>
                        <th className="p-4 font-bold">Booking Status</th>
                        <th className="p-4 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookingsList
                        .filter(b => b.bookingCode?.toLowerCase().includes(searchBookingQuery.toLowerCase()))
                        .map(b => (
                          <tr key={b.id} className="hover:bg-slate-50 text-slate-700">
                            <td className="p-4 font-extrabold text-slate-850">{b.bookingCode}</td>
                            <td className="p-4 text-slate-500">{b.resortName}</td>
                            <td className="p-4 text-slate-500">{b.checkin} to {b.checkout}</td>
                            <td className="p-4 text-slate-800 font-bold">₹{(b.totalAmount || b.amount || 0).toLocaleString()}</td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                b.status === "Confirmed" || b.status === "CONFIRMED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : b.status === "Cancelled" || b.status === "CANCELLED"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {b.status !== "Cancelled" && b.status !== "CANCELLED" && (
                                <button
                                  onClick={() => handleChangeBookingStatus(b.id, b.bookingCode, "CANCELLED")}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded border border-red-250 text-red-655 bg-red-50 hover:bg-red-100 cursor-pointer"
                                >
                                  Cancel Booking
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. PAYMENTS & REVENUE */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total platform Volume</span>
                      <span className="text-2xl font-black text-blue-600 block mt-2">₹{stats.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Est. Platform Fee (5%)</span>
                      <span className="text-2xl font-black text-blue-600 block mt-2">₹{Math.floor(stats.totalRevenue * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Settled Escrow Funds</span>
                      <span className="text-2xl font-black text-blue-600 block mt-2">₹{Math.floor(stats.totalRevenue * 0.95).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-550 border-b border-slate-200">
                        <th className="p-4 font-bold">Resort Name</th>
                        <th className="p-4 font-bold">Volume generated</th>
                        <th className="p-4 font-bold">Paid Out</th>
                        <th className="p-4 font-bold">Platform Fee share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {resortsList.map(resort => {
                        const totalResortVol = bookingsList
                          .filter(b => b.resortName === resort.name && (b.status === "Confirmed" || b.status === "Completed"))
                          .reduce((sum, b) => sum + (b.totalAmount || b.amount || 0), 0);
                        return (
                          <tr key={resort.id} className="hover:bg-slate-50">
                            <td className="p-4 font-extrabold text-slate-800">{resort.name}</td>
                            <td className="p-4 font-medium">₹{totalResortVol.toLocaleString()}</td>
                            <td className="p-4 font-medium">₹{Math.floor(totalResortVol * 0.95).toLocaleString()}</td>
                            <td className="p-4 font-bold text-blue-600">₹{Math.floor(totalResortVol * 0.05).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. COUPONS & REWARDS */}
            {activeTab === "coupons" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form to create coupon */}
                <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 self-start shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Create Platform Coupon</h3>
                  <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">Coupon Code</label>
                      <input
                        type="text"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        placeholder="E.g. MONSOON30"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-850 rounded-xl outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">Type</label>
                        <select
                          value={newCoupon.discountType}
                          onChange={(e) => setNewCoupon(prev => ({ ...prev, discountType: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-850 rounded-xl outline-none"
                        >
                          <option value="PERCENTAGE">Percentage</option>
                          <option value="FIXED">Fixed Amount</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold block">Value</label>
                        <input
                          type="number"
                          value={newCoupon.discountValue}
                          onChange={(e) => setNewCoupon(prev => ({ ...prev, discountValue: e.target.value }))}
                          placeholder="e.g. 10 or 500"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-850 rounded-xl outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">Min Booking Value (₹)</label>
                      <input
                        type="number"
                        value={newCoupon.minimumAmount}
                        onChange={(e) => setNewCoupon(prev => ({ ...prev, minimumAmount: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-850 rounded-xl outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold block">Expiry Date</label>
                      <input
                        type="date"
                        value={newCoupon.expiryDate}
                        onChange={(e) => setNewCoupon(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-250 text-slate-500 rounded-xl outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl cursor-pointer border-none shadow transition-all"
                    >
                      Publish Promo Coupon
                    </button>
                  </form>
                </div>

                {/* Coupons list */}
                <div className="lg:col-span-2 border border-slate-200 rounded-3xl p-6 bg-white space-y-4 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Coupons Ledger</h3>
                  
                  {couponsList.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      Create your first platform promo code using the panel form.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {couponsList.map((coupon, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold text-blue-600 tracking-wider text-sm">{coupon.code}</span>
                            <span className="block text-slate-450 mt-1 font-semibold">
                              {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} discount`} • Min: ₹{coupon.minimumAmount}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                if (!coupon.id) throw new Error("Coupon ID is missing.");
                                await apiClient.delete(`/api/v1/admin/coupons/${encodeURIComponent(coupon.id)}`);
                                setCouponsList(prev => prev.filter(c => String(c.id) !== String(coupon.id)));
                                toast("Coupon deleted", "info");
                              } catch (err) {
                                toast("Failed to delete coupon: " + err.message, "error");
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded border border-transparent text-slate-400 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 8. REVIEW MODERATION */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {reviewsList.map(review => (
                    <div key={review.id} className="p-5 rounded-2xl bg-white border border-slate-200 flex justify-between items-start text-xs shadow-xs text-slate-700">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-850">{review.author}</span>
                          <span className="text-slate-400 font-semibold">• Stay: {review.stay}</span>
                          <div className="flex text-amber-500">
                            {Array.from({ length: Math.floor(review.rating) }).map((_, i) => (
                              <Star key={i} size={12} fill="currentColor" />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 italic font-medium">"{review.text}"</p>
                      </div>
                      <button
                        onClick={() => {
                          setReviewsList(prev => prev.filter(r => r.id !== review.id));
                          toast("Review removed from stay listing", "success");
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-655 hover:bg-red-100 border border-red-200 rounded font-bold"
                      >
                        Remove Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. REPORTS & COMPLAINTS */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {reportsList.map(ticket => (
                    <div key={ticket.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs shadow-xs">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-850">Ticket #{ticket.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            ticket.status === "New" ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-sky-50 text-sky-600"
                          }`}>{ticket.status}</span>
                        </div>
                        <p className="text-slate-500 mt-2">Stay: <span className="text-slate-800 font-bold">{ticket.stay}</span> • Filed by: {ticket.reporter}</p>
                        <p className="text-slate-650 mt-1 italic">Reason: "{ticket.issue}"</p>
                      </div>

                      <div className="flex gap-2">
                        {ticket.status !== "Resolved" && (
                          <button
                            onClick={() => {
                              setReportsList(prev => prev.map(t => t.id === ticket.id ? { ...t, status: "Resolved" } : t));
                              toast("Complaint ticket resolved successfully", "success");
                              addAuditLog("DISPUTE_RESOLVED", `Ticket #${ticket.id} marked Resolved`);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border-none font-bold rounded-lg cursor-pointer animate-fade-in"
                          >
                            Resolve Ticket
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setReportsList(prev => prev.filter(t => t.id !== ticket.id));
                            toast("Complaint dismissed", "info");
                          }}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-lg cursor-pointer font-bold"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10. SYSTEM NOTIFICATIONS BROADCAST */}
            {activeTab === "notifications" && (
              <div className="max-w-xl bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-xs text-xs">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Broadcast In-App Alerts</h3>
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Target Audience</label>
                    <select
                      value={notification.target}
                      onChange={(e) => setNotification(prev => ({ ...prev, target: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none"
                    >
                      <option value="all_users">All Logged-in Users</option>
                      <option value="all_owners">All Resort Partners</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Alert Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Summer luxury promotion deals are live!"
                      value={notification.title}
                      onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:border-blue-600 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">Alert Body Message</label>
                    <textarea
                      placeholder="Type details of announcement..."
                      rows={4}
                      value={notification.message}
                      onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:border-blue-600 font-medium resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl border-none shadow cursor-pointer transition-all"
                  >
                    Broadcast Announcement
                  </button>
                </form>
              </div>
            )}

            {/* 11. AUDIT LOGS */}
            {activeTab === "audit_logs" && (
              <div className="space-y-6">
                <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-550 border-b border-slate-200">
                        <th className="p-4 font-bold">Timestamp</th>
                        <th className="p-4 font-bold">Admin Email</th>
                        <th className="p-4 font-bold">Action</th>
                        <th className="p-4 font-bold">Target Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-500">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-4 text-slate-450">{log.time}</td>
                          <td className="p-4 text-slate-700 font-bold">{log.admin}</td>
                          <td className="p-4 text-blue-600 font-bold">{log.action}</td>
                          <td className="p-4 text-slate-855 font-medium">{log.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* CHANGES REQUEST COMMENT DIALOG MODAL */}
      {showChangesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-800 font-serif">Request Application Changes</h4>
            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Feedback Comment</label>
              <textarea
                placeholder="e.g. Please upload clearer property photos and double check tax ID."
                rows={4}
                value={changesComment}
                onChange={(e) => setChangesComment(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:border-blue-600 text-xs font-semibold resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowChangesModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-550 bg-white hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitChangesRequest}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none shadow transition-all"
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
