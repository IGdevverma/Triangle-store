import { CartItem } from '../services/cart';

export interface Order {

  id: number;

  items: CartItem[];

  total: number;

  date: string;

}