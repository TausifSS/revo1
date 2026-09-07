import React from "react";

// Generic Skeleton Component
export function Skeleton({ className, variant = "text" }) {
  const getShapeClass = () => {
    switch (variant) {
      case "circle":
        return "rounded-full";
      case "rect":
        return "rounded-2xl";
      case "text":
      default:
        return "rounded-md h-4";
    }
  };

  return (
    <div className={`shimmer ${getShapeClass()} ${className || ""}`} />
  );
}

// Airbnb/Premium style Resort/Hotel Card Skeleton
export function ResortCardSkeleton() {
  return (
    <div className="bg-bg-white border border-border-color rounded-3xl p-4.5 shadow-sm space-y-4">
      {/* Gallery Image Skeleton */}
      <Skeleton variant="rect" className="w-full h-[220px]" />
      
      {/* Detail specs */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" className="w-2/3 h-5" />
          <Skeleton variant="text" className="w-10 h-5" />
        </div>
        <Skeleton variant="text" className="w-1/2 h-3.5" />
        <div className="flex items-center gap-1.5 pt-2">
          <Skeleton variant="circle" className="w-4.5 h-4.5" />
          <Skeleton variant="text" className="w-1/3 h-3.5" />
        </div>
      </div>

      {/* Pricing Footer Skeleton */}
      <div className="flex justify-between items-center pt-4 border-t border-border-color">
        <div className="space-y-1">
          <Skeleton variant="text" className="w-16 h-5" />
          <Skeleton variant="text" className="w-10 h-3" />
        </div>
        <Skeleton variant="rect" className="w-24 h-9.5 rounded-xl" />
      </div>
    </div>
  );
}

// Booking List Item Skeleton
export function BookingCardSkeleton() {
  return (
    <div className="bg-bg-white border border-border-color rounded-3xl p-5 shadow-sm flex flex-col md:flex-row gap-5">
      {/* Image Block */}
      <Skeleton variant="rect" className="w-full md:w-[160px] h-[110px] shrink-0" />
      
      {/* Content Block */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 w-1/2">
              <Skeleton variant="text" className="w-1/3 h-2.5" />
              <Skeleton variant="text" className="w-3/4 h-5" />
            </div>
            <Skeleton variant="rect" className="w-18 h-5 rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton variant="text" className="w-1/2 h-2" />
                <Skeleton variant="text" className="w-2/3 h-3.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border-color">
          <Skeleton variant="text" className="w-1/4 h-3.5" />
          <div className="flex-1" />
          <Skeleton variant="rect" className="w-24 h-7.5 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Notification Skeleton
export function NotificationSkeleton() {
  return (
    <div className="bg-bg-white border border-border-color rounded-2xl p-4.5 shadow-sm flex gap-4">
      <Skeleton variant="circle" className="w-9 h-9 shrink-0" />
      <div className="flex-grow space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" className="w-1/3 h-4" />
          <Skeleton variant="text" className="w-12 h-3" />
        </div>
        <Skeleton variant="text" className="w-5/6 h-3" />
      </div>
    </div>
  );
}

// Profile Page Content Skeleton
export function ProfileSkeleton() {
  return (
    <div className="bg-bg-white border border-border-color rounded-3xl p-10 shadow-custom space-y-6">
      <div className="space-y-2">
        <Skeleton variant="text" className="w-1/4 h-6" />
        <Skeleton variant="text" className="w-1/2 h-4" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" className="w-1/3 h-3" />
            <Skeleton variant="rect" className="w-full h-11" />
          </div>
        ))}
      </div>
      <Skeleton variant="rect" className="w-32 h-11 rounded-lg" />
    </div>
  );
}
