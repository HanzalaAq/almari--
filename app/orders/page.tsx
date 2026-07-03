'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Package, Truck, CheckCircle, Clock, ArrowRight, RefreshCw, Star, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { release, refund } from '@/lib/payments/escrow';
import ReviewModal from '@/components/ui/ReviewModal';

interface ExchangeProposal {
  id: string;
  proposer_id: string;
  proposer_name: string;
  proposer_photo: string | null;
  target_listing_id: string;
  target_listing_title: string;
  target_listing_images: string[];
  offered_listing_id: string;
  offered_listing_title: string;
  offered_listing_images: string[];
  top_up_amount: number | null;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  created_at: string;
}

interface Order {
  id: string;
  type: 'buy' | 'rent' | 'exchange';
  status: 'pending' | 'shipped' | 'delivered' | 'confirmed' | 'cancelled';
  payment_status: 'held' | 'released' | 'refunded';
  amount: number;
  platform_fee: number;
  total_amount: number;
  deposit_amount: number | null;
  rental_start: string | null;
  rental_end: string | null;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  listing_id: string;
  listing_title: string;
  listing_images: string[];
  listing_city: string;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  seller_name: string;
  buyer_photo: string | null;
  seller_photo: string | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [exchangeProposals, setExchangeProposals] = useState<ExchangeProposal[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'rentals' | 'exchanges'>('active');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  const [autoReleasing, setAutoReleasing] = useState(false);
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      fetchOrders(currentUser.id);
      fetchExchangeProposals(currentUser.id);
    };
    
