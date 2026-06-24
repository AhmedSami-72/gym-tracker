import { useStore } from '../store/useStore';
import { LayoutDashboard, Play, History, User, TrendingUp } from 'lucide-react';

export default function Navbar() {
  const { activeTab, setTab, activeWorkout } = useStore();

  interface TabItem {
    id: 'dashboard' | 'tracker' | 'history' | 'profile' | 'progress';
    label: string;
    icon: any;
    isLive?: boolean;
  }

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'progress', label: 'التقدم', icon: TrendingUp },
    { 
      id: 'tracker', 
      label: activeWorkout ? 'مباشر' : 'تمرين', 
      icon: Play,
      isLive: !!activeWorkout 
    },
    { id: 'history', label: 'السجل', icon: History },
    { id: 'profile', label: 'حسابي', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-md border-t border-gray-900 pb-safe-bottom z-40 max-w-7xl mx-auto" dir="rtl">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-gray-500 hover:text-white transition-all focus:outline-none group cursor-pointer"
            >
              {tab.isLive && (
                <span className="absolute top-2.5 right-6 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4AF37]"></span>
                </span>
              )}
              
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? 'text-[#D4AF37] bg-white/5' 
                  : 'group-hover:text-white'
              }`}>
                <Icon className={`w-5.5 h-5.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              
              <span className={`text-[10px] font-bold tracking-wide mt-0.5 ${
                isActive ? 'text-[#D4AF37]' : 'text-gray-500'
              }`}>
                {tab.label}
              </span>

              {isActive && (
                <div className="absolute top-0 w-8 h-[2px] bg-[#D4AF37] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
