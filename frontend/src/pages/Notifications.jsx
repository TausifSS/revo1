import React, { useState, useEffect } from "react";
import { Bell, Sparkles, Star, Tag, MailOpen, Trash2, ShieldCheck } from "lucide-react";
import { notificationService } from "../services/notification.service";
import { NotificationSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import ErrorScreen from "../components/ErrorScreen";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch (err) {
      alert("Failed to mark notifications as read.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      alert("Failed to delete notification.");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "planner":
        return <Sparkles className="w-4 h-4 text-primary" />;
      case "points":
        return <Star className="w-4 h-4 text-amber-500 fill-current" />;
      case "offer":
        return <Tag className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-text-gray" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light pt-28 pb-20 px-6 font-sans">
        <div className="max-w-[700px] mx-auto space-y-6">
          <div className="border-b border-border-color pb-4">
            <h1 className="text-3xl font-serif font-extrabold text-text-dark">Notifications</h1>
            <p className="text-sm text-text-gray mt-1">Fetching your messages...</p>
          </div>
          <div className="space-y-4">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-light pt-28 pb-20 px-6 flex items-center justify-center">
        <ErrorScreen type="network" message={error} onRetry={fetchNotifications} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light pt-28 pb-20 px-6 font-sans transition-colors duration-300">
      <div className="max-w-[700px] mx-auto space-y-6 animate-fade-in">
        
        {/* Header Title */}
        <div className="flex justify-between items-end border-b border-border-color pb-4">
          <div>
            <h1 className="text-3xl font-serif font-extrabold text-text-dark">Notifications</h1>
            <p className="text-sm text-text-gray mt-1 font-medium">Keep track of reward points balances and promotions.</p>
          </div>
          {notifications.some(n => n.unread) && (
            <button 
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-primary hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
            >
              <MailOpen className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((n) => (
            <div 
              key={n.id}
              className={`bg-bg-white border rounded-2xl p-4.5 shadow-sm transition-all duration-300 flex gap-4 relative overflow-hidden ${
                n.unread ? "border-primary" : "border-border-color"
              }`}
            >
              {n.unread && (
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              )}

              {/* Icon container */}
              <div className="w-9 h-9 rounded-full bg-bg-light flex items-center justify-center shrink-0">
                {getNotificationIcon(n.type)}
              </div>

              {/* Content body */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-text-dark">{n.title}</h4>
                  <span className="text-[9px] text-text-gray font-semibold">{n.time}</span>
                </div>
                <p className="text-xs text-text-gray leading-relaxed font-semibold">{n.desc}</p>
              </div>

              {/* Action delete */}
              <button 
                onClick={() => handleDelete(n.id)}
                className="w-8 h-8 rounded-full hover:bg-red-500/5 text-text-gray hover:text-red-500 flex items-center justify-center border-none bg-transparent cursor-pointer shrink-0 self-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

            </div>
          ))}

          {notifications.length === 0 && (
            <EmptyState 
              title="Inbox is empty"
              description="You are all caught up for today. We will let you know when something new comes up."
              icon={Bell}
            />
          )}
        </div>

      </div>
    </div>
  );
}