    fetchUser();
  }, [supabase, router]);
  
  const fetchOrders = async (userId: string) => {
    setLoading(true);
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        listings (title, images, city)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    // Filter by tab
    if (activeTab === 'active') {
      query = query.in('status', ['pending', 'shipped']);
    } else if (activeTab === 'completed') {
      query = query.in('status', ['delivered', 'confirmed']);
    } else if (activeTab === 'rentals') {
      query = query.eq('type', 'rent');
    } else if (activeTab === 'exchanges') {
      query = query.eq('type', 'exchange');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      // Flatten and add user info
      const ordersWithUsers = await Promise.all(
        (data || []).map(async (order: any) => {
          const { data: buyerData } = await supabase
            .from('users')
            .select('name, photo_url')
            .eq('id', order.buyer_id)
            .single();
          
          const { data: sellerData } = await supabase
            .from('users')
            .select('name, photo_url')
            .eq('id', order.seller_id)
            .single();
          
          return {
            ...order,
            listing_title: order.listings?.title || 'Unknown',
            listing_images: order.listings?.images || [],
            listing_city: order.listings?.city || '',
            buyer_name: buyerData?.name || 'Unknown',
            seller_name: sellerData?.name || 'Unknown',
            buyer_photo: buyerData?.photo_url,
            seller_photo: sellerData?.photo_url,
          };
        })
      );
      
      setOrders(ordersWithUsers);
    }
    
    setLoading(false);
  };
  
  const fetchExchangeProposals = async (userId: string) => {
    const { data, error } = await supabase
      .from('exchange_proposals')
      .select(`
        *,
        target_listing:listings!exchange_proposals_target_listing_id_fkey (title, images),
        offered_listing:listings!exchange_proposals_offered_listing_id_fkey (title, images)
      `)
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching exchange proposals:', error);
    } else {
      const proposalsWithUsers = await Promise.all(
        (data || []).map(async (proposal: any) => {
          const { data: proposerData } = await supabase
            .from('users')
            .select('name, photo_url')
            .eq('id', proposal.proposer_id)
            .single();
          
          return {
            ...proposal,
            proposer_name: proposerData?.name || 'Unknown',
            proposer_photo: proposerData?.photo_url,
            target_listing_title: proposal.target_listing?.title || 'Unknown',
            target_listing_images: proposal.target_listing?.images || [],
            offered_listing_title: proposal.offered_listing?.title || 'Unknown',
            offered_listing_images: proposal.offered_listing?.images || [],
          };
        })
      );
      
      setExchangeProposals(proposalsWithUsers);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchOrders(user.id);
      fetchExchangeProposals(user.id);
    }
  }, [activeTab, user]);
  
  const handleMarkShipped = async (orderId: string) => {
    setActionLoading(orderId);
    setError('');
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'shipped',
          shipped_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      
      if (error) {
        setError('Failed to mark as shipped');
      } else {
        fetchOrders(user.id);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleMarkReceived = async (orderId: string) => {
    setActionLoading(orderId);
    setError('');
    
    try {
      // Release escrow payment
      await release(orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          payment_status: 'released',
        })
        .eq('id', orderId);
      
      if (error) {
        setError('Failed to mark as received');
      } else {
        fetchOrders(user.id);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleConfirmReturn = async (orderId: string) => {
    setActionLoading(orderId);
    setError('');
    
    try {
      // Refund deposit
      await refund(orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          payment_status: 'refunded',
        })
        .eq('id', orderId);
      
      if (error) {
        setError('Failed to confirm return');
      } else {
        fetchOrders(user.id);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };
  
  const isBuyer = (order: Order) => order.buyer_id === user.id;
  const isSeller = (order: Order) => order.seller_id === user.id;
  
  const checkCanReview = async (order: Order) => {
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_id', order.id)
      .eq('reviewer_id', user.id)
      .single();
    
    return !existingReview && (order.status === 'confirmed' || order.status === 'delivered');
  };
  
  const handleOpenReview = (order: Order) => {
    setSelectedOrderForReview(order);
    setReviewModalOpen(true);
  };
  
  const handleReviewSuccess = () => {
    fetchOrders(user.id);
  };
  
  const handleAcceptProposal = async (proposalId: string, targetListingId: string, offeredListingId: string) => {
    setActionLoading(proposalId);
    setError('');
    
    try {
      // Update proposal status
      const { error: proposalError } = await supabase
        .from('exchange_proposals')
        .update({ status: 'accepted' })
        .eq('id', proposalId);
      
      if (proposalError) {
        setError('Failed to accept proposal');
        setActionLoading(null);
        return;
      }
      
      // Create orders for both parties
      const { error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            buyer_id: user.id,
            seller_id: exchangeProposals.find(p => p.id === proposalId)?.proposer_id,
            listing_id: targetListingId,
            type: 'exchange',
            amount: 0,
            platform_fee: 0,
            total_amount: 0,
            status: 'pending',
            payment_status: 'released',
          },
          {
            buyer_id: exchangeProposals.find(p => p.id === proposalId)?.proposer_id || '',
            seller_id: user.id,
            listing_id: offeredListingId,
            type: 'exchange',
            amount: 0,
            platform_fee: 0,
            total_amount: 0,
            status: 'pending',
            payment_status: 'released',
          },
        ]);
      
      if (orderError) {
        setError('Failed to create exchange orders');
      } else {
        setSuccess('Exchange proposal accepted!');
        fetchExchangeProposals(user.id);
        fetchOrders(user.id);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleDeclineProposal = async (proposalId: string) => {
    setActionLoading(proposalId);
    setError('');
    
    try {
      const { error } = await supabase
        .from('exchange_proposals')
        .update({ status: 'declined' })
        .eq('id', proposalId);
      
      if (error) {
        setError('Failed to decline proposal');
      } else {
        setSuccess('Exchange proposal declined');
        fetchExchangeProposals(user.id);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleProcessAutoRelease = async () => {
    setAutoReleasing(true);
    setError('');
    
    try {
      // Call the Postgres function to process auto-releases
      const { error } = await supabase.rpc('process_auto_release');
      
      if (error) {
        setError('Failed to process auto-release');
      } else {
        setSuccess('Auto-release processed successfully');
        fetchOrders(user.id);
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setAutoReleasing(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    const badges = {
      'pending': { bg: 'bg-warning', text: 'text-white', label: 'Pending' },
      'shipped': { bg: 'bg-info', text: 'text-white', label: 'Active' },
      'delivered': { bg: 'bg-success', text: 'text-white', label: 'Completed' },
      'confirmed': { bg: 'bg-success', text: 'text-white', label: 'Completed' },
      'cancelled': { bg: 'bg-gray-200', text: 'text-text-muted', label: 'Cancelled' },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    
    return (
      <span className={`${badge.bg} ${badge.text} text-xs font-medium px-2 py-1 rounded-md`}>
        {badge.label}
      </span>
    );
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'delivered':
        return <Package className="w-5 h-5 text-green-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-dark" />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 bg-gray-light py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton variant="text" className="h-8 w-48 mb-6" />
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rectangular" className="h-10 w-24 rounded-full" />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <Skeleton variant="rectangular" className="w-full md:w-48 h-48" />
                    <div className="flex-1 space-y-3">
                      <Skeleton variant="text" className="h-6 w-3/4" />
                      <Skeleton variant="text" className="h-4 w-1/2" />
                      <Skeleton variant="text" className="h-8 w-32" />
                      <Skeleton variant="text" className="h-4 w-full" />
                      <div className="flex gap-2">
                        <Skeleton variant="rectangular" className="h-10 w-32" />
                        <Skeleton variant="rectangular" className="h-10 w-32" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-light py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">My Orders</h1>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
            { id: 'rentals', label: 'Rentals' },
            { id: 'exchanges', label: 'Exchanges' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-fast whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand text-white'
                  : 'bg-transparent border border-border text-text-secondary hover:border-brand'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
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
        
        {/* Exchange Proposals Section */}
        {exchangeProposals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Pending Exchange Proposals</h2>
            <div className="space-y-4">
              {exchangeProposals.map((proposal) => (
                <div key={proposal.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Their Item */}
                    <div className="flex-1">
                      <p className="text-sm text-gray-dark mb-2">Their item (they want from you)</p>
                      <div className="relative w-full h-32 mb-2">
                        <Image
                          src={proposal.target_listing_images[0] || '/placeholder.jpg'}
                          alt={proposal.target_listing_title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <h3 className="font-semibold text-foreground">{proposal.target_listing_title}</h3>
                    </div>
                    
                    {/* Your Item */}
                    <div className="flex-1">
                      <p className="text-sm text-gray-dark mb-2">Your item (they're offering)</p>
                      <div className="relative w-full h-32 mb-2">
                        <Image
                          src={proposal.offered_listing_images[0] || '/placeholder.jpg'}
                          alt={proposal.offered_listing_title}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <h3 className="font-semibold text-foreground">{proposal.offered_listing_title}</h3>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-light overflow-hidden">
                          {proposal.proposer_photo ? (
                            <Image
                              src={proposal.proposer_photo}
                              alt={proposal.proposer_name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                              {proposal.proposer_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{proposal.proposer_name}</p>
                          <p className="text-xs text-gray-dark">Proposed {new Date(proposal.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {proposal.top_up_amount && (
                        <p className="text-sm text-gray-dark">Top-up: PKR {proposal.top_up_amount.toLocaleString()}</p>
                      )}
                      
                      <Button
                        variant="primary"
                        onClick={() => handleAcceptProposal(proposal.id, proposal.target_listing_id, proposal.offered_listing_id)}
                        disabled={actionLoading === proposal.id}
                      >
                        {actionLoading === proposal.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          'Accept'
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleDeclineProposal(proposal.id)}
                        disabled={actionLoading === proposal.id}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {orders.length === 0 && exchangeProposals.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={`No ${activeTab === 'active' ? 'active' : activeTab} orders`}
            description={
              activeTab === 'active' 
                ? "You don't have any active orders at the moment." 
                : activeTab === 'completed'
                ? "You haven't completed any orders yet."
                : activeTab === 'rentals'
                ? "You don't have any rental orders."
                : "You don't have any exchange orders."
            }
            actionLabel={activeTab === 'active' || activeTab === 'completed' ? "Browse Listings" : undefined}
            actionHref={activeTab === 'active' || activeTab === 'completed' ? "/" : undefined}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-normal">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Listing Image */}
                  <div className="relative w-full md:w-48 h-48 flex-shrink-0">
                    <Image
                      src={order.listing_images[0] || '/placeholder.jpg'}
                      alt={order.listing_title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{order.listing_title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-dark mb-2">
                          <span className="capitalize">{order.type}</span>
                          <span>•</span>
                          <span>{order.listing_city}</span>
                          <span>•</span>
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-primary">
                        PKR {order.total_amount.toLocaleString()}
                      </p>
                      {order.deposit_amount && (
                        <p className="text-sm text-gray-dark">
                          Deposit: PKR {order.deposit_amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    {/* Other Party */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-light overflow-hidden">
                        {isBuyer(order) ? (
                          order.seller_photo ? (
                            <Image
                              src={order.seller_photo}
                              alt={order.seller_name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                              {order.seller_name.charAt(0)}
                            </div>
                          )
                        ) : (
                          order.buyer_photo ? (
                            <Image
                              src={order.buyer_photo}
                              alt={order.buyer_name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold">
                              {order.buyer_name.charAt(0)}
                            </div>
                          )
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-dark">
                          {isBuyer(order) ? 'Seller' : 'Buyer'}: <span className="font-medium text-foreground">
                            {isBuyer(order) ? order.seller_name : order.buyer_name}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Rental Dates */}
                    {order.type === 'rent' && order.rental_start && order.rental_end && (
                      <div className="mb-4 text-sm text-gray-dark">
                        <p>Rental Period: {new Date(order.rental_start).toLocaleDateString()} - {new Date(order.rental_end).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      {order.status === 'pending' && isSeller(order) && (
                        <Button
                          variant="primary"
                          onClick={() => handleMarkShipped(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          {actionLoading === order.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <Truck className="w-4 h-4 mr-2" />
                              Mark as Shipped
                            </>
                          )}
                        </Button>
                      )}
                      
                      {order.status === 'shipped' && isBuyer(order) && (
                        <Button
                          variant="primary"
                          onClick={() => handleMarkReceived(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          {actionLoading === order.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm Receipt
                            </>
                          )}
                        </Button>
                      )}
                      
                      {order.status === 'delivered' && order.type === 'rent' && isSeller(order) && (
                        <Button
                          variant="primary"
                          onClick={() => handleConfirmReturn(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          {actionLoading === order.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Confirm Return & Refund
                            </>
                          )}
                        </Button>
                      )}
                      
                      {(order.status === 'confirmed' || order.status === 'delivered') && (
                        <Button
                          variant="outline"
                          onClick={() => handleOpenReview(order)}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Leave Review
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/listing/${order.listing_id}`)}
                      >
                        View Listing
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => router.push('/messages')}
                      >
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Review Modal */}
      {selectedOrderForReview && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedOrderForReview(null);
          }}
          orderId={selectedOrderForReview.id}
          reviewerId={user.id}
          revieweeId={isBuyer(selectedOrderForReview) ? selectedOrderForReview.seller_id : selectedOrderForReview.buyer_id}
          listingId={selectedOrderForReview.listing_id}
          onSuccess={handleReviewSuccess}
        />
      )}
      </main>
      <Footer />
    </div>
  );
}
