import React, { useState, useEffect, useRef, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, WifiOff, CheckCircle2, ArrowUp, Send, Heart, Sun, Moon, Globe, ChevronDown, Menu, Check } from "lucide-react";
import FeedbackPopup from "./components/FeedbackPopup";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Mascot from "./components/Mascot";
import Preloader from "./components/Preloader";
import MobileUI from "./components/MobileUI";
import BookingModal from "./components/BookingModal";
import SearchLoadingOverlay from "./components/SearchLoadingOverlay";
import ProtectedRoute from "./components/ProtectedRoute";
import GuidedTour from "./components/GuidedTour";
import RecentlyViewed from "./components/RecentlyViewed";
import { secureStorage } from "./services/secureStorage";
import { useToast } from "./context/ToastContext";
import { useWishlist } from "./context/WishlistContext";
import { resortService } from "./services/resort.service";
import { bookingService } from "./services/booking.service";
import { apiClient } from "./services/apiClient";

// Lazy-loaded pages
const About = React.lazy(() => import("./pages/About"));
const Contact = React.lazy(() => import("./pages/Contact"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Rewards = React.lazy(() => import("./pages/Rewards"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Wishlist = React.lazy(() => import("./pages/Wishlist"));
const AIPlanner = React.lazy(() => import("./pages/AIPlanner"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Bookings = React.lazy(() => import("./pages/Bookings"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const PartnerOnboarding = React.lazy(() => import("./pages/PartnerOnboarding"));
const PaymentSuccess = React.lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = React.lazy(() => import("./pages/PaymentCancel"));
const BecomeAHost = React.lazy(() => import("./pages/BecomeAHost"));
const HostAdminPortal = React.lazy(() => import("./pages/HostAdminPortal"));
const SuperAdminPortal = React.lazy(() => import("./pages/SuperAdminPortal"));

// Lazy-loaded dummy pages
const Careers = React.lazy(() => import("./pages/DummyPages").then(m => ({ default: m.Careers })));
const Terms = React.lazy(() => import("./pages/DummyPages").then(m => ({ default: m.Terms })));
const HelpCenter = React.lazy(() => import("./pages/DummyPages").then(m => ({ default: m.HelpCenter })));
const Support = React.lazy(() => import("./pages/DummyPages").then(m => ({ default: m.Support })));
const Privacy = React.lazy(() => import("./pages/DummyPages").then(m => ({ default: m.Privacy })));

// Pre-load components to prevent lag
import Hero from "./components/Hero";
import PopularDestinations from "./components/PopularDestinations";
import WhyChooseUs from "./components/WhyChooseUs";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import MascotShowcase from "./components/MascotShowcase";
import ResortListing from "./components/ResortListing";
import ResortDetails from "./components/ResortDetails";

// Simple Loading Indicator for Suspense
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 font-sans bg-bg-light">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-text-gray tracking-wider uppercase">Loading Luxury Experience...</span>
    </div>
  );
}

const HOME_DESTINATIONS_MAP = {
  1: { name: "Goa Coastline", location: "West Coast, India", price: 8000 },
  2: { name: "Kerala Backwaters", location: "South Coast, India", price: 9000 },
  3: { name: "Solang Valley Manali", location: "Himachal Pradesh, India", price: 6500 },
  4: { name: "Coorg Hill Station", location: "Karnataka, India", price: 7200 },
  5: { name: "Coorg Forest Chalet", location: "Karnataka, India", price: 8500 },
  6: { name: "Udaipur Lake Palace", location: "Rajasthan, India", price: 15000 },
  7: { name: "Jaipur Haveli", location: "Rajasthan, India", price: 12000 },
  8: { name: "Shimla Log Cabin", location: "Himachal Pradesh, India", price: 5800 },
  9: { name: "Manali Glamping Tents", location: "Himachal Pradesh, India", price: 7500 },
  10: { name: "Andaman Private Shore", location: "Andaman Islands, India", price: 18000 },
  11: { name: "Andaman Beach Cove", location: "Andaman Islands, India", price: 13500 },
  12: { name: "Shimla Alpine Resort", location: "Himachal Pradesh, India", price: 8200 },
  13: { name: "Goa Heritage Villa", location: "Goa, India", price: 11000 }
};

// Main Home Page Component
function Home({ wishlist, toggleWishlist, currencySymbol, exchangeRate }) {
  return (
    <>
      <Hero />
      <RecentlyViewed currencySymbol={currencySymbol} rates={exchangeRate} />
      <PopularDestinations wishlist={wishlist} toggleWishlist={toggleWishlist} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />
      <WhyChooseUs />
      <FAQ />
      <MascotShowcase />
    </>
  );
}

// Wrapper for Resort Details page
function ResortDetailsPageWrapper({ isDark, currencySymbol, exchangeRate, onBook }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [resort, setResort] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const selectedFromListing = routeLocation.state?.selectedResort;

    // When a user clicks a card, use the exact object that was clicked.
    // This prevents a numeric/static ID from being resolved to a different
    // Firestore document and showing the wrong resort.
    if (selectedFromListing && String(selectedFromListing.id) === String(id)) {
      setResort(selectedFromListing);
      setLoading(false);
      return () => { active = false; };
    }

    const fetchResort = async () => {
      setLoading(true);
      try {
        const data = await resortService.getResortById(id);
        if (active) setResort(data);
      } catch (err) {
        console.error("Failed to fetch resort details:", err);
        if (active) setResort(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchResort();
    return () => { active = false; };
  }, [id, routeLocation.state]);

  // Log details checks to recently viewed stays in secureStorage
  useEffect(() => {
    if (resort) {
      const history = secureStorage.getItem("reservo-recently-viewed") || [];
      const filtered = history.filter(item => item.id !== resort.id);
      const updated = [
        {
          id: resort.id,
          name: resort.name,
          location: resort.location,
          price: resort.price,
          heroImage: resort.image || resort.heroImage,
          rating: resort.rating
        },
        ...filtered
      ].slice(0, 4);
      secureStorage.setItem("reservo-recently-viewed", updated);
      window.dispatchEvent(new Event("storage"));
    }
  }, [resort]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-slate-200 rounded-xl" />
            <div className="h-4 w-40 bg-slate-200 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-full" />
            <div className="h-10 w-10 bg-slate-200 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
          <div className="md:col-span-2 h-full bg-slate-200 rounded-3xl" />
          <div className="hidden md:flex flex-col gap-4 h-full">
            <div className="h-1/2 bg-slate-200 rounded-3xl" />
            <div className="h-1/2 bg-slate-200 rounded-3xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-12 w-full bg-slate-200 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-200 rounded-lg" />
              <div className="h-4 w-5/6 bg-slate-200 rounded-lg" />
              <div className="h-4 w-4/6 bg-slate-200 rounded-lg" />
            </div>
            <div className="grid grid-cols-4 gap-4 pt-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-20 bg-slate-200 rounded-2xl" />
              ))}
            </div>
          </div>

          <div className="h-96 bg-slate-200 rounded-3xl p-6 space-y-6">
            <div className="h-8 w-32 bg-slate-300 rounded-lg" />
            <div className="h-16 w-full bg-slate-300 rounded-2xl" />
            <div className="h-12 w-full bg-slate-300 rounded-xl" />
            <div className="h-12 w-full bg-slate-300 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!resort) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-3xl">🏜️</div>
        <h3 className="text-base font-bold text-text-dark">Resort Not Found</h3>
        <p className="text-xs text-text-gray max-w-sm text-center">
          The property code could not be verified on the ledger or has been archived by the hosts.
        </p>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl border-none cursor-pointer">
          Go back home
        </button>
      </div>
    );
  }

  return (
    <ResortDetails
      resort={resort}
      urlId={id}
      isDarkMode={isDark}
      onBack={() => navigate("/")}
      currencySymbol={currencySymbol}
      exchangeRate={exchangeRate}
      onBook={onBook}
    />
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Shared theme state
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("reservo-theme") === "dark";
  });

  // Shared currency states
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [exchangeRate, setExchangeRate] = useState(1);

  useEffect(() => {
    const handleStorage = () => {
      const cur = localStorage.getItem("reservo-currency") || "en_inr";
      if (cur === "en_usd") {
        setCurrencySymbol("$");
        setExchangeRate(0.012);
      } else {
        setCurrencySymbol("₹");
        setExchangeRate(1);
      }
    };
    handleStorage();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Preloader state
  const [showPreloader, setShowPreloader] = useState(() => {
    return !sessionStorage.getItem("reservo_preloader_shown");
  });

  const handlePreloaderComplete = () => {
    sessionStorage.setItem("reservo_preloader_shown", "true");
    setShowPreloader(false);
  };

  // Wishlist state
  const { wishlist, toggleWishlist } = useWishlist();
  const wishlistIds = [];
  wishlist.forEach((item) => {
    if (typeof item.id === 'string' && item.id.startsWith('home-')) {
      wishlistIds.push(parseInt(item.id.replace('home-', ''), 10));
    } else if (typeof item.id === 'number') {
      wishlistIds.push(item.id);
    }
  });

  const handleToggleWishlist = (id) => {
    const homeDest = HOME_DESTINATIONS_MAP[id];
    if (homeDest) {
      toggleWishlist({ id: `home-${id}`, ...homeDest });
    }
  };

  // Booking states
  const [bookingResort, setBookingResort] = useState(null);
  const [bookingRoom, setBookingRoom] = useState(null);
  const [bookingDates, setBookingDates] = useState({ checkIn: null, checkOut: null });
  const [bookingGuests, setBookingGuests] = useState({ adults: 2, children: 0, roomsCount: 1 });
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Extra improvements states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(() => {
    return localStorage.getItem("reservo-cookie-consent") === "true";
  });
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Handle dark theme body class sync
  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-theme");
      document.body.classList.add("dark");
      localStorage.setItem("reservo-theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.remove("dark");
      localStorage.setItem("reservo-theme", "light");
    }
  }, [isDark]);

  // Online / Offline Status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast("Back online. Synchronizing data settings...", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast("You are browsing offline. Changes will save when reconnected.", "error");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  // Scroll Progress and Back To Top triggers
  useEffect(() => {
    const handleScroll = () => {
      // Scroll Progress Bar
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }

      // Back to Top button
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard Shortcuts (Esc to close dialogs, Alt+H for Home, Alt+W for Wishlist)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "h") {
        navigate("/");
      } else if (e.altKey && e.key === "w") {
        navigate("/wishlist");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);


  const handleAcceptCookies = () => {
    localStorage.setItem("reservo-cookie-consent", "true");
    setCookieConsent(true);
    toast("Cookies preferences accepted.", "info");
  };

  // Centralized booking opener: resolve the real Firestore room before the
  // BookingModal is rendered. This prevents checkout from ever receiving an
  // undefined roomId when booking starts from Resort Details/Wishlist.
  const openBookingForResort = async (inputResort, searchDetails = null) => {
    if (!inputResort?.id) {
      toast("This property has an invalid ID.", "error");
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const resort = await resortService.getResortById(String(inputResort.id));
      if (!resort?.id) throw new Error("This property could not be found.");

      let saved = {};
      try {
        saved = JSON.parse(sessionStorage.getItem("reservo_search_state") || "{}");
      } catch (_) {}

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const defaultCheckoutDate = new Date(today);
      defaultCheckoutDate.setDate(defaultCheckoutDate.getDate() + 3);
      const defaultCheckout = defaultCheckoutDate.toISOString().split("T")[0];

      let checkIn = searchDetails?.checkIn || saved.checkInDate || todayStr;
      let checkOut = searchDetails?.checkOut || saved.checkOutDate || defaultCheckout;
      if (checkIn < todayStr || checkOut <= checkIn) {
        checkIn = todayStr;
        checkOut = defaultCheckout;
      }
      const adults = Math.max(1, Number(searchDetails?.adults ?? saved.guestCount ?? 2));
      const children = Math.max(0, Number(searchDetails?.children ?? saved.childCount ?? 0));
      const roomsCount = Math.max(
        1,
        Number(searchDetails?.roomsCount ?? saved.roomCount ?? 1),
        Math.ceil(adults / 2),
        Math.ceil(children / 2)
      );

      if (!checkIn || !checkOut || checkOut <= checkIn) {
        throw new Error("Please select valid check-in and check-out dates.");
      }

      // This is the authoritative pre-booking check. Do not open the booking
      // wizard when the requested number of rooms is unavailable.
      const availability = await bookingService.checkAvailability(
        resort.id,
        { checkIn, checkOut },
        { adults, children, roomsCount }
      );

      const availableRoom = availability.suggestedRooms?.[0];
      if (!availableRoom?.id) {
        throw new Error("No room is available for the selected dates.");
      }

      setBookingRoom(availableRoom);
      setBookingResort(resort);
      setBookingDates({ checkIn, checkOut });
      setBookingGuests({ adults, children, roomsCount });
    } catch (err) {
      console.error("Failed to prepare booking:", err);
      setBookingRoom(null);
      setBookingResort(null);
      toast(err?.message || "Unable to prepare this booking.", "error");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const lastProcessedKeyRef = useRef(null);
  useEffect(() => {
    const key = location.key || (location.pathname + JSON.stringify(location.state || {}));
    if (
      (location.pathname === "/resorts" ||
        location.pathname === "/search" ||
        location.pathname === "/search-results") &&
      location.state?.checkAvailabilityFor
    ) {
      if (lastProcessedKeyRef.current !== key) {
        lastProcessedKeyRef.current = key;
        const resortId = location.state.checkAvailabilityFor;

        openBookingForResort({ id: resortId }).finally(() => {
          navigate(location.pathname, { replace: true, state: {} });
        });
      }
    }
  }, [location, navigate]);

  const renderResortListing = () => (
    <ResortListing
      isDarkMode={isDark}
      onSelectResort={(resort) => navigate(`/resort/${resort.id}`, { state: { selectedResort: resort } })}
    />
  );

  // Framer Motion Page Transition config
  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 }
  };

  const renderAppRoutes = () => (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.25 }}
        className="flex-grow flex flex-col"
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home wishlist={wishlistIds} toggleWishlist={handleToggleWishlist} currencySymbol={currencySymbol} exchangeRate={exchangeRate} />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Guarded Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={renderResortListing()} />
            <Route path="/search-results" element={renderResortListing()} />
            <Route path="/resorts" element={renderResortListing()} />
            <Route path="/resort/:id" element={<ResortDetailsPageWrapper isDark={isDark} currencySymbol={currencySymbol} exchangeRate={exchangeRate} onBook={openBookingForResort} />} />
            <Route path="/wishlist" element={<Wishlist onBook={openBookingForResort} />} />
            <Route path="/ai-planner" element={<AIPlanner />} />
            <Route path="/partner" element={<ProtectedRoute><PartnerOnboarding /></ProtectedRoute>} />
            <Route path="/become-a-host" element={<BecomeAHost />} />
            <Route path="/host/onboarding" element={<BecomeAHost />} />
            <Route path="/host/dashboard" element={<ProtectedRoute allowedRoles={["ROLE_OWNER"]}><HostAdminPortal /></ProtectedRoute>} />
            <Route path="/host/admin" element={<ProtectedRoute allowedRoles={["ROLE_OWNER"]}><HostAdminPortal /></ProtectedRoute>} />
            <Route path="/host" element={<ProtectedRoute allowedRoles={["ROLE_OWNER"]}><HostAdminPortal /></ProtectedRoute>} />
            <Route path="/host/*" element={<ProtectedRoute allowedRoles={["ROLE_OWNER"]}><HostAdminPortal /></ProtectedRoute>} />
            <Route path="/admin/reservo/*" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><SuperAdminPortal /></ProtectedRoute>} />
            <Route path="/admin/reservo" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><SuperAdminPortal /></ProtectedRoute>} />
            <Route path="/admin/resort/*" element={<ProtectedRoute allowedRoles={["ROLE_OWNER"]}><HostAdminPortal /></ProtectedRoute>} />
            <Route path="/admin/resort" element={<ProtectedRoute allowedRoles={["ROLE_OWNER"]}><HostAdminPortal /></ProtectedRoute>} />
            <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["ROLE_ADMIN"]}><SuperAdminPortal /></ProtectedRoute>} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg-light transition-colors duration-300">
      
      {/* Interactive Guided Tour component overlay */}
      <GuidedTour />

      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-xl z-[10002] font-semibold text-xs shadow transition-all">
        Skip to Main Content
      </a>

      {/* Sticky Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-primary z-[10001] transition-all duration-100" 
        style={{ width: `${scrollProgress}%` }} 
      />

      {/* Offline Alert Ribbon */}
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white py-1.5 px-4 text-[10px] font-bold text-center uppercase tracking-widest z-[10002] flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" /> You are currently browsing offline
        </div>
      )}

      {/* Global Preloader Screen */}
      {showPreloader && (
        <Preloader onComplete={handlePreloaderComplete} />
      )}

      {location.pathname === "/login" || location.pathname === "/register" || location.pathname.startsWith("/admin") || location.pathname.startsWith("/host") ? (
        <main id="main-content" className="flex-grow flex flex-col min-h-screen">
          <Suspense fallback={<PageLoader />}>
            {renderAppRoutes()}
          </Suspense>
        </main>
      ) : isMobile ? (
        <MobileUI isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} wishlist={wishlistIds}>
          <main id="main-content" className="flex-grow flex flex-col">
            {renderAppRoutes()}
          </main>
        </MobileUI>
      ) : (
        <div className="flex flex-col flex-1 bg-bg-light transition-colors duration-300">
          <Header isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} wishlist={wishlist} />

          <main id="main-content" className={`flex-1 flex flex-col ${location.pathname === "/" ? "" : location.pathname === "/ai-planner" ? "pt-20" : "pt-28"}`}>
            {renderAppRoutes()}
          </main>

          {/* Floating Mascot Widget */}
          <Mascot isDark={isDark} setIsDark={setIsDark} />

          {/* Footer */}
          {location.pathname !== "/ai-planner" && <Footer />}
        </div>
      )}

      {/* Booking Modal & Search Loader Overlay integrations */}
      {isCheckingAvailability && bookingResort && (
        <SearchLoadingOverlay 
          destination={bookingResort.location} 
          onComplete={() => setIsCheckingAvailability(false)} 
        />
      )}

      {!isCheckingAvailability && bookingResort && (
        <BookingModal
          resort={bookingResort}
          room={bookingRoom}
          bookingDates={bookingDates}
          bookingGuests={bookingGuests}
          isDarkMode={isDark}
          onClose={() => {
            setBookingResort(null);
            setBookingRoom(null);
            setBookingDates({ checkIn: null, checkOut: null });
          }}
          onAskRivo={() => {
            const mascotBtn = document.querySelector('[aria-label="Toggle Rivo AI Companion"]');
            if (mascotBtn) {
              mascotBtn.click();
            }
          }}
        />
      )}

      {/* Floating Action Buttons: Back To Top */}
      <AnimatePresence>
        {showBackToTop && !isMobile && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-26 right-8 bg-[#121e1b] text-white p-3 rounded-full shadow-lg border border-[#334155] cursor-pointer hover:bg-primary transition-colors duration-300 z-40"
            aria-label="Back to top"
          >
            <ArrowUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>


      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {!cookieConsent && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 right-6 lg:left-6 lg:right-auto max-w-sm w-[90%] bg-bg-white border border-border-color p-5 rounded-3xl shadow-2xl z-[10001] flex flex-col gap-4 font-sans text-left"
          >
            <div>
              <h4 className="text-sm font-bold text-text-dark flex items-center gap-1.5">
                <Check className="w-4 h-4 text-primary" /> Cookie Consent
              </h4>
              <p className="text-[11.5px] text-text-gray font-semibold mt-1 leading-relaxed">
                We use cookies to provide a premium booking experience and smart recommendations powered by Rivo AI.
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAcceptCookies}
                className="flex-1 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow hover:bg-primary-dark"
              >
                Accept All
              </button>
              <button 
                onClick={() => setCookieConsent(true)}
                className="px-4 py-2 border border-border-color text-text-dark rounded-xl text-xs font-bold cursor-pointer bg-bg-light hover:bg-border-color transition-colors duration-300"
              >
                Decline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <FeedbackPopup />
    </div>
    
  );
}

export default App;
