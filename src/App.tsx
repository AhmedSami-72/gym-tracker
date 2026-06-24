import { useEffect } from 'react';
import { useStore } from './store/useStore';
import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import TrackerView from './components/TrackerView';
import HistoryView from './components/HistoryView';
import ProfileView from './components/ProfileView';
import ProgressView from './components/ProgressView';
import { Dumbbell } from 'lucide-react';

export default function App() {
  const { 
    user, 
    authLoading, 
    initStore, 
    activeTab, 
    setOnlineStatus 
  } = useStore();

  useEffect(() => {
    // 1. Initialize DB and Auth state
    initStore();

    // 2. Track network online/offline state for sync fallback
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initStore, setOnlineStatus]);

  // Screen Loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center space-y-4" dir="rtl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#AA7C11] flex items-center justify-center animate-pulse shadow-xl shadow-[#D4AF37]/10">
          <Dumbbell className="w-7 h-7 text-black stroke-[2.5]" />
        </div>
        <div className="flex flex-col items-center space-y-2">
          <h2 className="text-sm font-bold tracking-wider text-white">
            جاري تحميل محرك أبيكس...
          </h2>
          <span className="text-[10px] text-gray-500 font-mono">استعادة البيانات المحلية سريعة الاستجابة...</span>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!user) {
    return <AuthScreen />;
  }

  // Main App layout with bottom Navbar navigation
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white select-none transition-all pb-16" dir="rtl">
      <main className="transition-all duration-300">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'tracker' && <TrackerView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'progress' && <ProgressView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Floating Bottom Navigation Menu */}
      <Navbar />
    </div>
  );
}
