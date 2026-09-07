import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Globe, Shield, CreditCard, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { profileService } from "../services/profile.service";
import { bookingService } from "../services/booking.service";
import { authService } from "../services/auth.service";
import { ProfileSkeleton } from "../components/Skeleton";
import ErrorScreen from "../components/ErrorScreen";
import rivoSupport from "../assets/images/rivo_support.png";

// Define schema for personal details validation
const profileSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters." })
    .max(40, { message: "Name cannot exceed 40 characters." }),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Please enter a valid email address." }),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits." })
});

function Profile() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("details");

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm({
    resolver: zodResolver(profileSchema),
    mode: "onChange"
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, bookingsData] = await Promise.all([
        profileService.getProfile(),
        bookingService.getBookings()
      ]);
      setProfile(profileData);
      setBookings(bookingsData);
      // Populate form values
      reset({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone
      });
    } catch (err) {
      setError(err.message || "Failed to load profile parameters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const onSubmit = async (formData) => {
    try {
      const result = await profileService.updateProfile(formData);
      setProfile(result);
      showGlobalToast("Profile configurations updated successfully!");
      // Reset form with new values so it's not dirty anymore
      reset(formData);
    } catch (err) {
      showGlobalToast(err.message || "Failed to update profile.");
    }
  };

  if (loading) {
    return (
      <div className="py-30 pb-25 bg-bg-light min-h-screen">
        <div className="w-[90%] max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10 items-start">
          <div className="bg-bg-white border border-border-color rounded-3xl p-7.5 shadow-custom h-96 shimmer" />
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-6">
        <ErrorScreen type="network" message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="py-30 pb-25 bg-bg-light min-h-screen fade-up">
      <div className="w-[90%] max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10 items-start">
        
        {/* Left column info */}
        <aside className="bg-bg-white border border-border-color rounded-3xl p-7.5 shadow-custom text-center">
          <div className="relative w-30 h-30 mx-auto mb-5">
            <img 
              src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=150&q=80" 
              alt={profile.name} 
              className="w-full h-full rounded-full object-cover border-3 border-gold"
            />
             <span className="absolute -bottom-1.25 left-1/2 -translate-x-1/2 bg-[#121e1b] text-white text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shadow-[0_4px_10px_rgba(0,0,0,0.15)]">{profile.tier || "Standard Member"}</span>
          </div>

          <div className="profile-meta-info">
            <h2 className="text-2xl font-bold text-text-dark mb-1.25">{profile.name}</h2>
            <p className="text-xs text-text-gray mb-6.25">{profile.joined}</p>
          </div>

          <div className="bg-bg-light border border-border-color p-3.75 rounded-2xl mb-6.25">
            <span className="text-[11px] uppercase tracking-wider text-text-gray font-bold block mb-1.25">Loyalty Points Available</span>
            <h3 className="text-2xl font-extrabold text-text-dark">{profile.points || "0 pts"}</h3>
          </div>

          <nav className="flex flex-col gap-2.5">
            <button 
              onClick={() => setActiveSection("details")}
              className={`flex items-center gap-2.5 px-4.5 py-3 rounded-lg text-sm font-semibold border-none cursor-pointer text-left w-full transition-colors ${
                activeSection === "details" ? "text-text-dark bg-bg-light" : "text-text-gray bg-transparent hover:bg-bg-light hover:text-text-dark"
              }`}
            >
              <User size={16} /> Personal Info
            </button>
            <button 
              onClick={() => setActiveSection("history")}
              className={`flex items-center gap-2.5 px-4.5 py-3 rounded-lg text-sm font-semibold border-none cursor-pointer text-left w-full transition-colors ${
                activeSection === "history" ? "text-text-dark bg-bg-light" : "text-text-gray bg-transparent hover:bg-bg-light hover:text-text-dark"
              }`}
            >
              <CreditCard size={16} /> Booking History
            </button>
            <button 
              onClick={() => showGlobalToast("Security logs are protected.")}
              className="flex items-center gap-2.5 px-4.5 py-3 rounded-lg text-sm font-semibold text-text-gray no-underline transition-colors duration-300 bg-transparent border-none w-full text-left cursor-pointer hover:bg-bg-light hover:text-text-dark"
            >
              <Shield size={16} /> Security
            </button>
            <button 
              className="flex items-center gap-2.5 px-4.5 py-3 rounded-lg text-sm font-semibold text-red-500 no-underline transition-colors duration-300 bg-transparent border-none w-full text-left cursor-pointer hover:bg-red-500/5 mt-3.75"
              onClick={() => {
                authService.logout().then(() => {
                  navigate("/");
                  window.location.reload();
                });
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </nav>

          {/* Rivo Travel Buddy Card */}
          <div className="bg-[#1E293B] text-white p-5 rounded-2xl mt-7.5 border border-[#334155] text-left relative overflow-hidden flex items-center gap-4">
            <div className="flex-1 z-10">
              <span className="text-[9px] bg-gold text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Travel Buddy</span>
              <h4 className="text-base font-bold mt-2 mb-1">Rivo is here!</h4>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">Need help checking in or customizing your room temperature? Open my chat at the bottom right!</p>
            </div>
            <img src={rivoSupport} alt="Rivo Mascot" className="w-16 h-16 rounded-full object-cover border-2 border-gold shadow-md shrink-0" />
          </div>
        </aside>

        {/* Right column details */}
        <main className="flex flex-col gap-7.5">
          {activeSection === "details" && (
            <div className="bg-bg-white border border-border-color rounded-3xl p-10 shadow-custom animate-fade-in">
              {user?.role === "ROLE_OWNER" && (
                <div className="mb-6 p-5 rounded-2xl bg-slate-900/5 border border-slate-900/10 flex flex-col gap-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Verified Host Extranet
                    </span>
                    <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" /> Verified Host
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-dark mt-1">
                    <div>
                      <span className="block text-[9.5px] text-text-gray uppercase tracking-wider">Company Name</span>
                      <strong className="text-sm mt-0.5 block">{user.businessName || "Reservo Host Group"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9.5px] text-text-gray uppercase tracking-wider">Registered Resort</span>
                      <strong className="text-sm mt-0.5 block">{user.name || "Reservo Host Resort"}</strong>
                    </div>
                    <div>
                      <span className="block text-[9.5px] text-text-gray uppercase tracking-wider">Extranet Email</span>
                      <strong className="text-sm mt-0.5 block">{user.email}</strong>
                    </div>
                    <div>
                      <span className="block text-[9.5px] text-text-gray uppercase tracking-wider">Owner Contact</span>
                      <strong className="text-sm mt-0.5 block">{user.ownerPhone || "+91 98765 43210"}</strong>
                    </div>
                  </div>
                </div>
              )}
              <h3 className="text-2xl font-extrabold text-text-dark mb-1.5">Personal Information</h3>
              <p className="text-[13.5px] text-text-gray mb-7.5">Manage your basic accounts details and communication settings.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6.25">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Full Name */}
                  <div className="flex flex-col gap-2 relative">
                    <label htmlFor="name" className="text-xs font-bold text-text-dark uppercase tracking-wider flex items-center gap-1">
                      <User size={12} /> Full Name
                    </label>
                    <input 
                      id="name"
                      type="text" 
                      {...register("name")}
                      className={`p-3 px-4 rounded-lg border ${
                        errors.name ? "border-red-500 focus:border-red-500" : "border-border-color focus:border-gold"
                      } bg-bg-light text-text-dark text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(194,168,120,0.1)]`}
                    />
                    <AnimatePresence>
                      {errors.name && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5"
                        >
                          <AlertCircle size={10} /> {errors.name.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2 relative">
                    <label htmlFor="email" className="text-xs font-bold text-text-dark uppercase tracking-wider flex items-center gap-1">
                      <Mail size={12} /> Email Address
                    </label>
                    <input 
                      id="email"
                      type="email" 
                      {...register("email")}
                      className={`p-3 px-4 rounded-lg border ${
                        errors.email ? "border-red-500 focus:border-red-500" : "border-border-color focus:border-gold"
                      } bg-bg-light text-text-dark text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(194,168,120,0.1)]`}
                    />
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5"
                        >
                          <AlertCircle size={10} /> {errors.email.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-2 relative">
                    <label htmlFor="phone" className="text-xs font-bold text-text-dark uppercase tracking-wider flex items-center gap-1">
                      <Phone size={12} /> Mobile Number
                    </label>
                    <input 
                      id="phone"
                      type="text" 
                      {...register("phone")}
                      className={`p-3 px-4 rounded-lg border ${
                        errors.phone ? "border-red-500 focus:border-red-500" : "border-border-color focus:border-gold"
                      } bg-bg-light text-text-dark text-sm outline-none transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(194,168,120,0.1)]`}
                    />
                    <AnimatePresence>
                      {errors.phone && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5"
                        >
                          <AlertCircle size={10} /> {errors.phone.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Language */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="languageSelect" className="text-xs font-bold text-text-dark uppercase tracking-wider flex items-center gap-1">
                      <Globe size={12} /> Language / Currency
                    </label>
                    <select id="languageSelect" defaultValue="en_inr" className="p-3 px-4 rounded-lg border border-border-color bg-bg-light text-text-dark text-sm outline-none transition-all duration-300 focus:border-gold focus:shadow-[0_0_0_2px_rgba(194,168,120,0.1)]">
                      <option value="en_inr">English (INR)</option>
                      <option value="en_usd">English (USD)</option>
                      <option value="hi_inr">हिन्दी (INR)</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting || !isDirty}
                  className={`self-start border-none px-7.5 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 ${
                    isSubmitting || !isDirty 
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                      : "bg-primary text-bg-white hover:bg-gold hover:text-white hover:-translate-y-px"
                  }`}
                >
                  {isSubmitting ? "Saving changes..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {activeSection === "history" && (
            <div className="bg-bg-white border border-border-color rounded-3xl p-10 shadow-custom animate-fade-in">
              <h3 className="text-2xl font-extrabold text-text-dark mb-1.5">Active & Past Reservations</h3>
              <p className="text-[13.5px] text-text-gray mb-7.5">Real-time status updates of your digital keys and suite check-ins.</p>

              <div className="flex flex-col gap-3.75">
                {bookings.map(bk => (
                  <div key={bk.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-bg-light border border-border-color rounded-2xl gap-3.75 sm:gap-0">
                    <div>
                      <h4 className="text-base text-text-dark font-bold mb-1">{bk.resortName}</h4>
                      <span className="text-xs text-text-gray">{bk.dates || `${new Date(bk.checkin).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(bk.checkout).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}</span>
                    </div>
                    <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2">
                      <strong className="text-base text-text-dark">{bk.amount || `₹${bk.total?.toLocaleString()}`}</strong>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        bk.status === "Confirmed" 
                          ? "bg-[#121e1b]/10 text-[#121e1b]" 
                          : "bg-[#c5a059]/15 text-[#b58e45]"
                      }`}>
                        <CheckCircle2 size={12} /> {bk.status}
                      </span>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="text-center py-10 text-text-gray text-sm">
                    No booking records found.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Profile;
