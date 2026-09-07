import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Award, TrendingUp, CreditCard, Tag, Heart, X, Sparkles, RefreshCw } from "lucide-react";
import { rewardService } from "../services/reward.service";
import { Skeleton } from "../components/Skeleton";
import ErrorScreen from "../components/ErrorScreen";
import { authService } from "../services/auth.service";

function RewardCard({ icon, title, description, badge, onLearnMore }) {
  return (
    <div className="bg-bg-white border border-border-color rounded-3xl p-6 shadow-sm hover:shadow-custom hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
          {icon}
        </div>
        {badge && (
          <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-text-dark mb-2">{title}</h3>
      <p className="text-sm text-text-gray leading-relaxed mb-4">{description}</p>
      <button 
        onClick={onLearnMore}
        className="text-gold font-bold text-sm bg-transparent border-none cursor-pointer hover:underline p-0 m-0"
      >
        Learn More →
      </button>
    </div>
  );
}

export default function Rewards() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [activeReward, setActiveReward] = useState(null);
  const [rewardStatus, setRewardStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeeming, setRedeeming] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rewardService.getRewardStatus();
      setRewardStatus(data);
    } catch (err) {
      setError(err.message || "Failed to load rewards stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const showGlobalToast = (msg) => {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    if (toast && toastMessage) {
      toastMessage.textContent = msg;
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
      }, 3500);
    }
  };

  const handleRedeem = async () => {
    if (rewardStatus.points < 5000) {
      showGlobalToast("You need at least 5,000 points to redeem a coupon!");
      return;
    }
    setRedeeming(true);
    try {
      const result = await rewardService.redeemPoints(5000);
      setRewardStatus(prev => ({
        ...prev,
        points: result.updatedPoints,
        couponsCount: result.couponsCount
      }));
      showGlobalToast("Successfully redeemed 5,000 points for a discount coupon! 💎");
    } catch (err) {
      showGlobalToast(err.message || "Redemption failed.");
    } finally {
      setRedeeming(false);
    }
  };

  const CARDS_DATA = [
    {
      icon: <TrendingUp size={24} />,
      title: "Loyalty Points",
      description: "Earn 10 points for every $1 spent on bookings. Use points to get free nights and room upgrades."
    },
    {
      icon: <Tag size={24} />,
      title: "Promo Codes",
      description: "Get access to member-only promo codes during seasonal sales and festive periods.",
      badge: "New"
    },
    {
      icon: <Heart size={24} />,
      title: "Referral Rewards",
      description: "Invite a friend to Reservo and you both get a $50 coupon when they complete their first stay."
    },
    {
      icon: <CreditCard size={24} />,
      title: "Cashback Offers",
      description: "Pay with our partner credit cards to instantly receive up to 5% cashback on luxury stays."
    },
    {
      icon: <Award size={24} />,
      title: "Membership Levels",
      description: "Progress from Silver to Platinum to unlock early check-ins, late check-outs, and dedicated support."
    },
    {
      icon: <Gift size={24} />,
      title: "Birthday Surprise",
      description: "Travel during your birthday month and receive a complimentary bottle of champagne and spa voucher."
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light pt-32 pb-20 font-sans">
        <div className="max-w-[1200px] mx-auto w-[92%] space-y-10">
          <div className="text-center space-y-3">
            <Skeleton variant="text" className="w-48 h-8 mx-auto rounded-full" />
            <Skeleton variant="text" className="w-1/2 h-10 mx-auto" />
            <Skeleton variant="text" className="w-1/3 h-5 mx-auto" />
          </div>
          <div className="h-64 rounded-[32px] shimmer bg-bg-white border border-border-color" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-light pt-32 pb-20 px-6 flex items-center justify-center">
        <ErrorScreen type="network" message={error} onRetry={fetchStatus} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light pt-32 pb-20">
      <div className="max-w-[1200px] mx-auto w-[92%]">
        
        {/* Header */}
        <div className="text-center max-w-[600px] mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gold/10 text-gold font-bold text-sm px-4 py-1.5 rounded-full mb-4 border border-gold/20">
            <Award size={16} /> Reservo Elite
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-text-dark mb-4">
            Earn Rewards on Every Stay
          </h1>
          <p className="text-lg text-text-gray">
            Join our loyalty program to unlock exclusive discounts, room upgrades, and cashback offers.
          </p>
        </div>

        {/* User Status (Mock Service Integrated) */}
        {!user ? (
          <div className="bg-primary border border-border-color rounded-[32px] p-8 md:p-12 text-white mb-16 flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_rgba(15,23,42,0.15)] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/20 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="z-10 text-center md:text-left mb-6 md:mb-0 max-w-[500px]">
              <h2 className="text-2xl font-bold mb-2">Track Your Loyalty Rewards</h2>
              <p className="text-white/70">Sign in to view your points balance, available coupons, and unlock exclusive travel benefits.</p>
            </div>
            <div className="z-10 shrink-0">
              <button 
                onClick={() => navigate("/login")}
                className="font-bold py-3.5 px-8 rounded-xl border-none bg-gold text-white cursor-pointer hover:bg-gold-dark hover:scale-105 transition-all shadow-[0_10px_20px_rgba(212,166,79,0.3)]"
              >
                Sign In / Register
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-primary border border-border-color rounded-[32px] p-8 md:p-12 text-white mb-16 flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_rgba(15,23,42,0.15)] relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/20 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="z-10 text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || user?.displayName || user?.email?.split('@')[0] || "User"}!</h2>
              <p className="text-white/70 mb-4">You are currently a <strong className="text-gold">{rewardStatus.membershipLevel}</strong></p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[140px]">
                  <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Total Points</div>
                  <div className="text-3xl font-extrabold font-number text-gold">{rewardStatus.points.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[140px]">
                  <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Available Coupons</div>
                  <div className="text-3xl font-extrabold font-number">{rewardStatus.couponsCount}</div>
                </div>
              </div>
            </div>
            <div className="z-10">
              <button 
                onClick={handleRedeem}
                disabled={redeeming || rewardStatus.points < 5000}
                className={`font-bold py-3.5 px-8 rounded-xl border-none transition-all shadow-[0_10px_20px_rgba(212,166,79,0.3)] flex items-center gap-2 ${
                  redeeming || rewardStatus.points < 5000 
                    ? "bg-slate-500/50 text-white/50 cursor-not-allowed shadow-none" 
                    : "bg-gold text-white cursor-pointer hover:bg-gold-dark hover:scale-105"
                }`}
              >
                {redeeming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Redeeming...
                  </>
                ) : (
                  "Redeem 5,000 pts"
                )}
              </button>
              <span className="block text-center text-[10px] text-white/60 mt-2 font-medium">5,000 points = 1 Coupon pass</span>
            </div>
          </div>
        )}

        {/* Rewards Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-dark mb-8">Ways to Earn & Save</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CARDS_DATA.map((card, i) => (
              <RewardCard 
                key={i}
                icon={card.icon}
                title={card.title}
                description={card.description}
                badge={card.badge}
                onLearnMore={() => setActiveReward(card)}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Rewards Detailed Modal */}
      {activeReward && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-bg-white border border-border-color rounded-[32px] max-w-lg w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-left">
            <button 
              onClick={() => setActiveReward(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-bg-light hover:bg-slate-200 border-none cursor-pointer flex items-center justify-center text-text-dark"
            >
              <X size={16} />
            </button>
            <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6">
              {activeReward.icon}
            </div>
            <span className="text-[10px] bg-[#121e1b]/10 text-[#121e1b] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Rewards Tier</span>
            <h3 className="text-2xl font-extrabold text-text-dark mt-4 mb-3">{activeReward.title}</h3>
            <p className="text-text-gray text-sm leading-relaxed mb-6">{activeReward.description}</p>
            
            <div className="p-4 bg-bg-light border border-border-color rounded-2xl">
              <h4 className="text-xs uppercase tracking-wider text-text-dark font-bold mb-2">How to redeem:</h4>
              <p className="text-xs text-text-gray m-0 leading-relaxed">
                Redeem points immediately using the card at the top. Once converted, your coupon passes will be active automatically during checkouts. Or tell Rivo chatbot *"Redeem my loyalty points"*!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
