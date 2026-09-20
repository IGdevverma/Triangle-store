import { CartItem } from '../services/cart';

// ==========================================
// ORDER STATUS
// ==========================================

export type OrderStatus =
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

// ==========================================
// PAYMENT STATUS
// ==========================================

export type PaymentStatus =
  | 'Pending'
  | 'Paid'
  | 'Failed'
  | 'Refunded';

// ==========================================
// REFUND STATUS
// ==========================================

export type RefundStatus =
  | 'Not Applicable'
  | 'Pending'
  | 'Processing'
  | 'Completed'
  | 'Refunded'
  | 'Failed';

// ==========================================
// PAYMENT METHOD
// ==========================================

export type PaymentMethod =
  | 'UPI'
  | 'CARD'
  | 'NETBANKING'
  | 'WALLET';

// ==========================================
// ORDER INTERFACE
// ==========================================

export interface Order {

  // ==========================================
  // IDENTIFIERS
  // ==========================================

  id?: string;

  _id?: string;

  user?: string;


  // ==========================================
  // CUSTOMER DETAILS
  // ==========================================

  customerName: string;

  email: string;

  phone: string;


  // ==========================================
  // DELIVERY ADDRESS
  // ==========================================

  address: string;

  city: string;

  state: string;

  pincode: string;


  // ==========================================
  // PAYMENT
  // ==========================================

  paymentMethod: PaymentMethod | string;

  paymentStatus: PaymentStatus;

  razorpayOrderId?: string | null;

  razorpayPaymentId?: string | null;

  paymentVerifiedAt?: string | null;


  // ==========================================
  // ORDER STATUS
  // ==========================================

  orderStatus: OrderStatus;


  // ==========================================
  // CANCELLATION
  // ==========================================

  cancelledAt?: string | null;

  cancellationReason?: string | null;


  // ==========================================
  // REFUND
  // ==========================================

  refundStatus?: RefundStatus | null;

  refundAmount?: number | null;

  razorpayRefundId?: string | null;

  refundInitiatedAt?: string | null;

  refundedAt?: string | null;

  refundFailureReason?: string | null;


  // ==========================================
  // ORDER ITEMS
  // ==========================================

  items: CartItem[];


  // ==========================================
  // TOTAL
  // ==========================================

  subtotal?: number;
  discountAmount?: number;
  shipping?: number;
  gst?: number;
  total: number;
  couponCode?: string;


  // ==========================================
  // DATES
  // ==========================================

  date?: string;

  createdAt?: string;

  updatedAt?: string;


  // ==========================================
  // LEGACY / UI STATUS
  // ==========================================

  status?: string;


  // ==========================================
  // SHIPROCKET
  // ==========================================

  shiprocketOrderId?: string | null;
  shiprocketShipmentId?: string | null;
  shiprocketAwbCode?: string | null;
  shiprocketCourierName?: string | null;
  shiprocketStatus?: string | null;
  shiprocketTrackingUrl?: string | null;
  shiprocketCreatedAt?: string | null;

  // ==========================================
  // TRACKING HISTORY
  // ==========================================

  trackingHistory?: {

    status: string;

    date: string;

  }[];

}