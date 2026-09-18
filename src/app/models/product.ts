// =====================================================
// PRODUCT COLOR
// =====================================================

export interface ProductColor {

  // Display name
  // Example: Black, Navy, Grey
  name: string;

  // Color value
  // Example: #000000
  value: string;

  // Optional image specifically for this color
  image?: string;

}


// =====================================================
// PRODUCT PACK
// =====================================================

// =====================================================
// PRODUCT PACK
// =====================================================

export interface ProductPack {

  // Unique pack ID
  // Example: single, pack-3
  id: string;

  // Display name
  // Example: Single Vest, Pack of 3
  name: string;

  // Number of physical products in this pack
  quantity: number;

  // Selling price of this pack
  price: number;

  // MRP / original price
  originalPrice?: number;

  // Discount percentage
  discount?: number;

  // Main image of this pack
  image?: string;

  // Additional images of this pack
  images?: string[];

  // Colors available for this pack
  colors?: string[];

  // Sizes available for this pack
  sizes?: string[];
}


// =====================================================
// COLOR COMBINATION
// =====================================================

export interface ColorCombination {

  // Unique combination ID
  // Example: combo-1
  id: string;

  // Display name
  // Example: Blue + Grey + White
  name: string;

  // Actual colors inside the combination
  // Example: ['Blue', 'Grey', 'White']
  colors: string[];

  // Optional images for this combination
  images?: string[];

}


// =====================================================
// PRODUCT
// =====================================================

export interface Product {

  // ===================================================
  // IDENTIFICATION
  // ===================================================

  id?: string;

  _id?: string;


  // ===================================================
  // BASIC INFORMATION
  // ===================================================

  name: string;


  fit?: string;
  careInstructions?: string;
  description?: string;

  category: string;

  type?: string;

  brand?: string;

  fabric?: string;

  sku?: string;
  productMode?: 'single' | 'pack';
  // Product family / colour variant group
  // Example:
  // "premium-fitted-tank"
  //
  // Black, White and Grey variants
  // of the same product will use
  // the same productGroup.

  productGroup?: string;

  tags?: string[];


  // ===================================================
  // PRICING
  // ===================================================

  price: number;

  originalPrice?: number;

  discount?: number;

  taxText?: string;


  // ===================================================
  // IMAGES
  // ===================================================

  // Main product image
  image: string;

  // Additional product images
  images?: string[];


  // ===================================================
  // INVENTORY
  // ===================================================

  stock: number;


  // ===================================================
  // AVAILABLE SIZES
  // ===================================================

  // Example:
  // ['S', 'M', 'L', 'XL', 'XXL']
  sizes?: string[];


  // ===================================================
  // AVAILABLE COLORS
  // ===================================================

  // Simple color list
  // Example:
  // ['Black', 'White', 'Navy']
  colors?: string[];

  // Legacy compatibility
  availableColors?: string;


  // ===================================================
  // DETAILED COLOR OPTIONS
  // ===================================================

  // Use this when every color needs its own image
  colorsData?: ProductColor[];


  // ===================================================
  // PACK OPTIONS
  // ===================================================

  // Example:
  //
  // [
  //   {
  //     id: 'single',
  //     name: '1 Piece',
  //     quantity: 1,
  //     price: 499
  //   },
  //
  //   {
  //     id: 'pack-3',
  //     name: '3 Pack',
  //     quantity: 3,
  //     price: 1199
  //   }
  // ]
  packs?: ProductPack[];


  // ===================================================
  // 3-PACK COLOR COMBINATIONS
  // ===================================================

  // Example:
  //
  // Blue + Grey + White
  //
  // Brown + White + Navy
  //
  // Black + Grey + Navy
  colorCombinations?: ColorCombination[];


  // ===================================================
  // PRODUCT STATUS
  // ===================================================

  status?: 'Active' | 'Draft' | 'Hidden';


  // ===================================================
  // HOME PAGE SETTINGS
  // ===================================================

  showOnHome?: boolean;


  // ===================================================
  // CART / ORDER COMPATIBILITY
  // ===================================================

  quantity?: number;

  selectedSize?: string;

  selectedColor?: string;

  selectedPack?: string;

  selectedCombination?: string;


  // ===================================================
  // OPTIONAL VARIANT INFORMATION
  // ===================================================

  // Useful when later you want a complete
  // variant-based clothing system.
  //
  // Example:
  // Black + M + Single
  variantId?: string;

}