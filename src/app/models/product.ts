export interface Product {
  id?: string;
  _id?: string;

  name: string;
  price: number;
  image: string;
  images?: string[];
  availableColors?: string;
  category: string;
  status?: string;
  description?: string;
  fabric?: string;
  type?: string;
  brand?: string;
  stock?: number;
  showOnHome?: boolean;
  discount?: number;
  quantity?: number;
  selectedSize?: string;
  sizes?: string[];
  sku?: string;
  colors?: string[];
  tags?: string[];
  taxText?: string;
}