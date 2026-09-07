import React from "react";
import aboutImage from "../assets/images/about.jpg";
import { useSEO } from "../hooks/useSEO";
import { Target, Compass, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

function About() {
  const navigate = useNavigate();
  useSEO({
    title: "About Us",
    description: "Discover Reservo's mission to curate premium vacation stays, luxury resorts, and high-end retreats with top-tier AI travel concierge support."
  });

  return (
    <div className="bg-bg-light transition-colors duration-300 min-h-screen">

      {/* Hero */}
      <section 
        className="py-[100px] md:py-[150px] px-5 text-center text-white bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(10,17,32,0.75), rgba(10,17,32,0.75)), url(${aboutImage})`
        }}
      >
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="block text-center text-xs font-bold uppercase tracking-widest text-gold mb-3">
            About Reservo
          </span>
          <h1 className="text-[42px] md:text-[64px] font-extrabold my-6 md:my-[25px] leading-tight text-white font-serif">
            Luxury Stays, <br /> Extraordinary Experiences
          </h1>
          <p className="max-w-[760px] mx-auto text-base md:text-xl leading-relaxed md:leading-[1.8] text-white/90 font-medium">
            Reservo is your trusted luxury resort booking platform,
            helping travelers discover premium destinations across India
            with comfort, elegance, and unforgettable hospitality.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 md:py-[100px] bg-bg-light transition-colors duration-300">
        <div className="w-[90%] max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12.5 lg:gap-20 items-center">
          
          <div className="w-full">
            <img
              src={aboutImage}
              alt="Luxury Resort"
              className="w-full rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-border-color"
            />
          </div>

          <div className="text-center lg:text-left">
            <span className="inline-block text-gold font-bold tracking-widest text-xs mb-3.75 uppercase">
              WHO WE ARE
            </span>
            <h2 className="text-[36px] md:text-[48px] font-extrabold text-text-dark font-serif mb-6.25 transition-colors duration-300">
              Making Every Journey Truly Memorable
            </h2>
            <p className="text-text-gray leading-relaxed text-[17px] mb-5.5 transition-colors duration-300">
              Reservo connects travelers with India's finest luxury resorts,
              boutique stays, villas, and nature retreats. Our carefully
              selected properties ensure comfort, elegance, and exceptional
              experiences.
            </p>
            <p className="text-text-gray leading-relaxed text-[17px] mb-5.5 transition-colors duration-300">
              From secure online booking to verified guest reviews and
              dedicated customer support, we simplify every step of your
              vacation planning.
            </p>
            <button 
              onClick={() => navigate("/resorts")}
              className="bg-primary text-white border-none px-[38px] py-4 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-primary-dark hover:-translate-y-1 shadow-md"
            >
              Explore Resorts
            </button>
          </div>

        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-[100px] bg-bg-white transition-colors duration-300 border-t border-border-color">
        <div className="w-[90%] max-w-[1300px] mx-auto">
          <span className="block text-center text-xs font-bold uppercase tracking-widest text-gold mb-3">
            Our Purpose
          </span>
          <h2 className="text-[28px] sm:text-[32px] md:text-[38px] xl:text-[46px] font-extrabold font-serif text-center text-text-dark mb-4.5 transition-colors duration-300">
            Built Around Trust & Luxury
          </h2>
          <p className="max-w-[720px] mx-auto mb-15 text-center text-text-gray text-base md:text-lg leading-relaxed transition-colors duration-300">
            Everything we do is focused on creating unforgettable travel
            experiences for every guest.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8.75 mt-15">
            
            <div className="group bg-bg-light border border-border-color rounded-2xl px-[30px] py-10 text-center shadow-custom transition-all duration-[350ms] ease-out hover:-translate-y-2.5">
              <div className="w-[62px] h-[62px] mx-auto mb-6 bg-bg-white border border-border-color rounded-2xl flex justify-center items-center shadow-sm group-hover:scale-105 group-hover:border-primary/40 transition-all duration-300">
                <Target className="w-7 h-7 text-primary stroke-[2.25] transition-colors duration-300" />
              </div>
              <h3 className="text-3xl font-extrabold text-text-dark mb-[18px] font-serif transition-colors duration-300">Our Mission</h3>
              <p className="text-text-gray leading-relaxed transition-colors duration-300">
                To simplify luxury resort booking through technology,
                transparency, and exceptional customer service.
              </p>
            </div>

            <div className="group bg-bg-light border border-border-color rounded-2xl px-[30px] py-10 text-center shadow-custom transition-all duration-[350ms] ease-out hover:-translate-y-2.5">
              <div className="w-[62px] h-[62px] mx-auto mb-6 bg-bg-white border border-border-color rounded-2xl flex justify-center items-center shadow-sm group-hover:scale-105 group-hover:border-primary/40 transition-all duration-300">
                <Compass className="w-7 h-7 text-primary stroke-[2.25] transition-colors duration-300" />
              </div>
              <h3 className="text-3xl font-extrabold text-text-dark mb-[18px] font-serif transition-colors duration-300">Our Vision</h3>
              <p className="text-text-gray leading-relaxed transition-colors duration-300">
                To become India's most trusted premium travel platform
                for unforgettable luxury vacations.
              </p>
            </div>

            <div className="group bg-bg-light border border-border-color rounded-2xl px-[30px] py-10 text-center shadow-custom transition-all duration-[350ms] ease-out hover:-translate-y-2.5">
              <div className="w-[62px] h-[62px] mx-auto mb-6 bg-bg-white border border-border-color rounded-2xl flex justify-center items-center shadow-sm group-hover:scale-105 group-hover:border-primary/40 transition-all duration-300">
                <Heart className="w-7 h-7 text-primary stroke-[2.25] transition-colors duration-300" />
              </div>
              <h3 className="text-3xl font-extrabold text-text-dark mb-[18px] font-serif transition-colors duration-300">Our Values</h3>
              <p className="text-text-gray leading-relaxed transition-colors duration-300">
                Trust, honesty, quality, customer satisfaction,
                innovation, and premium hospitality.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

export default About;