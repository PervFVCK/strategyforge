import { quickActions } from '@/lib/mock-data';

export default function QuickActions() {
  const handleAction = (path: string) => {
    // For now, show coming soon
    alert(`${path} feature coming in Phase 3!`);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action.label)}
            className="group relative flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200"
          >
            {/* Icon container with gradient background */}
            <div className={`
              w-14 h-14 flex items-center justify-center rounded-2xl mb-3
              ${action.color} bg-opacity-10 dark:bg-opacity-20 text-2xl
              group-hover:scale-110 transition-transform duration-200
            `}>
              {action.icon}
            </div>
            
            {/* Label */}
            <span className="text-xs font-medium text-gray-700 dark:text-slate-200 text-center leading-tight">
              {action.label}
            </span>

            {/* Hover effect indicator */}
            <div className="absolute inset-0 rounded-xl bg-blue-50 dark:bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
          </button>
        ))}
      </div>
    </div>
  );
}
