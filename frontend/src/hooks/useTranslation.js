import { useState, useEffect } from "react";

const TRANSLATIONS = {
  en: {
    home: "Home",
    explore: "Explore",
    ai_planner: "AI Planner",
    why_us: "Why Us",
    experiences: "Experiences",
    rewards: "Rewards",
    reviews: "Reviews",
    contact: "Contact",
    my_bookings: "My Bookings",
    wishlist: "Wishlist",
    about_us: "About Us",
    meet_rivo: "MEET RIVO",
    companion: "Your AI Travel Companion",
    concierge_service: "Rivo is your personal travel concierge, powered by AI to seamlessly curate and manage every aspect of your trip.",
    always_service: "Always at your service",
    friction_free: "From crafting bespoke itineraries to live key handovers, Rivo takes the friction out of luxury hospitality.",
    select_vibe: "Select your holiday vibe:",
    start_over: "Start Over",
    ask_rivo: "Ask Rivo anything...",
    from: "from",
    per_night: "per night",
    best_price: "Best Price",
    verified_stays: "Verified Stays",
    quality_checked: "Quality checked",
    value_guaranteed: "Value guaranteed",
    support_247: "24/7 Support",
    secure_booking: "100% Secure Booking",
    connecting: "Connecting...",
    connected: "Connected",
    telephony_concierge: "Rivo AI Concierge",
    secure_line: "Reservo Secure Line",
    quick_book: "Quick Book",
    view_details: "View Details →",
    popular_destinations: "Popular Stays",
    discover_stays: "Discover curated retreats tailored for luxury escapes.",
    m1_greeting: "Hi! I'm Rivo, your personal travel concierge. Tell me what kind of vibe you're looking for, and I'll find the perfect stay.",
    connecting_sip: "Initializing secure SIP VoIP channel...",
    telephony_greeting: "\"Hello! I am Rivo, your Reservo Telephony concierge. How can I assist you with your luxury booking today?\"",
    
    // Why Choose Us
    why_choose_reservo: "Why Choose Reservo",
    next_era_part1: "The Next Era of ",
    next_era_part2: "Luxury Stays",
    why_us_desc: "Reservo pairs cutting-edge technology with elite hospitality standards to redefine your holiday experience.",
    feature_01_title: "AI Recommendations",
    feature_01_desc: "Our intelligent algorithm maps your mood, calendar, and past stay histories to deliver tailored recommendations.",
    feature_02_title: "Hand-Verified Stays",
    feature_02_desc: "Every resort, villa, and boutique hotel goes through a thorough 150+ point safety, luxury, and auditing process.",
    feature_03_title: "Secure Payments",
    feature_03_desc: "Sleek checkout powered by Stripe, accepting premium credit cards, digital wallets, and installment schedules.",
    feature_04_title: "24/7 Concierge Support",
    feature_04_desc: "Our dedicated digital and human concierge support teams are available around the clock to handle bookings.",
    stat_0_label: "Happy Travelers",
    stat_1_label: "Luxury Properties",
    stat_2_label: "Average Rating",
    stat_3_label: "Secure & Safe",
    
    // Testimonials
    guest_reviews: "Guest Reviews",
    guests_say_part1: "What Our ",
    guests_say_part2: "Guests",
    guests_say_part3: " Say",
    reviews_desc: "Thousands of travelers trust Reservo for unforgettable luxury vacations.",
    review_1: "Reservo made our honeymoon unforgettable. The booking process was seamless, and the resort was even more beautiful than the pictures.",
    review_2: "The luxury stay, exceptional hospitality, and smooth booking experience exceeded all our expectations. Highly recommended!",
    review_3: "One of the finest resort booking platforms. Premium resorts, transparent pricing, and outstanding customer support.",

    // Experiences Page
    exp_hero_tag: "RESERVO EXCLUSIVE • CURATED ADVENTURES",
    exp_hero_title1: "Unforgettable Experiences,",
    exp_hero_title2: "Beyond Just Stays",
    exp_hero_desc: "Handpicked private yacht charters, volcanic heli-tours, cliffside private dinners & guided wilderness treks hosted by certified naturalists.",
    exp_yacht: "Private Yacht Sailing",
    exp_heli: "Heli Peaks & Canyons",
    exp_chef: "Michelin Chef Dining",
    exp_guides: "Certified Guides",
    exp_rating: "4.9 / 5.0 Exceptional Rating",
    exp_verified: "100% Verified Partners",
    exp_vip: "24/7 VIP Concierge Support",
    exp_whats_included: "What's Included:",
    exp_reserve_slot: "Reserve Slot",
    exp_per_person: "/ person",
    exp_no_found: "No Luxury Experiences Found",
    exp_try_filter: "Try selecting a different destination filter from the menu."
  },
  hi: {
    home: "मुख्य पृष्ठ",
    explore: "खोजें",
    ai_planner: "एआई प्लानर",
    why_us: "हमें क्यों चुनें",
    experiences: "अनुभव",
    rewards: "पुरस्कार",
    reviews: "समीक्षाएं",
    contact: "संपर्क",
    my_bookings: "मेरी बुकिंग",
    wishlist: "पसंदीदा",
    about_us: "हमारे बारे में",
    meet_rivo: "रिवो से मिलें",
    companion: "आपका एआई यात्रा साथी",
    concierge_service: "रिवो आपका व्यक्तिगत यात्रा सहायक है, जो आपकी यात्रा के हर पहलू को व्यवस्थित करने के लिए एआई द्वारा संचालित है।",
    always_service: "हमेशा आपकी सेवा में",
    friction_free: "कस्टम यात्रा कार्यक्रम तैयार करने से लेकर लाइव सहायता तक, रिवो आपकी यात्रा को आसान बनाता है।",
    select_vibe: "अपनी छुट्टियों का मिजाज चुनें:",
    start_over: "शुरू से शुरू करें",
    ask_rivo: "रिवो से कुछ भी पूछें...",
    from: "से",
    per_night: "प्रति रात",
    best_price: "सर्वोत्तम मूल्य",
    verified_stays: "सत्यापित ठहरने के स्थान",
    quality_checked: "गुणवत्ता जांची गई",
    value_guaranteed: "मूल्य की गारंटी",
    support_247: "24/7 सहायता",
    secure_booking: "100% सुरक्षित बुकिंग",
    connecting: "कनेक्ट हो रहा है...",
    connected: "कनेक्टेड",
    telephony_concierge: "रिवो एआई कंसीयज",
    secure_line: "रिजर्वो सुरक्षित लाइन",
    quick_book: "त्वरित बुकिंग",
    view_details: "विवरण देखें →",
    popular_destinations: "लोकप्रिय ठहरने के स्थान",
    discover_stays: "लक्ज़री गेटअवे के लिए क्यूरेटेड रिट्रीट खोजें।",
    m1_greeting: "नमस्ते! मैं रिवो हूँ, आपका व्यक्तिगत यात्रा सहायक। मुझे बताएं कि आप किस तरह का माहौल तलाश रहे हैं, और मैं आपके लिए सही ठहराव ढूंढ लूंगा।",
    connecting_sip: "सुरक्षित एसआईपी वीओआईपी चैनल प्रारंभ किया जा रहा है...",
    telephony_greeting: "\"नमस्ते! मैं रिवो हूँ, आपका रिजर्वो टेलीफोनी कंसीयज। आज मैं आपकी लक्ज़री बुकिंग में कैसे मदद कर सकता हूँ?\"",
    
    // Why Choose Us
    why_choose_reservo: "रिजर्वो क्यों चुनें",
    next_era_part1: "लक्ज़री स्टेज़ का ",
    next_era_part2: "नया युग",
    why_us_desc: "रिजर्वो आपकी छुट्टियों के अनुभव को फिर से परिभाषित करने के लिए आधुनिक तकनीक को उत्कृष्ट आतिथ्य मानकों के साथ जोड़ता है।",
    feature_01_title: "एआई सिफारिशें",
    feature_01_desc: "हमारा इंटेलिजेंट एल्गोरिदम आपके मूड, कैलेंडर और पुराने इतिहास के आधार पर व्यक्तिगत सिफारिशें प्रदान करता है।",
    feature_02_title: "सत्यापित ठहरने के स्थान",
    feature_02_desc: "प्रत्येक रिसॉर्ट, विला और बुटीक होटल 150+ सुरक्षा, विलासिता और ऑडिटिंग प्रक्रियाओं से गुजरता है।",
    feature_03_title: "सुरक्षित भुगतान",
    feature_03_desc: "स्ट्राइप द्वारा संचालित आसान चेकआउट, जो प्रीमियम क्रेडिट कार्ड, डिजिटल वॉलेट और किस्तों को स्वीकार करता है।",
    feature_04_title: "24/7 कंसीयज सहायता",
    feature_04_desc: "हमारी समर्पित डिजिटल और मानव कंसीयज सहायता टीम बुकिंग संभालने के लिए चौबीसों घंटे उपलब्ध है।",
    stat_0_label: "खुशहाल यात्री",
    stat_1_label: "शानदार संपत्तियां",
    stat_2_label: "औसत रेटिंग",
    stat_3_label: "सुरक्षित और विश्वसनीय",
    
    // Testimonials
    guest_reviews: "अतिथि समीक्षाएं",
    guests_say_part1: "हमारे ",
    guests_say_part2: "मेहमानों",
    guests_say_part3: " का क्या कहना है",
    reviews_desc: "हजारों यात्री अविस्मरणीय लक्ज़री छुट्टियों के लिए रिजर्वो पर भरोसा करते हैं।",
    review_1: "रिजर्वो ने हमारे हनीमून को अविस्मरणीय बना दिया। बुकिंग प्रक्रिया बहुत आसान थी, और रिसॉर्ट तस्वीरों से भी अधिक सुंदर था।",
    review_2: "शानदार प्रवास, असाधारण आतिथ्य और आसान बुकिंग अनुभव हमारी सभी अपेक्षाओं से बढ़कर था। अत्यधिक अनुशंसित!",
    review_3: "सबसे बेहतरीन रिसॉर्ट बुकिंग प्लेटफॉर्म में से एक। प्रीमियम रिसॉर्ट्स, पारदर्शी मूल्य निर्धारण और उत्कृष्ट ग्राहक सहायता।",

    // Experiences Page
    exp_hero_tag: "रिजर्वो एक्सक्लूसिव • क्यूरेटेड एडवेंचर्स",
    exp_hero_title1: "अविस्मरणीय अनुभव,",
    exp_hero_title2: "केवल ठहरने से परे",
    exp_hero_desc: "सत्यापित प्रकृतिवादियों द्वारा होस्ट किए गए चुनिंदा निजी यॉट नौकायन, ज्वालामुखीय हेली-दौरे, चट्टानी निजी रात्रिभोज और निर्देशित ट्रेक।",
    exp_yacht: "निजी यॉट नौकायन",
    exp_heli: "हेली शिखर और घाटियाँ",
    exp_chef: "मिशेलिन शेफ डाइनिंग",
    exp_guides: "प्रमाणित गाइड",
    exp_rating: "4.9 / 5.0 असाधारण रेटिंग",
    exp_verified: "100% सत्यापित भागीदार",
    exp_vip: "24/7 वीआईपी सहायता",
    exp_whats_included: "क्या शामिल है:",
    exp_reserve_slot: "स्लॉट आरक्षित करें",
    exp_per_person: "/ व्यक्ति",
    exp_no_found: "कोई लक्ज़री अनुभव नहीं मिला",
    exp_try_filter: "मेनू से एक अलग गंतव्य फ़िल्टर चुनने का प्रयास करें।"
  }
};

export function useTranslation() {
  const [lang, setLang] = useState(() => localStorage.getItem("reservo-language") || "en");

  useEffect(() => {
    const handleStorage = () => {
      setLang(localStorage.getItem("reservo-language") || "en");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const t = (key) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  return { t, lang };
}
