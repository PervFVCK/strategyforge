import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Shield, 
  Moon, 
  LogOut, 
  Trash2, 
  HelpCircle, 
  FileText,
  ChevronRight,
  User
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockUser } from '@/lib/mock-data';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: true,
    biometric: false,
    darkMode: false,
  });

  useEffect(() => {
    // Load saved settings
    const savedTheme = localStorage.getItem('theme');
    const savedNotifications = localStorage.getItem('setting_notifications');
    const savedBiometric = localStorage.getItem('setting_biometric');

    setSettings({
      notifications: savedNotifications === 'true',
      biometric: savedBiometric === 'true',
      darkMode: savedTheme === 'dark',
    });

    // Apply dark mode on mount
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleSetting = (key: keyof typeof settings) => {
    const newValue = !settings[key];
    
    setSettings(prev => ({
      ...prev,
      [key]: newValue,
    }));

    // Handle dark mode
    if (key === 'darkMode') {
      if (newValue) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }

    // Save other settings to localStorage
    localStorage.setItem(`setting_${key}`, newValue.toString());
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
    }
  };

  const handleDeleteAccount = () => {
    alert('Delete account feature coming in Phase 3!');
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Manage your app preferences</p>
        </div>

        {/* Profile Quick Access */}
        <button
          onClick={() => navigate('/profile')}
          className="w-full card flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {mockUser.first_name.charAt(0)}{mockUser.last_name.charAt(0)}
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">
              {mockUser.first_name} {mockUser.last_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">{mockUser.email}</p>
          </div>
          <ChevronRight className="text-gray-400 dark:text-slate-500" />
        </button>

        {/* Preferences */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Preferences</h3>
          
          <div className="space-y-4">
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Bell size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Push Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Receive transaction alerts</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting('notifications')}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${settings.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}
                `}
              >
                <div className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform
                  ${settings.notifications ? 'translate-x-6' : 'translate-x-0.5'}
                `} />
              </button>
            </div>

            <div className="divider" />

            {/* Biometric */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Shield size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Biometric Login</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Use fingerprint/face ID</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting('biometric')}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${settings.biometric ? 'bg-purple-600' : 'bg-gray-300 dark:bg-slate-600'}
                `}
              >
                <div className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform
                  ${settings.biometric ? 'translate-x-6' : 'translate-x-0.5'}
                `} />
              </button>
            </div>

            <div className="divider" />

            {/* Dark Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 dark:bg-slate-700 flex items-center justify-center">
                  <Moon size={20} className="text-white dark:text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Dark Mode</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Use dark theme</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting('darkMode')}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${settings.darkMode ? 'bg-gray-800' : 'bg-gray-300'}
                `}
              >
                <div className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform
                  ${settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'}
                `} />
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Account</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <User size={20} className="text-gray-600 dark:text-slate-400" />
                <span className="text-gray-900 dark:text-slate-100">Edit Profile</span>
              </div>
              <ChevronRight size={20} className="text-gray-400 dark:text-slate-500" />
            </button>

            <button
              onClick={() => navigate('/change-password')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-gray-600 dark:text-slate-400" />
                <span className="text-gray-900 dark:text-slate-100">Change Password</span>
              </div>
              <ChevronRight size={20} className="text-gray-400 dark:text-slate-500" />
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Support</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => alert('Help center coming soon!')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={20} className="text-gray-600 dark:text-slate-400" />
                <span className="text-gray-900 dark:text-slate-100">Help Center</span>
              </div>
              <ChevronRight size={20} className="text-gray-400 dark:text-slate-500" />
            </button>

            <button
              onClick={() => alert('Terms coming soon!')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-gray-600 dark:text-slate-400" />
                <span className="text-gray-900 dark:text-slate-100">Terms & Privacy</span>
              </div>
              <ChevronRight size={20} className="text-gray-400 dark:text-slate-500" />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200 dark:border-red-900/50">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
          
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600 dark:text-red-400"
            >
              <div className="flex items-center gap-3">
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </div>
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600 dark:text-red-400"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={20} />
                <span className="font-medium">Delete Account</span>
              </div>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 dark:text-slate-500 pb-4">
          <p>PayOM v1.0.0</p>
          <p className="mt-1">Built with ❤️ in Nigeria</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
