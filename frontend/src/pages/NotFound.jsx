import React from "react";
import { Link } from "react-router-dom";
const heroImage = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=70&fm=webp";

function NotFound() {
  return (
    <section 
      className="min-h-screen flex justify-center items-center text-center px-5 py-[120px] bg-cover bg-center text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(20,35,32,0.75), rgba(20,35,32,0.75)), url(${heroImage})`
      }}
    >
      <div className="w-[90%] max-w-[1300px] mx-auto">
        <span className="block text-center text-xs font-bold uppercase tracking-widest text-gold mb-3">
          Error 404
        </span>

        <h1 className="text-[90px] md:text-[150px] font-bold text-gold mb-2.5 leading-none">Oops!</h1>

        <h2 className="text-[32px] md:text-[48px] font-bold mb-5">
          This Page Doesn't Exist
        </h2>

        <p className="max-w-[650px] mx-auto text-white/90 text-base md:text-lg leading-relaxed md:leading-[1.9] mb-10">
          The page you're looking for may have been moved, deleted,
          or never existed. Let's get you back to exploring luxury
          destinations.
        </p>

        <Link to="/" className="inline-block px-[30px] md:px-[38px] py-3.5 md:py-4 bg-[#1F3A34] text-white no-underline rounded-full font-semibold transition-all duration-300 hover:bg-[#162B27] hover:-translate-y-1">
          ← Back to Home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;