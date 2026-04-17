import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Shield, Edit2, Save, X, CheckCircle2, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  wallet_balance: number;
  account_number: string;
  is_verified: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setFetchLoading(true);
    try {
      const response = await api.get('/user/profile');
      if (response.data.success) {
        const user = response.data.data;
        setUserData(user);
        setFormData({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!formData.first_name.trim()) {
      setError('First name is required');
      return;
    }

    if (!formData.last_name.trim()) {
      setError('Last name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.put('/user/profile', formData);
      
      if (response.data.success) {
        const updatedUser = response.data.data;
        setUserData(prev => prev ? { ...prev, ...updatedUser } : null);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to update profile. Please try again.');
      }
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!userData) return;
    
    // Reset form data
    setFormData({
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (fetchLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-slate-400">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userData) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <div className="card text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Failed to load profile'}</p>
            <button onClick={fetchProfile} className="btn-primary max-w-xs mx-auto">
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Profile</h1>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Manage your personal information</p>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 size={18} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {formData.first_name.charAt(0)}{formData.last_name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {formData.first_name} {formData.last_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">{formData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {userData.is_verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                    <CheckCircle2 size={14} />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                    <Shield size={14} />
                    Pending Verification
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Personal Information</h3>
          
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="label">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="input-field"
                  disabled={loading}
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <User size={20} className="text-gray-400 dark:text-slate-500" />
                  <span className="text-gray-900 dark:text-slate-100">{formData.first_name}</span>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="label">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="input-field"
                  disabled={loading}
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <User size={20} className="text-gray-400 dark:text-slate-500" />
                  <span className="text-gray-900 dark:text-slate-100">{formData.last_name}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  disabled={loading}
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <Mail size={20} className="text-gray-400 dark:text-slate-500" />
                  <span className="text-gray-900 dark:text-slate-100">{formData.email}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone Number</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <Phone size={20} className="text-gray-400 dark:text-slate-500" />
                <span className="text-gray-900 dark:text-slate-100">{userData.phone}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-slate-400">Cannot be changed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Account Details</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-slate-400">Account Number</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-slate-100">
                {userData.account_number}
              </span>
            </div>
            
            <div className="divider" />
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-slate-400">Account Balance</span>
              <span className="font-semibold text-gray-900 dark:text-slate-100">
                ₦{userData.wallet_balance.toLocaleString('en-NG')}
              </span>
            </div>
            
            <div className="divider" />
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-slate-400">Member Since</span>
              <div className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Calendar size={16} className="text-gray-400 dark:text-slate-500" />
                {formatDate(userData.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Security Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Security</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/change-password'}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-slate-100">Change Password</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Update your login password</p>
                </div>
              </div>
              <span className="text-gray-400 dark:text-slate-500">→</span>
            </button>

            <button
              onClick={() => window.location.href = '/change-pin'}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Shield size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-slate-100">Change PIN</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Update your transaction PIN</p>
                </div>
              </div>
              <span className="text-gray-400 dark:text-slate-500">→</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
