export interface Product {

  id: number;
  name: string;
  price: number;
  image: string;
  images?: string[]; 
  category: string;
  description?: string;
  fabric?: string;
  type?: string;
  stock?: boolean;
  showOnHome?: boolean; 
  quantity?: number;
  selectedSize?: string;
  sku?: string;
  colors?: string[];
  tags?: string[];
  taxText?: string;

  

}