import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkContextType {
  isOnline: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<boolean>;
  showInstallGuide: boolean;
  setShowInstallGuide: (show: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  // Check if running as standalone PWA
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  // Check iOS device
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Dispatch refresh events to all active pages
      window.dispatchEvent(new CustomEvent('expense-updated'));
      window.dispatchEvent(new CustomEvent('fund-updated'));
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Capture PWA install prompt on Chromium / Android / Windows
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setShowInstallGuide(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
      return false;
    }
    // If on iOS, open the guide modal
    if (isIOS && !isStandalone) {
      setShowInstallGuide(true);
      return true;
    }
    // For other browsers where prompt isn't directly invocable
    setShowInstallGuide(true);
    return false;
  };

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isStandalone,
        canInstall: (canInstall || (isIOS && !isStandalone)) && !isStandalone,
        isIOS,
        promptInstall,
        showInstallGuide,
        setShowInstallGuide,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
