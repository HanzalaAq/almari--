'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Navbar from '@/components/layout/Navbar';
import { Upload, Camera } from 'lucide-react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const cities = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Sukkur', 'Larkana', 'Abbottabad', 'Sargodha'
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      setPhone(user.phone || '');
    };
    getUser();
  }, [supabase, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const uploadProfilePic = async (userId: string): Promise<string | null> => {
    if (!profilePic) return null;

    const fileExt = profilePic.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profile-pics/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, profilePic);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim() || !city) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      let profilePicUrl: string | null = null;
      
      if (profilePic) {
        profilePicUrl = await uploadProfilePic(userId);
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          phone: phone,
          name: name.trim(),
          city: city,
          profile_pic_url: profilePicUrl,
          verified: false,
          rating: 0,
          wallet_balance: 0,
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          phone: phone,
          name: 'User',
          city: 'Karachi',
          verified: false,
          rating: 0,
          wallet_balance: 0,
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar minimal />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Complete Your Profile</h1>
          <p className="text-gray-dark">
            Tell us a bit about yourself to get started
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-full h-full rounded-full object-cover border-4 border-gray-medium"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-light border-4 border-gray-medium flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-dark" />
                </div>
              )}
              <label
                htmlFor="profile-pic"
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-hover transition-colors"
              >
                <Upload className="w-4 h-4" />
              </label>
              <input
                id="profile-pic"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-dark">Optional • Max 5MB</p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
              City *
            </label>
            <select
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              required
            >
              <option value="">Select your city</option>
              {cities.map((cityOption) => (
                <option key={cityOption} value={cityOption}>
                  {cityOption}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Complete Setup'}
          </Button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-gray-dark hover:text-foreground text-sm"
            disabled={loading}
          >
            Skip for now
          </button>
        </form>
      </div>
      </main>
    </div>
  );
}
