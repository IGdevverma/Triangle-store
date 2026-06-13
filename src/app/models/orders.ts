import { CartItem } from '../services/cart';

export interface Order {

  id: string;

  items: CartItem[];

  total: number;

  date: string;
  status?: string;

}