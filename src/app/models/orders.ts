import { CartItem } from '../services/cart';

export interface Order {

  id?: string;
  _id?: string;

  customerName: string;

  email: string;

  phone: string;

  address: string;

  city: string;

  state: string;

  pincode: string;

  paymentMethod: string;

  paymentStatus: 'Pending' | 'Paid' | 'Failed';

  orderStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

  items: CartItem[];

  total: number;

  date: string;

  status?: string;

  createdAt?: string;

  updatedAt?: string;

}