import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, MapPin, DollarSign, ArrowRight, ArrowLeft, CheckCircle2, 
  ImageIcon, Mail, User, ShieldAlert, FileText, Check, Phone, ShieldCheck, Map,
  Upload
} from "lucide-react";
import rivoSearching from "../assets/images/rivo_searching.png";
import { apiClient } from "../services/apiClient";

export default function PartnerOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setErrorMsg("");
      const body = new FormData();
      body.append("file", file);
      try {
        setUploadedFile({ name: "Uploading...", size: "" });
        const result = await apiClient.post("/api/v1/documents/upload", body);
        if (result.success && result.data) {
          setUploadedFile({
            name: result.data.fileName,
            size: result.data.fileSize
          });
          setFormData(prev => ({
            ...prev,
            documentUrl: result.data.fileUrl,
            fileSize: result.data.fileSize
          }));
        } else {
          throw new Error(result.message || "Failed to upload document");
        }
      } catch (err) {
        console.error("Document upload error:", err);
        setUploadedFile(null);
        setErrorMsg("Document upload failed: " + err.message);
      }
    }
  };

  const [formData, setFormData] = useState({
    // Step 1: Business Info
    businessName: "",
    name: "", // Resort Name
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    // Step 2: Property Type
    category: "resort",
    pricePerNight: "15000",
    // Step 3: Location
    country: "India",
    state: "",
    city: "",
    address: "",
    pinCode: "",
    latitude: "15.2993",
    longitude: "74.1240",
    // Step 4: Verification
    licenseNumber: "",
    docType: "GST", // GST, government, company
    idType: "Aadhaar", // Aadhaar, Passport, DL
    documentUrl: "",
    fileSize: "",
    // Step 5: Media
    imageUrl: "",
    galleryUrls: "",
    videoUrl: "",
    droneUrl: "",
    tourUrl: ""
  });

  // Steps 3 maps coordinates picker simulation state
  const [pinPlaced, setPinPlaced] = useState(false);

  const propertyTypes = [
    { id: "resort", label: "Resort" },
    { id: "hotel", label: "Hotel" },
    { id: "villa", label: "Villa" },
    { id: "homestay", label: "Homestay" },
    { id: "apartment", label: "Apartment" },
    { id: "camping", label: "Camping" },
    { id: "farmstay", label: "Farm Stay" },
    { id: "luxury_tent", label: "Luxury Tent" }
  ];

  const handleNext = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!formData.businessName || !formData.name || !formData.ownerName || !formData.ownerEmail || !formData.ownerPhone) {
        setErrorMsg("Please fill in all Business and Contact Information.");
        return;
      }
    } else if (step === 2) {
      if (!formData.pricePerNight) {
        setErrorMsg("Please specify the base rate price.");
        return;
      }
    } else if (step === 3) {
      if (!formData.city || !formData.state || !formData.address || !formData.pinCode) {
        setErrorMsg("Please complete all location fields.");
        return;
      }
    } else if (step === 4) {
      if (!formData.licenseNumber) {
        setErrorMsg("Please specify your registration or license number.");
        return;
      }
    } else if (step === 5) {
      // Step 5 is Media, we check if they filled description/details
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep(prev => prev - 1);
  };

  // Maps click coordinates simulator
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click position to realistic India latitudes/longitudes
    const lat = (28.6139 - (y / rect.height) * 20).toFixed(4);
    const lon = (77.2090 + (x / rect.width) * 15).toFixed(4);

    setFormData({
      ...formData,
      latitude: lat,
      longitude: lon
    });
    setPinPlaced(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    let finalImageUrl = formData.imageUrl.trim();
    if (!finalImageUrl) {
      if (formData.category === "resort") {
        finalImageUrl = "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80";
      } else if (formData.category === "villa") {
        finalImageUrl = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
      } else {
        finalImageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";
      }
    }

    try {
      const result = await apiClient.post("/api/v1/resorts", {
        name: formData.name,
        location: `${formData.city}, ${formData.state}, ${formData.country}`,
        description: `Welcome to ${formData.name}. Managed by ${formData.businessName}. Experience premium comfort in our luxury ${formData.category} rooms.`,
        imageUrl: finalImageUrl,
        pricePerNight: parseFloat(formData.pricePerNight),
        status: "PENDING_APPROVAL",
        rating: 4.8,
        reviewCount: 0,
        discountPercentage: 15,
        featuredTag: "Newly Onboarded"
      });

      if (result && result.success) {
        // If a document was uploaded, register it linked to the newly created resort
        if (formData.documentUrl && result.data && result.data.id) {
          try {
            await apiClient.post("/api/v1/documents", {
              name: `${formData.docType} Verification File (${formData.idType})`,
              status: "Verification Pending",
              documentUrl: formData.documentUrl,
              fileSize: formData.fileSize,
              resort: { id: result.data.id }
            });
          } catch (docErr) {
            console.error("Failed to link document registry:", docErr);
          }
        }
        setIsSuccess(true);
      } else {
        setErrorMsg("Submission failed. Please verify connection or fields.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to backend: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 bg-[var(--color-bg-light)] flex items-center justify-center px-4 font-sans transition-colors duration-300">
      <div className="w-full max-w-4xl bg-[var(--color-bg-white)] border border-[var(--color-border-color)] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side Info Panel */}
        <div className="w-full md:w-4/12 bg-gradient-to-br from-primary via-primary-dark to-[#1d4ed8] p-8 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-6 z-10">
            <div className="inline-flex p-3 bg-white/15 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight leading-tight">Become a Reservo Business Partner</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Unlock a comprehensive business suite. Manage bookings, analytics, room lists, and publish custom resort feeds.
            </p>
          </div>

          <div className="space-y-3 z-10 mt-8 md:mt-0">
            {[
              "Business Details",
              "Property Type Selection",
              "Interactive Maps Location",
              "License & Document Verification",
              "Property Media Assets",
              "Submit Registry"
            ].map((label, idx) => (
              <div key={idx} className={`flex items-center gap-3 text-xs ${step === idx + 1 ? "text-white font-extrabold" : "text-white/60"}`}>
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${step === idx + 1 ? "bg-white text-primary" : "bg-white/10 text-white"}`}>
                  {idx + 1}
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Wizard Form */}
        <div className="w-full md:w-8/12 p-8 flex flex-col justify-between">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center text-center my-auto space-y-6 py-8 animate-in fade-in duration-300">
              <img src={rivoSearching} alt="Rivo Mascot" className="h-44 w-auto object-contain animate-bounce" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[var(--color-text-dark)]">Application Submitted!</h3>
                <span className="inline-flex px-3 py-1 bg-yellow-500/15 text-yellow-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Waiting for Approval
                </span>
                <p className="text-xs text-[var(--color-text-gray)] max-w-md mx-auto leading-relaxed pt-2">
                  Thank you for applying. Our verification experts will check your government licenses and documents. Estimated review timeframe is <strong>24–48 Hours</strong>.
                </p>
              </div>
              <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold border-none cursor-pointer hover:bg-primary-dark transition">
                Return to Home
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between space-y-6">
              
              {/* Step Header */}
              <div className="flex justify-between items-center border-b border-[var(--color-border-color)] pb-3">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step {step} of 5</span>
                <span className="text-[10px] text-[var(--color-text-gray)] font-bold">
                  {step === 1 ? "Business & Contact Info" : step === 2 ? "Property Profile" : step === 3 ? "Map & Location" : step === 4 ? "Verification" : "Media Library Assets"}
                </span>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Input Steps */}
              <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-1">
                
                {/* STEP 1: BUSINESS & CONTACT INFO */}
                {step === 1 && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Business / Corporate Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="e.g. Royal Palms Hospitality Group"
                        className="w-full px-3 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Property / Resort Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Royal Palm Beach Resort"
                        className="w-full px-3 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Owner Full Name *</label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3 w-4 h-4 text-[var(--color-text-gray)]" />
                        <input
                          type="text"
                          required
                          value={formData.ownerName}
                          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                          placeholder="e.g. Devendra Singh"
                          className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Email *</label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3 w-4 h-4 text-[var(--color-text-gray)]" />
                          <input
                            type="email"
                            required
                            value={formData.ownerEmail}
                            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                            placeholder="partners@royalpalm.com"
                            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Phone Number *</label>
                        <div className="relative flex items-center">
                          <Phone className="absolute left-3 w-4 h-4 text-[var(--color-text-gray)]" />
                          <input
                            type="tel"
                            required
                            value={formData.ownerPhone}
                            onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROPERTY DETAILS */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Property Category Type</label>
                      <div className="grid grid-cols-4 gap-2">
                        {propertyTypes.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: type.id })}
                            className={`py-2 px-3 rounded-xl border text-center font-bold text-xs cursor-pointer transition ${
                              formData.category === type.id
                                ? "bg-primary text-white border-primary shadow"
                                : "bg-[var(--color-bg-light)] border-[var(--color-border-color)] text-[var(--color-text-dark)] hover:bg-[var(--color-bg-light)]/80"
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Estimated Base Rate Per Night (₹) *</label>
                      <div className="relative flex items-center w-full max-w-xs">
                        <DollarSign className="absolute left-3 w-4 h-4 text-[var(--color-text-gray)]" />
                        <input
                          type="number"
                          required
                          value={formData.pricePerNight}
                          onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                          placeholder="e.g. 15000"
                          className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: LOCATION & MAP PICKER */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Country</label>
                        <input
                          type="text"
                          value={formData.country}
                          disabled
                          className="w-full px-3 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-gray)] font-semibold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">State *</label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="e.g. Goa"
                          className="w-full px-3 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">City *</label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="e.g. Panaji"
                          className="w-full px-3 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Pin Code *</label>
                        <input
                          type="text"
                          required
                          value={formData.pinCode}
                          onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                          placeholder="e.g. 403001"
                          className="w-full px-3 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Street Address *</label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. 104, Beachside Cove, Panaji"
                        className="w-full px-3 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                      />
                    </div>

                    {/* Google Maps Drag & Drop Simulation */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase flex justify-between">
                        <span>Google Maps Location Pin *</span>
                        {pinPlaced ? (
                          <span className="text-emerald-500 font-extrabold">📍 Location Pin Placed</span>
                        ) : (
                          <span className="text-primary animate-pulse">Click on map grid to place pin</span>
                        )}
                      </label>
                      <div 
                        onClick={handleMapClick}
                        className="h-28 w-full bg-[#cbd5e1] dark:bg-slate-700 rounded-xl relative overflow-hidden cursor-crosshair border border-[var(--color-border-color)] flex items-center justify-center"
                      >
                        {/* Map Grid Pattern Grid */}
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_14px]" />
                        
                        {pinPlaced ? (
                          <div className="absolute p-2 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border border-white animate-bounce pointer-events-none" style={{ left: '45%', top: '35%' }}>
                            <MapPin className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold pointer-events-none z-10">
                            <Map className="w-4 h-4" /> Select Location Coordinates
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 text-[9px] text-[var(--color-text-gray)] font-semibold">
                        <span>Lat: <strong>{formData.latitude}° N</strong></span>
                        <span>Lon: <strong>{formData.longitude}° E</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: VERIFICATION DOCUMENTS */}
                {step === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Business Document Verification</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["GST", "Tourism license", "Company Certificate"].map((doc) => (
                          <button
                            key={doc}
                            type="button"
                            onClick={() => setFormData({ ...formData, docType: doc })}
                            className={`py-2 px-3 rounded-xl border text-center font-bold text-[10px] cursor-pointer transition ${
                              formData.docType === doc
                                ? "bg-primary text-white border-primary"
                                : "bg-[var(--color-bg-light)] border-[var(--color-border-color)] text-[var(--color-text-dark)]"
                            }`}
                          >
                            {doc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">License / Registration ID Code *</label>
                      <div className="relative flex items-center">
                        <FileText className="absolute left-3.5 w-4 h-4 text-[var(--color-text-gray)]" />
                        <input
                          type="text"
                          required
                          value={formData.licenseNumber}
                          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                          placeholder="e.g. GSTIN-32AAAAB1234C1Z1"
                          className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Goverment Owner ID Identity Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Aadhaar", "Passport", "Driving License"].map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setFormData({ ...formData, idType: id })}
                            className={`py-2 px-3 rounded-xl border text-center font-bold text-[10px] cursor-pointer transition ${
                              formData.idType === id
                                ? "bg-primary text-white border-primary"
                                : "bg-[var(--color-bg-light)] border-[var(--color-border-color)] text-[var(--color-text-dark)]"
                            }`}
                          >
                            {id}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Drag and drop zone */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Upload Documents *</label>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden" 
                        accept=".pdf,.png,.jpg,.jpeg"
                      />
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-[var(--color-border-color)] rounded-xl p-6 flex flex-col items-center justify-center text-center bg-[var(--color-bg-light)]/40 hover:bg-[var(--color-bg-light)]/80 cursor-pointer transition hover:border-primary"
                      >
                        {uploadedFile ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
                            <span className="text-[10px] font-bold text-[var(--color-text-dark)]">{uploadedFile.name}</span>
                            <span className="text-[8px] text-[var(--color-text-gray)] mt-0.5">File size: {uploadedFile.size} • Uploaded & Encrypted</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-[var(--color-text-gray)] mb-1" />
                            <span className="text-[10px] font-bold text-[var(--color-text-dark)]">Click to Upload Document</span>
                            <span className="text-[8px] text-[var(--color-text-gray)] mt-0.5">Supports PDF, PNG, JPG (Max 5MB)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: MEDIA & SUBMIT */}
                {step === 5 && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Cover Image URL (Optional)</label>
                      <div className="relative flex items-center">
                        <ImageIcon className="absolute left-3 w-4 h-4 text-[var(--color-text-gray)]" />
                        <input
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Drone Footage or Promo Video URL</label>
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        placeholder="e.g. https://vimeo.com/... (Optional)"
                        className="w-full px-3 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Virtual 360 tour URL</label>
                      <input
                        type="url"
                        value={formData.tourUrl}
                        onChange={(e) => setFormData({ ...formData, tourUrl: e.target.value })}
                        placeholder="e.g. https://kuula.co/... (Optional)"
                        className="w-full px-3 py-2 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[var(--color-text-gray)] font-bold uppercase">Property Gallery Assets (Comma Separated)</label>
                      <textarea
                        rows="2"
                        value={formData.galleryUrls}
                        onChange={(e) => setFormData({ ...formData, galleryUrls: e.target.value })}
                        placeholder="Paste image URLs separated by commas..."
                        className="w-full p-2.5 bg-[var(--color-bg-light)] border border-[var(--color-border-color)] rounded-xl text-xs text-[var(--color-text-dark)] font-semibold outline-none resize-none"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Navigation controls */}
              <div className="flex gap-4 pt-4 border-t border-[var(--color-border-color)]">
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 py-2.5 bg-transparent border border-[var(--color-border-color)] text-[var(--color-text-dark)] hover:bg-[var(--color-bg-light)] rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}

                {step < 5 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-2.5 bg-primary text-white hover:bg-primary-dark rounded-xl text-xs font-bold cursor-pointer border-none transition flex items-center justify-center gap-1.5"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-primary text-white hover:bg-primary-dark disabled:bg-primary/50 rounded-xl text-xs font-bold cursor-pointer border-none transition flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Submit Registry <CheckCircle2 className="w-4.5 h-4.5" /></>
                    )}
                  </button>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
