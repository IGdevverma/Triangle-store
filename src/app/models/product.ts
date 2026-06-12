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

}