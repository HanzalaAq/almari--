/**
 * Mocked Escrow/Payment Service
 * 
 * This module simulates payment processing for Almari.
 * In production, this would integrate with Aasaan Pay or similar payment gateway.
 * For now, all operations are simulated with logging and mock responses.
 */

export interface PaymentHoldRequest {
  amount: number;
  buyerId: string;
  sellerId: string;
  orderId: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface EscrowState {
  orderId: string;
  amount: number;
  status: 'held' | 'released' | 'refunded';
  buyerId: string;
  sellerId: string;
  heldAt: Date;
  releasedAt?: Date;
  refundedAt?: Date;
}

// In-memory storage for escrow states (in production, this would be in the database)
const escrowStates = new Map<string, EscrowState>();

/**
 * Hold funds in escrow when a buyer makes a purchase
 */
export async function hold(request: PaymentHoldRequest): Promise<PaymentResult> {
  console.log('[ESCROW] Holding funds:', {
    amount: request.amount,
    buyerId: request.buyerId,
    sellerId: request.sellerId,
    orderId: request.orderId,
  });

  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Store escrow state
  escrowStates.set(request.orderId, {
    orderId: request.orderId,
    amount: request.amount,
    status: 'held',
    buyerId: request.buyerId,
    sellerId: request.sellerId,
    heldAt: new Date(),
  });

  console.log('[ESCROW] Funds held successfully:', transactionId);

  return {
    success: true,
    transactionId,
  };
}

/**
 * Release funds to seller when order is confirmed
 * Deducts 10% platform commission
 */
export async function release(orderId: string): Promise<PaymentResult> {
  const escrow = escrowStates.get(orderId);

  if (!escrow) {
    console.error('[ESCROW] No escrow found for order:', orderId);
    return {
      success: false,
      error: 'Escrow not found',
    };
  }

  if (escrow.status !== 'held') {
    console.error('[ESCROW] Escrow not in held state:', escrow.status);
    return {
      success: false,
      error: 'Escrow not in held state',
    };
  }

  console.log('[ESCROW] Releasing funds:', {
    orderId,
    amount: escrow.amount,
    sellerId: escrow.sellerId,
  });

  // Calculate commission (10%)
  const commission = escrow.amount * 0.1;
  const payout = escrow.amount - commission;

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Update escrow state
  escrow.status = 'released';
  escrow.releasedAt = new Date();
  escrowStates.set(orderId, escrow);

  console.log('[ESCROW] Funds released:', {
    orderId,
    payout,
    commission,
    transactionId: `release_${Date.now()}`,
  });

  return {
    success: true,
    transactionId: `release_${Date.now()}`,
  };
}

/**
 * Refund funds to buyer (for rentals or cancelled orders)
 */
export async function refund(orderId: string): Promise<PaymentResult> {
  const escrow = escrowStates.get(orderId);

  if (!escrow) {
    console.error('[ESCROW] No escrow found for order:', orderId);
    return {
      success: false,
      error: 'Escrow not found',
    };
  }

  if (escrow.status !== 'held') {
    console.error('[ESCROW] Escrow not in held state:', escrow.status);
    return {
      success: false,
      error: 'Escrow not in held state',
    };
  }

  console.log('[ESCROW] Refunding funds:', {
    orderId,
    amount: escrow.amount,
    buyerId: escrow.buyerId,
  });

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Update escrow state
  escrow.status = 'refunded';
  escrow.refundedAt = new Date();
  escrowStates.set(orderId, escrow);

  console.log('[ESCROW] Funds refunded:', {
    orderId,
    amount: escrow.amount,
    transactionId: `refund_${Date.now()}`,
  });

  return {
    success: true,
    transactionId: `refund_${Date.now()}`,
  };
}

/**
 * Get escrow state for an order
 */
export function getEscrowState(orderId: string): EscrowState | undefined {
  return escrowStates.get(orderId);
}

/**
 * Calculate platform fee
 * PKR 50 for orders under PKR 2,000
 * PKR 100 for orders PKR 2,000 and above
 */
export function calculatePlatformFee(totalAmount: number): number {
  return totalAmount < 2000 ? 50 : 100;
}

/**
 * Calculate seller payout after 10% commission
 */
export function calculateSellerPayout(amount: number): number {
  return amount * 0.9;
}
