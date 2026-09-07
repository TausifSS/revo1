import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutGrid, Calendar, Wallet, Award, ArrowRight, 
  MapPin, Sparkles, QrCode, ClipboardList, Clock 
} from "lucide-react";
import { authService } from "../services/auth.service";
import { bookingService } from "../services/booking.service";
import { rewardService } from "../services/reward.service";
import { apiClient } from "../services/apiClient";
import { secureStorage } from "../services/secureStorage";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  
  const [bookings, setBookings] = useState([]);
  const [rewardStatus, setRewardStatus] = useState({ points: 0, membershipLevel: "Standard Member", history: [] });
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [bookingsData, rewardsData] = await Promise.all([
          bookingService.getBookings(),
          rewardService.getRewardStatus().catch(err => {
            console.warn("Failed to load rewards status:", err);
            return { points: 0, membershipLevel: "Standard Member", history: [] };
          })
        ]);
        setBookings(bookingsData || []);
        setRewardStatus(rewardsData);
        
        // Fetch fresh profile from backend to check if admin approved host status
        try {
          const profileRes = await apiClient.get("/api/v1/user/profile");
          if (profileRes && profileRes.success && profileRes.data) {
            const freshUser = profileRes.data;
            const cachedUser = authService.getCurrentUser();
            if (cachedUser) {
              cachedUser.membershipLevel = freshUser.membershipLevel;
              cachedUser.role = freshUser.role;
              secureStorage.setItem("reservo_user", cachedUser);
            }
            if (freshUser.membershipLevel === "Host Approved") {
              setShowApprovalModal(true);
            }
          }
        } catch (e) {
          console.warn("Failed to fetch fresh user profile:", e);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        // Even if API calls fail, still show dashboard with empty data
        setBookings([]);
        setRewardStatus({ points: 0, membershipLevel: "Standard Member", history: [] });
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleCloseApprovalModal = async () => {
    setShowApprovalModal(false);
    try {
      await apiClient.put("/api/v1/user/profile", {
        membershipLevel: "Host Partner"
      });
      const curUser = secureStorage.getItem("reservo_user");
      if (curUser) {
        curUser.membershipLevel = "Host Partner";
        curUser.role = "ROLE_OWNER"; // Update their local role to Host immediately!
        secureStorage.setItem("reservo_user", curUser);
      }
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Failed to reset approved notification tier:", e);
    }
  };

  // Calculate Next Stay
  const upcomingBookings = bookings
    .filter(b => b.status === "Confirmed" || b.status === "Upcoming")
    .filter(b => b.checkin && new Date(b.checkin) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.checkin) - new Date(b.checkin));

  const nextBooking = upcomingBookings[0] || null;

  let nextStayTitle = "No Stays Booked";
  let nextStaySubtext = "Explore destinations";
  if (nextBooking) {
    nextStayTitle = nextBooking.resortName;
    const days = Math.ceil((new Date(nextBooking.checkin) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    nextStaySubtext = days === 0 ? "Starts Today!" : days === 1 ? "Starts Tomorrow!" : `Starts in ${days} Days`;
  }

  // Calculate stats
  const completedCount = bookings.filter(b => b.status === "Completed" || b.status === "Confirmed").length;
  const uniqueResortsCount = new Set(bookings.map(b => b.resortName)).size;

  return (
    <div className="min-h-screen bg-bg-light pt-28 pb-20 px-6 font-sans transition-colors duration-300">
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-5 border border-border-color shadow-2xl animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <h3 className="text-xl font-extrabold text-text-dark font-serif">Yes, you get approved!</h3>
            <p className="text-xs text-text-gray leading-relaxed">
              Your host registration request has been reviewed and accepted by the Reservo Administration Team. 
              <br /><strong className="text-emerald-600 font-extrabold mt-1.5 block">Enjoy your earnings!</strong>
            </p>
            <button
              onClick={handleCloseApprovalModal}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none shadow transition-all"
            >
              Start Onboarding
            </button>
          </div>
        </div>
      )}
      <div className="max-w-[1200px] mx-auto space-y-8 animate-fade-in">
        
        {/* Header Greeting */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-color pb-6">
          <div>
            <h1 className="text-3xl font-serif font-extrabold text-text-dark">
              Welcome back, {user?.name || user?.displayName || user?.email?.split('@')[0] || "User"} 👋
            </h1>
            <p className="text-sm text-text-gray mt-1">Manage your luxury stays, rewards points, and active travel passes here.</p>
          </div>
          <button 
            onClick={() => navigate("/ai-planner")}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow hover:bg-primary-dark border-none cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Plan New Trip
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Next Stay Card */}
              <div className="bg-bg-white border border-border-color rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
                <div className="flex justify-between items-center text-text-gray">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Next Stay</span>
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-baseline gap-1 my-1 h-7">
                  <h3 className="text-base font-bold text-text-dark truncate max-w-full">
                    {nextStayTitle}
                  </h3>
                </div>
                <p className="text-[11px] text-text-gray font-semibold">{nextStaySubtext}</p>
              </div>

              {/* Member Tier Card */}
              <div className="bg-bg-white border border-border-color rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
                <div className="flex justify-between items-center text-text-gray">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Member Tier</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1 my-1 h-7">
                  <h3 className="text-base font-bold text-text-dark">{rewardStatus.membershipLevel || "Standard Member"}</h3>
                </div>
                <p className="text-[11px] text-text-gray font-semibold">Reservo Status Tier</p>
              </div>

              {/* Reward Points Card */}
              <div className="bg-bg-white border border-border-color rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
                <div className="flex justify-between items-center text-text-gray">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Reward Points</span>
                  <Wallet className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-1 my-1 h-7">
                  <h3 className="text-base font-bold text-text-dark">{(rewardStatus.points || 0).toLocaleString()} pts</h3>
                </div>
                <p className="text-[11px] text-text-gray font-semibold">₹{(Math.round((rewardStatus.points || 0) * 0.1)).toLocaleString()} Value Equivalent</p>
              </div>

              {/* Total Bookings Card */}
              <div className="bg-bg-white border border-border-color rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[130px]">
                <div className="flex justify-between items-center text-text-gray">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Bookings</span>
                  <ClipboardList className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex items-baseline gap-1 my-1 h-7">
                  <h3 className="text-base font-bold text-text-dark">{completedCount} Active/Completed</h3>
                </div>
                <p className="text-[11px] text-text-gray font-semibold">Across {uniqueResortsCount} Destinations</p>
              </div>
            </div>

            {/* Inner Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Active Pass (Left) */}
              <div className="lg:col-span-8 bg-bg-white border border-border-color rounded-3xl p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-serif font-extrabold text-text-dark border-b border-border-color pb-3">Active Vacation Pass</h2>
                
                {nextBooking ? (
                  <div className="bg-bg-light border border-border-color rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="bg-white p-4 rounded-xl border border-border-color shadow-sm shrink-0">
                      <QrCode className="w-32 h-32 text-slate-800" />
                    </div>
                    <div className="flex-1 space-y-4 text-[12px] font-semibold text-text-dark">
                      <div>
                        <span className="text-text-gray block text-[10px]">Resort Stay</span>
                        <span className="text-sm font-bold text-primary">{nextBooking.resortName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-text-gray block text-[10px]">Check-in Date</span>
                          <span>{nextBooking.checkin}</span>
                        </div>
                        <div>
                          <span className="text-text-gray block text-[10px]">Guests Details</span>
                          <span>{nextBooking.guests || 2} guests ({nextBooking.roomTitle})</span>
                        </div>
                        <div>
                          <span className="text-text-gray block text-[10px]">Transit Route</span>
                          <span>Express Entry Confirmed</span>
                        </div>
                        <div>
                          <span className="text-text-gray block text-[10px]">Location</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> {nextBooking.location || "India"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-bg-light border border-dashed border-border-color rounded-2xl">
                    <QrCode className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                    <h4 className="text-sm font-extrabold text-text-dark">No Active Vacation Pass</h4>
                    <p className="text-xs text-text-gray mt-1 max-w-xs mx-auto">
                      Once you book a resort, your QR entry pass and check-in details will automatically appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Rivo Assistance (Right) */}
              <div className="lg:col-span-4 bg-[#1E293B] text-white rounded-3xl p-6 shadow-md relative overflow-hidden space-y-5">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/30 to-transparent rounded-full filter blur-xl" />
                
                <div>
                  <span className="bg-gold text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">AI Concierge</span>
                  <h3 className="text-lg font-serif font-bold mt-2.5">Need help on your trip?</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">Rivo is configured to manage check-ins, request fresh towels, and book transport transfers directly inside the companion chat popup.</p>
                </div>

                <button 
                  onClick={() => navigate("/ai-planner")}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-extrabold text-[10.5px] uppercase tracking-wider rounded-xl shadow cursor-pointer border-none flex items-center justify-center gap-1.5"
                >
                  Consult Rivo AI <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Reward History */}
            <div className="bg-bg-white border border-border-color rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-serif font-extrabold text-text-dark border-b border-border-color pb-3">Points Activity</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] font-semibold text-text-dark border-collapse">
                  <thead>
                    <tr className="border-b border-border-color text-text-gray text-[10px] uppercase">
                      <th className="py-2.5">Activity Detail</th>
                      <th>Transaction ID</th>
                      <th>Date</th>
                      <th className="text-right">Points Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color">
                    {rewardStatus.history && rewardStatus.history.length > 0 ? (
                      rewardStatus.history.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-3 flex items-center gap-2">💎 {tx.description}</td>
                          <td className="text-text-gray font-mono">{tx.id}</td>
                          <td className="text-text-gray">{tx.date}</td>
                          <td className={`${tx.points.startsWith("+") ? "text-emerald-500" : "text-rose-500"} text-right font-bold`}>{tx.points}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-stone-400 text-xs">
                          No reward points transactions recorded yet. Book stays to start earning loyalty points!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
