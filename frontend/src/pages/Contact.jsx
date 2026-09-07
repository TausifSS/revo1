import React, { useState } from "react";
import contactImage from "../assets/images/contact.jpg";
import rivoSupport from "../assets/images/rivo_support.png";
import { MapPin, Mail, Sparkles, Clock, ShieldCheck } from "lucide-react";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required.";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters long.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message content is required.";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error message when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      // Simulate API submit delay of 1.5 seconds
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      }, 1500);
    }
  };

  return (
    <>
      {/* Hero */}
      <section 
        className="py-[100px] md:py-[150px] px-5 text-center text-white bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(20,35,32,0.72), rgba(20,35,32,0.72)), url(${contactImage})`
        }}
      >
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="block text-center text-xs font-bold uppercase tracking-widest text-gold mb-3">
            Contact Reservo
          </span>
          <h1 className="text-[42px] md:text-[64px] font-bold my-6 md:my-[25px] leading-tight text-white">
            We'd Love <br /> To Hear From You
          </h1>
          <p className="max-w-[760px] mx-auto text-base md:text-xl leading-relaxed md:leading-[1.8] text-white/90">
            Whether you're planning your next luxury vacation or need booking
            assistance, our travel experts are always ready to help.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 md:py-[100px] bg-bg-light transition-colors duration-300">
        <div className="w-[90%] max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12.5 lg:gap-[70px] items-start">

          {/* Left */}
          <div className="text-center lg:text-left">
            <span className="inline-block text-gold font-semibold tracking-widest text-xs mb-3.75">
              GET IN TOUCH
            </span>
            <h2 className="text-[36px] md:text-[46px] font-bold text-primary mb-5">
              Let's Plan Your Next Luxury Escape
            </h2>
            <p className="text-text-gray leading-relaxed mb-7.5">
              Have questions about bookings, resorts, or special offers?
              Our friendly team is available 24/7 to assist you.
            </p>

            <div className="flex flex-col gap-4">
              {/* Office Card */}
              <div className="group flex items-center gap-5 bg-bg-white border border-border-color rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-custom hover:border-primary/30 text-left relative overflow-hidden">
                <div className="w-[56px] h-[56px] bg-bg-light border border-border-color rounded-2xl flex justify-center items-center shrink-0 shadow-sm group-hover:scale-105 group-hover:border-primary/40 transition-all duration-300">
                  <MapPin className="w-6 h-6 text-primary stroke-[2.25] transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-primary text-xl font-bold font-serif tracking-tight m-0">Corporate HQ</h4>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-gold/10 text-gold border border-gold/20 px-2.5 py-0.5 rounded-full">
                      Location
                    </span>
                  </div>
                  <p className="m-0 text-text-gray font-medium text-base">Pune, Maharashtra, India</p>
                </div>
              </div>

              {/* Email Card */}
              <div className="group flex items-center gap-5 bg-bg-white border border-border-color rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-custom hover:border-primary/30 text-left relative overflow-hidden">
                <div className="w-[56px] h-[56px] bg-bg-light border border-border-color rounded-2xl flex justify-center items-center shrink-0 shadow-sm group-hover:scale-105 group-hover:border-primary/40 transition-all duration-300">
                  <Mail className="w-6 h-6 text-primary stroke-[2.25] transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-primary text-xl font-bold font-serif tracking-tight m-0">Digital Concierge</h4>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
                      &lt; 2hr Response
                    </span>
                  </div>
                  <p className="m-0 text-text-gray font-medium text-base">support@reservo.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="bg-bg-white border border-border-color rounded-[22px] p-6.25 md:p-10 shadow-[0_18px_40px_rgba(0,0,0,0.08)] text-left min-h-[480px] flex flex-col justify-center transition-colors duration-300">
            
            {isSubmitted ? (
              <div className="text-center py-6 animate-in fade-in duration-500">
                <div className="w-[120px] h-[120px] mx-auto rounded-full bg-bg-light border border-border-color flex items-center justify-center overflow-hidden mb-6 shadow-md">
                  <img src={rivoSupport} alt="Rivo Mascot" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-2xl font-extrabold text-primary mb-3">Message Delivered!</h3>
                <p className="text-text-gray text-[14px] leading-relaxed max-w-[340px] mx-auto mb-6">
                  Rivo is submitting your details directly to the Reservo concierge desk. We will reach back to you within **2 hours**.
                </p>
                <div className="inline-block py-2 px-5 bg-gold/10 text-gold rounded-full text-xs font-bold border border-gold/20">
                  Ticket Reference: #RSV-{Math.floor(1000 + Math.random() * 9000)}
                </div>
                <div className="mt-8">
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="bg-transparent border border-border-color text-text-dark font-bold px-6 py-2.5 rounded-full hover:bg-bg-light cursor-pointer text-xs transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[30px] md:text-[38px] font-bold text-primary mb-7.5">
                  Send a Message
                </h2>
                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-[18px] py-4 border ${errors.name ? "border-red-500 bg-red-50/10" : "border-border-color bg-bg-light text-text-dark"} rounded-xl outline-none text-base transition-all duration-300 focus:border-gold focus:bg-bg-white`}
                    />
                    {errors.name && <span className="text-red-500 text-xs font-bold ml-1 mt-0.5">{errors.name}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-[18px] py-4 border ${errors.email ? "border-red-500 bg-red-50/10" : "border-border-color bg-bg-light text-text-dark"} rounded-xl outline-none text-base transition-all duration-300 focus:border-gold focus:bg-bg-white`}
                    />
                    {errors.email && <span className="text-red-500 text-xs font-bold ml-1 mt-0.5">{errors.email}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      name="subject"
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-[18px] py-4 border ${errors.subject ? "border-red-500 bg-red-50/10" : "border-border-color bg-bg-light text-text-dark"} rounded-xl outline-none text-base transition-all duration-300 focus:border-gold focus:bg-bg-white`}
                    />
                    {errors.subject && <span className="text-red-500 text-xs font-bold ml-1 mt-0.5">{errors.subject}</span>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <textarea
                      rows="5"
                      name="message"
                      placeholder="Tell us how we can help..."
                      value={formData.message}
                      onChange={handleChange}
                      className={`w-full px-[18px] py-4 border ${errors.message ? "border-red-500 bg-red-50/10" : "border-border-color bg-bg-light text-text-dark"} rounded-xl outline-none text-base transition-all duration-300 focus:border-gold focus:bg-bg-white resize-none`}
                    ></textarea>
                    {errors.message && <span className="text-red-500 text-xs font-bold ml-1 mt-0.5">{errors.message}</span>}
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-primary text-white border-none py-4 rounded-full text-[17px] font-semibold cursor-pointer transition-all duration-[350ms] hover:bg-primary-dark hover:-translate-y-0.75 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </section>

      {/* Map */}
      <section className="py-20 md:py-[100px] bg-bg-light transition-colors duration-300">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="block text-center text-xs font-bold uppercase tracking-widest text-gold mb-3">
            Visit Us
          </span>
          <h2 className="text-[28px] sm:text-[32px] md:text-[38px] xl:text-[46px] font-bold text-center text-primary mb-4.5">
            Our Office Location
          </h2>
          <p className="max-w-[720px] mx-auto mb-15 text-center text-text-gray text-base md:text-lg leading-relaxed">
            Feel free to visit or schedule a meeting with our travel consultants.
          </p>
          <iframe
            title="Google Map"
            src="https://www.google.com/maps?q=Pune&output=embed"
            loading="lazy"
            className="w-full h-[350px] md:h-[500px] border-none rounded-[22px] mt-12.5 shadow-[0_20px_45px_rgba(0,0,0,0.12)]"
          ></iframe>
        </div>
      </section>
    </>
  );
}

export default Contact;