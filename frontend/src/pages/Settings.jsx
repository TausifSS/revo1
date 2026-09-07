import React, { useState } from "react";
import { Settings as SettingsIcon, Bell, Shield, Eye, Moon, Check } from "lucide-react";

export default function Settings() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [appNotif, setAppNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [marketingNotif, setMarketingNotif] = useState(false);

  const [toastMsg, setToastMsg] = useState("");

  const handleSave = () => {
    setToastMsg("Settings configurations saved successfully!");
    setTimeout(() => setToastMsg(""), 3500);
  };

  return (
    <div className="min-h-screen bg-bg-light pt-28 pb-20 px-6 font-sans transition-colors duration-300">
      <div className="max-w-[700px] mx-auto space-y-6 animate-fade-in relative">
        
        {/* Toast Alert */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-[999] bg-[#121e1b] text-white border border-[#334155] py-3.5 px-5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMsg}</span>
          </div>
        )}

        {/* Header Title */}
        <div className="border-b border-border-color pb-4">
          <h1 className="text-3xl font-serif font-extrabold text-text-dark">Settings</h1>
          <p className="text-sm text-text-gray mt-1 font-medium">Manage your security passwords, notification toggles, and UI variables.</p>
        </div>

        {/* Settings Box 1: Notifications */}
        <div className="bg-bg-white border border-border-color rounded-3xl p-6 shadow-sm space-y-5">
          <h3 className="text-base font-serif font-bold text-text-dark flex items-center gap-2 border-b border-border-color pb-3">
            <Bell className="w-4 h-4 text-primary" /> Notifications Configuration
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-text-dark">Email Notification updates</h4>
                <p className="text-[10.5px] text-text-gray mt-0.5">Receive receipts and dynamic tickets in your inbox.</p>
              </div>
              <input 
                type="checkbox" 
                checked={emailNotif} 
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="w-8.5 h-4.5 accent-primary cursor-pointer" 
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-text-dark">App Push alerts</h4>
                <p className="text-[10.5px] text-text-gray mt-0.5">Receive HMR updates and active support notifications.</p>
              </div>
              <input 
                type="checkbox" 
                checked={appNotif} 
                onChange={(e) => setAppNotif(e.target.checked)}
                className="w-8.5 h-4.5 accent-primary cursor-pointer" 
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-text-dark">SMS Transit alerts</h4>
                <p className="text-[10.5px] text-text-gray mt-0.5">Receive cab transfer coordinates on your mobile number.</p>
              </div>
              <input 
                type="checkbox" 
                checked={smsNotif} 
                onChange={(e) => setSmsNotif(e.target.checked)}
                className="w-8.5 h-4.5 accent-primary cursor-pointer" 
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-text-dark">Promotional & offers newsletter</h4>
                <p className="text-[10.5px] text-text-gray mt-0.5">Receive marketing deals for upcoming vacations.</p>
              </div>
              <input 
                type="checkbox" 
                checked={marketingNotif} 
                onChange={(e) => setMarketingNotif(e.target.checked)}
                className="w-8.5 h-4.5 accent-primary cursor-pointer" 
              />
            </div>
          </div>
        </div>

        {/* Settings Box 2: Password & Security */}
        <div className="bg-bg-white border border-border-color rounded-3xl p-6 shadow-sm space-y-5">
          <h3 className="text-base font-serif font-bold text-text-dark flex items-center gap-2 border-b border-border-color pb-3">
            <Shield className="w-4 h-4 text-amber-500" /> Password & Security
          </h3>

          <div className="space-y-4 text-[12px] font-semibold text-text-dark">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-gray uppercase font-bold">Current Password</label>
              <input 
                type="password" 
                placeholder="••••••••••••"
                className="p-3 border border-border-color bg-bg-light text-text-dark text-sm rounded-lg outline-none focus:border-primary transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-gray uppercase font-bold">New Security Password</label>
              <input 
                type="password" 
                placeholder="••••••••••••"
                className="p-3 border border-border-color bg-bg-light text-text-dark text-sm rounded-lg outline-none focus:border-primary transition"
              />
            </div>
          </div>
        </div>

        {/* Settings Box 3: Connected Accounts */}
        <div className="bg-bg-white border border-border-color rounded-3xl p-6 shadow-sm space-y-5">
          <h3 className="text-base font-serif font-bold text-text-dark flex items-center gap-2 border-b border-border-color pb-3">
            <Shield className="w-4 h-4 text-emerald-500" /> Connected Social Accounts
          </h3>

          <div className="space-y-4">
            {/* Google */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-bg-light border border-border-color flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-dark">Google Connection</h4>
                  <p className="text-[10px] text-text-gray mt-0.5">Connected as user@gmail.com</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setToastMsg("Google account unlinked.")}
                className="px-4 py-1.5 border border-red-200 text-red-500 rounded-xl text-[10px] font-bold cursor-pointer bg-transparent hover:bg-red-50 transition border-none"
              >
                Disconnect
              </button>
            </div>

            {/* Facebook */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-bg-light border border-border-color flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-dark">Facebook Connection</h4>
                  <p className="text-[10px] text-text-gray mt-0.5">Link your Facebook account for fast single sign-on</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setToastMsg("Facebook account connection initiated...")}
                className="px-4 py-1.5 border border-border-color text-text-dark rounded-xl text-[10px] font-bold cursor-pointer bg-transparent hover:bg-bg-light transition border-none"
              >
                Connect
              </button>
            </div>

            {/* X (Twitter) */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-bg-light border border-border-color flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" width="16" height="16" className="text-text-dark fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-dark">X Connection</h4>
                  <p className="text-[10px] text-text-gray mt-0.5">Link your X (Twitter) account</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setToastMsg("X (Twitter) account connection initiated...")}
                className="px-4 py-1.5 border border-border-color text-text-dark rounded-xl text-[10px] font-bold cursor-pointer bg-transparent hover:bg-bg-light transition border-none"
              >
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow border-none cursor-pointer text-center"
        >
          Save Configurations
        </button>

      </div>
    </div>
  );
}
