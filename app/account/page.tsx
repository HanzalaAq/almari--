'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Wallet, Settings, LogOut, Edit, Star, Package, ArrowRight, CreditCard } from 'lucide-react';
import Image from 'next/image';

interface UserProfile {
  id: string;
  name: string;
  city: string;
  photo_url: string | null;
  created_at: string;
}

interface WalletBalance {
  total_released: number;
  total_commission: number;
  available_balance: number;
}

interface OrderStats {
  total_sold: number;
  total_rented: number;
  total_exchanged: number;
}

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    total_released: 0,
    total_commission: 0,
    available_balance: 0,
  });
  const [orderStats, setOrderStats] = useState<OrderStats>({
    total_sold: 0,
    total_rented: 0,
    total_exchanged: 0,
  });
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      fetchProfile(currentUser.id);
      fetchWalletBalance(currentUser.id);
      fetchOrderStats(currentUser.id);
    };
    
    fetchData();
  }, [supabase, router]);
  
  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
      setEditForm({ name: data.name, city: data.city });
    }
  };
  
  const fetchWalletBalance = async (userId: string) => {
    // Calculate wallet balance from released orders
    const { data: releasedOrders } = await supabase
      .from('orders')
      .select('amount, platform_fee')
      .eq('seller_id', userId)
      .eq('payment_status', 'released');
    
    if (releasedOrders) {
      const totalReleased = releasedOrders.reduce((sum, order) => sum + order.amount, 0);
      const totalCommission = releasedOrders.reduce((sum, order) => sum + order.platform_fee, 0);
      
      setWalletBalance({
        total_released: totalReleased,
        total_commission: totalCommission,
        available_balance: totalReleased - totalCommission,
      });
    }
    
    setLoading(false);
  };
  
  const fetchOrderStats = async (userId: string) => {
    const { data: orders } = await supabase
      .from('orders')
      .select('type, status')
      .eq('seller_id', userId)
      .in('status', ['confirmed', 'delivered']);
    
    if (orders) {
      setOrderStats({
        total_sold: orders.filter(o => o.type === 'buy').length,
        total_rented: orders.filter(o => o.type === 'rent').length,
        total_exchanged: orders.filter(o => o.type === 'exchange').length,
      });
    }
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editForm.name.trim(),
          city: editForm.city.trim(),
        })
        .eq('id', user.id);
      
      if (error) {
        setError('Failed to update profile');
      } else {
        setSuccess('Profile updated successfully');
        setEditing(false);
        fetchProfile(user.id);
      }
    } catch (err) {
      setError('An error occurred');
    }
  };
  
  const handleWithdraw = async () => {
    if (walletBalance.available_balance <= 0) {
      setError('No funds available to withdraw');
      return;
    }
    
    setWithdrawing(true);
    setError('');
    setSuccess('');
    
    // Mock withdrawal - just show confirmation
    setTimeout(() => {
      setWithdrawing(false);
      setSuccess(`Withdrawal of PKR ${walletBalance.available_balance.toLocaleString()} requested. (Mocked - no actual transfer)`);
    }, 1500);
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-light py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">My Account</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}
        
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-light overflow-hidden">
                {profile?.photo_url ? (
                  <Image
                    src={profile.photo_url}
                    alt={profile.name}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-white text-2xl font-bold">
                    {profile?.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{profile?.name}</h2>
                <p className="text-gray-dark">{profile?.city}</p>
                <p className="text-sm text-gray-dark">
                  Member since {new Date(profile?.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              <Edit className="w-4 h-4 mr-2" />
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          
          {editing && (
            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </form>
          )}
        </div>
        
        {/* Wallet Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Wallet</h2>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 mb-4">
            <p className="text-sm text-gray-dark mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-primary">
              PKR {walletBalance.available_balance.toLocaleString()}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-light rounded-lg p-4">
              <p className="text-sm text-gray-dark mb-1">Total Released</p>
              <p className="text-lg font-semibold text-foreground">
                PKR {walletBalance.total_released.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-light rounded-lg p-4">
              <p className="text-sm text-gray-dark mb-1">Commission (10%)</p>
              <p className="text-lg font-semibold text-foreground">
                PKR {walletBalance.total_commission.toLocaleString()}
              </p>
            </div>
          </div>
          
          <Button
            variant="primary"
            className="w-full"
            onClick={handleWithdraw}
            disabled={withdrawing || walletBalance.available_balance <= 0}
          >
            {withdrawing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Withdraw Funds
              </>
            )}
          </Button>
          <p className="text-xs text-gray-dark mt-2 text-center">
            Withdrawals are processed within 3-5 business days (Mocked)
          </p>
        </div>
        
        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">My Stats</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{orderStats.total_sold}</p>
              <p className="text-sm text-gray-dark">Sold</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{orderStats.total_rented}</p>
              <p className="text-sm text-gray-dark">Rented</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{orderStats.total_exchanged}</p>
              <p className="text-sm text-gray-dark">Exchanged</p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push('/orders')}
            >
              <span>View Orders</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push('/sell')}
            >
              <span>Create New Listing</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push('/messages')}
            >
              <span>Messages</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
          </div>
          
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
