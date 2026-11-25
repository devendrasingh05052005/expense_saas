import React from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Monitor, WifiOff } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { Button } from './Button';

export const PWAInstallModal: React.FC = () => {
  const { isOnline, isIOS, showInstallGuide, setShowInstallGuide, promptInstall, canInstall, isStandalone } = useNetwork();

  return (
    <>
      {/* Offline Toast / Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>Offline Mode: Live database synchronization is paused. Connect to internet to sync changes.</span>
        </div>
      )}

      {/* PWA Install Modal */}
      {showInstallGuide && !isStandalone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/25 shrink-0">
                R
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Install RoomMates App
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cross-Platform App for Android, iPhone & Windows
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-gray-600 dark:text-gray-300 my-4">
              {isIOS ? (
                // iOS Specific Installation Steps
                <div className="space-y-3 bg-gray-50 dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-brand-600" />
                    <span>How to Install on iPhone / iPad:</span>
                  </div>
                  <ol className="space-y-2.5 list-decimal list-inside text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-brand-600">1.</span>
                      <span>Tap the <strong>Share</strong> button at the bottom of Safari (<Share2 className="w-3.5 h-3.5 inline mx-1 text-brand-500" />).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-brand-600">2.</span>
                      <span>Scroll down and tap <strong>Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-1 text-brand-500" />).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-brand-600">3.</span>
                      <span>Tap <strong>Add</strong> at top right to launch RoomMates as a native standalone app!</span>
                    </li>
                  </ol>
                </div>
              ) : (
                // Android & Windows Desktop Steps
                <div className="space-y-3 bg-gray-50 dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                  <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-brand-600" />
                    <span>Android & Windows Desktop Installation:</span>
                  </div>
                  <p>
                    Install RoomMates for instant standalone window access, native performance, and offline support with live PostgreSQL database sync.
                  </p>
                  {canInstall && (
                    <Button
                      onClick={async () => {
                        await promptInstall();
                        setShowInstallGuide(false);
                      }}
                      className="w-full text-xs font-semibold py-2.5"
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Click to Install Now
                    </Button>
                  )}
                  {!canInstall && (
                    <p className="text-[11px] text-gray-500 italic">
                      Or click the <strong>Install Icon (⊕)</strong> in your browser's address bar (Chrome, Edge, or Brave).
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500 pt-1">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border">
                  <span className="block font-bold text-gray-800 dark:text-gray-200">100% Free</span>
                  <span>No App Store needed</span>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border">
                  <span className="block font-bold text-gray-800 dark:text-gray-200">Same Live Data</span>
                  <span>Neon PostgreSQL sync</span>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border">
                  <span className="block font-bold text-gray-800 dark:text-gray-200">Fast & Native</span>
                  <span>Standalone window</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowInstallGuide(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
