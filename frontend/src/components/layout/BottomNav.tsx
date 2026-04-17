import { Home, List, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/dashboard',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: List,
      path: '/transactions',
    },
    {
      id: 'more',
      label: 'More',
      icon: Settings,
      path: '/settings',
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 safe-bottom z-50">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`
                  flex-1 flex flex-col items-center justify-center py-3 px-2
                  transition-colors duration-200
                  ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'}
                `}
              >
                <Icon
                  size={24}
                  className={`mb-1 transition-all duration-200 ${
                    active ? 'scale-110' : ''
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-xs font-medium transition-all duration-200 ${
                    active ? 'scale-105' : ''
                  }`}
                >
                  {tab.label}
                </span>
                
                {/* Active indicator */}
                {active && (
                  <div className="absolute bottom-0 w-12 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
