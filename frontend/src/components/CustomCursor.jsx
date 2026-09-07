import React, { useEffect, useRef, useState } from "react";

function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setIsVisible(true);
      const { clientX: x, clientY: y } = e;
      
      if (dotRef.current) {
        dotRef.current.style.left = `${x}px`;
        dotRef.current.style.top = `${y}px`;
      }
      
      if (ringRef.current) {
        ringRef.current.animate(
          {
            left: `${x}px`,
            top: `${y}px`
          },
          { duration: 250, fill: "forwards" }
        );
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      const isClickable = 
        target.tagName === "BUTTON" || 
        target.tagName === "A" || 
        target.closest("button") || 
        target.closest("a") ||
        target.closest(".destination-card") ||
        target.closest(".resort-card") ||
        target.closest(".experience-card") ||
        target.classList.contains("clickable") ||
        target.style.cursor === "pointer";
      
      setIsHovered(isClickable);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div 
        ref={dotRef} 
        className={`fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color] duration-200 ${
          isHovered 
            ? "w-1 h-1 bg-gold" 
            : isClicking 
              ? "w-0.75 h-0.75 bg-text-dark" 
              : "w-2 h-2 bg-text-dark"
        }`}
      />
      <div 
        ref={ringRef} 
        className={`fixed border border-gold rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 ease-out ${
          isHovered 
            ? "w-13.5 h-13.5 bg-gold/18" 
            : isClicking 
              ? "w-8.5 h-8.5 bg-gold/30" 
              : "w-10 h-10 bg-transparent"
        }`}
      >
        <span className={`text-text-dark text-base font-bold transition-all duration-200 block leading-none ${
          isHovered ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}>+</span>
      </div>
    </>
  );
}

export default CustomCursor;
