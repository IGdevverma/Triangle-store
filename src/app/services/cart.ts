import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  Product,
  ProductPack
} from '../models/product';


// =====================================================
// CART ITEM
// =====================================================

export interface CartItem extends Product {

  /**
   * Number of selected packs.
   *
   * Example:
   * 1 x 3 Pack
   * 2 x 3 Pack
   */
  quantity: number;


  /**
   * Selected product size.
   *
   * Example:
   * M, L, XL
   */
  selectedSize?: string;


  /**
   * Selected single color.
   *
   * Used for 1 Piece / single-color products.
   */
  selectedColor?: string;


  /**
   * Selected pack.
   *
   * Example:
   * single
   * pack-3
   */
  selectedPack?: string;


  /**
   * Selected color combination.
   *
   * Example:
   * Blue + Grey + White
   */
  selectedCombination?: string;


  /**
   * Actual selling price of ONE selected pack.
   *
   * Example:
   *
   * 1 Piece = ₹499
   * 3 Pack  = ₹1299
   */
  cartPrice: number;


  /**
   * Number of physical products inside ONE pack.
   *
   * Example:
   *
   * 1 Piece = 1
   * 3 Pack  = 3
   */
  packQuantity: number;


  /**
   * Unique identifier for the exact variant.
   *
   * Product + Pack + Size + Color + Combination
   */
  cartItemKey: string;

}


// =====================================================
// CART SERVICE
// =====================================================

@Injectable({
  providedIn: 'root'
})
export class CartService {

  // =====================================================
  // CART STATE
  // =====================================================

  private cartItems: CartItem[] = [];


  private readonly cartSubject =
    new BehaviorSubject<CartItem[]>([]);


  readonly cart$ =
    this.cartSubject.asObservable();


  // =====================================================
  // BUY NOW
  // =====================================================

  private buyNowItem: CartItem | null = null;


  // =====================================================
  // STORAGE KEY
  // =====================================================

  private readonly CART_STORAGE_KEY = 'cart';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor() {

    this.loadCart();

  }


  // =====================================================
  // GET PRODUCT ID
  // =====================================================

  private getProductId(
    product: Product
  ): string {

    return String(
      product._id ||
      product.id ||
      ''
    ).trim();

  }


  // =====================================================
  // CREATE CART ITEM KEY
  // =====================================================

  /**
   * Generates a unique key for the exact product variant.
   *
   * Example:
   *
   * product123|single|M|Black|
   *
   * product123|pack-3|M||combo-1
   *
   * Therefore different variants never merge.
   */

  private createCartItemKey(
    product: Product,
    selectedSize?: string,
    selectedColor?: string,
    selectedPack?: string,
    selectedCombination?: string
  ): string {

    const productId =
      this.getProductId(product);


    const pack =
      selectedPack?.trim() || 'single';


    const size =
      selectedSize?.trim() || '';


    const color =
      selectedColor?.trim() || '';


    const combination =
      selectedCombination?.trim() || '';


    return [
      productId,
      pack,
      size,
      color,
      combination
    ].join('|');

  }


  // =====================================================
  // FIND SELECTED PACK
  // =====================================================

  private getSelectedPack(
    product: Product,
    selectedPack?: string
  ): ProductPack | undefined {

    if (
      !selectedPack ||
      !product.packs?.length
    ) {

      return undefined;

    }


    return product.packs.find(
      pack =>
        pack.id === selectedPack
    );

  }


  // =====================================================
  // GET PACK QUANTITY
  // =====================================================

  private getPackQuantity(
    product: Product,
    selectedPack?: string
  ): number {

    const pack =
      this.getSelectedPack(
        product,
        selectedPack
      );


    const quantity =
      Number(
        pack?.quantity ?? 1
      );


    return quantity > 0
      ? Math.floor(quantity)
      : 1;

  }


  // =====================================================
  // GET PACK PRICE
  // =====================================================

  private getPackPrice(
    product: Product,
    selectedPack?: string
  ): number {

    const pack =
      this.getSelectedPack(
        product,
        selectedPack
      );


    return Number(
      pack?.price ??
      product.price ??
      0
    );

  }


  // =====================================================
  // GET MAXIMUM PACK QUANTITY
  // =====================================================

  /**
   * Stock represents INDIVIDUAL physical products.
   *
   * Example:
   *
   * stock = 10
   *
   * 1 Piece:
   * 10 packs available
   *
   * 3 Pack:
   * floor(10 / 3) = 3 packs available
   */

  private getMaxPackQuantity(
    product: Product,
    selectedPack?: string
  ): number {

    const stock =
      Number(
        product.stock ?? 0
      );


    const packQuantity =
      this.getPackQuantity(
        product,
        selectedPack
      );


    if (
      stock <= 0 ||
      packQuantity <= 0
    ) {

      return 0;

    }


    return Math.floor(
      stock / packQuantity
    );

  }


  // =====================================================
  // LOAD CART
  // =====================================================

  private loadCart(): void {

    const savedCart =
      localStorage.getItem(
        this.CART_STORAGE_KEY
      );


    if (!savedCart) {

      this.publishCart();

      return;

    }


    try {

      const parsedCart =
        JSON.parse(savedCart);


      if (!Array.isArray(parsedCart)) {

        this.clearStoredCart();

        return;

      }


      this.cartItems =
        parsedCart
          .filter(
            item =>
              item &&
              typeof item === 'object'
          )
          .map(
            item => {

              const quantity =
                Number(
                  item.quantity
                );


              const packQuantity =
                Number(
                  item.packQuantity
                );


              const cartPrice =
                Number(
                  item.cartPrice ??
                  item.price ??
                  0
                );


              const normalizedPackQuantity =
                packQuantity > 0
                  ? Math.floor(packQuantity)
                  : 1;


              const normalizedQuantity =
                quantity > 0
                  ? Math.floor(quantity)
                  : 1;


              const cartItemKey =
                item.cartItemKey ||
                this.createCartItemKey(
                  item,
                  item.selectedSize,
                  item.selectedColor,
                  item.selectedPack,
                  item.selectedCombination
                );


              return {

                ...item,

                quantity:
                  normalizedQuantity,

                packQuantity:
                  normalizedPackQuantity,

                cartPrice,

                cartItemKey

              } as CartItem;

            }
          );


      this.publishCart();

    }

    catch (error) {

      console.error(
        'Unable to load cart:',
        error
      );

      this.clearStoredCart();

    }

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(
    product: Product,
    quantity: number = 1,
    selectedSize?: string,
    selectedColor?: string,
    selectedPack?: string,
    selectedCombination?: string
  ): void {

    // ---------------------------------------------------
    // PRODUCT ID
    // ---------------------------------------------------

    const productId =
      this.getProductId(product);


    if (!productId) {

      console.error(
        'Cannot add product without ID:',
        product
      );

      return;

    }


    // ---------------------------------------------------
    // STOCK
    // ---------------------------------------------------

    const stock =
      Number(
        product.stock ?? 0
      );


    if (stock <= 0) {

      console.warn(
        'Product is out of stock.'
      );

      return;

    }


    // ---------------------------------------------------
    // NORMALIZE QUANTITY
    // ---------------------------------------------------

    quantity =
      Math.floor(
        Number(quantity)
      );


    if (quantity < 1) {

      quantity = 1;

    }


    // ---------------------------------------------------
    // PACK QUANTITY
    // ---------------------------------------------------

    const packQuantity =
      this.getPackQuantity(
        product,
        selectedPack
      );


    // ---------------------------------------------------
    // MAX AVAILABLE PACKS
    // ---------------------------------------------------

    const maxPackQuantity =
      this.getMaxPackQuantity(
        product,
        selectedPack
      );


    if (maxPackQuantity <= 0) {

      console.warn(
        'Selected pack is unavailable.'
      );

      return;

    }


    if (
      quantity >
      maxPackQuantity
    ) {

      quantity =
        maxPackQuantity;

    }


    // ---------------------------------------------------
    // CART PRICE
    // ---------------------------------------------------

    const cartPrice =
      this.getPackPrice(
        product,
        selectedPack
      );


    // ---------------------------------------------------
    // UNIQUE CART KEY
    // ---------------------------------------------------

    const cartItemKey =
      this.createCartItemKey(

        product,

        selectedSize,

        selectedColor,

        selectedPack,

        selectedCombination

      );


    // ---------------------------------------------------
    // FIND EXISTING VARIANT
    // ---------------------------------------------------

    const existingItem =
      this.cartItems.find(
        item =>
          item.cartItemKey ===
          cartItemKey
      );


    // ===================================================
    // EXISTING ITEM
    // ===================================================

    if (existingItem) {

      const requestedQuantity =
        existingItem.quantity +
        quantity;


      const maxQuantity =
        this.getMaxPackQuantity(
          product,
          selectedPack
        );


      existingItem.quantity =
        Math.min(
          requestedQuantity,
          maxQuantity
        );


      // Keep latest product pricing
      existingItem.cartPrice =
        cartPrice;


      existingItem.packQuantity =
        packQuantity;

    }


    // ===================================================
    // NEW ITEM
    // ===================================================

    else {

      const newItem: CartItem = {

        ...product,

        quantity,

        selectedSize,

        selectedColor,

        selectedPack,

        selectedCombination,

        cartPrice,

        packQuantity,

        cartItemKey

      };


      this.cartItems.push(
        newItem
      );

    }


    // ---------------------------------------------------
    // SAVE
    // ---------------------------------------------------

    this.saveCart();

  }


  // =====================================================
  // FIND CART ITEM
  // =====================================================

  private findCartItem(
    item: CartItem
  ): CartItem | undefined {

    return this.cartItems.find(
      cartItem =>
        cartItem.cartItemKey ===
        item.cartItemKey
    );

  }


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increaseQuantity(
    item: CartItem
  ): void {

    const cartItem =
      this.findCartItem(item);


    if (!cartItem) {

      console.warn(
        'Cart item not found:',
        item
      );

      return;

    }


    // ---------------------------------------------------
    // MAX PACKS AVAILABLE
    // ---------------------------------------------------

    const maxQuantity =
      this.getMaxPackQuantity(
        cartItem,
        cartItem.selectedPack
      );


    if (
      cartItem.quantity >=
      maxQuantity
    ) {

      return;

    }


    cartItem.quantity++;


    this.saveCart();

  }


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity(
    item: CartItem
  ): void {

    const cartItem =
      this.findCartItem(item);


    if (!cartItem) {

      return;

    }


    if (
      cartItem.quantity > 1
    ) {

      cartItem.quantity--;

      this.saveCart();

      return;

    }


    // Quantity is 1
    // Remove item

    this.removeFromCart(
      cartItem
    );

  }


  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  removeFromCart(
    item: CartItem
  ): void {

    this.cartItems =
      this.cartItems.filter(
        cartItem =>
          cartItem.cartItemKey !==
          item.cartItemKey
      );


    this.saveCart();

  }


  // =====================================================
  // GET CART ITEMS
  // =====================================================

  getCartItems(): CartItem[] {

    return [
      ...this.cartItems
    ];

  }


  // =====================================================
  // GET TOTAL PACKS / CART QUANTITY
  // =====================================================

  getTotalItems(): number {

    return this.cartItems.reduce(

      (
        total,
        item
      ) => {

        return total +
          Number(
            item.quantity || 0
          );

      },

      0

    );

  }


  // =====================================================
  // GET TOTAL PHYSICAL PRODUCTS
  // =====================================================

  /**
   * Example:
   *
   * 1 x Single = 1
   *
   * 2 x 3 Pack = 6
   *
   * 1 x 3 Pack + 2 x Single = 5
   */

  getTotalProductUnits(): number {

    return this.cartItems.reduce(

      (
        total,
        item
      ) => {

        return total +

          (
            Number(
              item.quantity || 0
            )

            *

            Number(
              item.packQuantity || 1
            )
          );

      },

      0

    );

  }


  // =====================================================
  // GET TOTAL
  // =====================================================

  getTotal(): number {

    return this.cartItems.reduce(

      (
        total,
        item
      ) => {

        const price =
          Number(
            item.cartPrice ??
            item.price ??
            0
          );


        const quantity =
          Number(
            item.quantity || 0
          );


        return total +
          (
            price *
            quantity
          );

      },

      0

    );

  }


  // =====================================================
  // CLEAR CART
  // =====================================================

  clearCart(): void {

    this.cartItems = [];

    this.buyNowItem = null;


    localStorage.removeItem(
      this.CART_STORAGE_KEY
    );


    this.publishCart();

  }


  // =====================================================
  // BUY NOW
  // =====================================================

  setBuyNowItem(
    product: Product,
    quantity: number = 1,
    selectedSize?: string,
    selectedColor?: string,
    selectedPack?: string,
    selectedCombination?: string
  ): void {

    // ---------------------------------------------------
    // PRODUCT ID
    // ---------------------------------------------------

    const productId =
      this.getProductId(product);


    if (!productId) {

      console.error(
        'Cannot create Buy Now item without ID.'
      );

      return;

    }


    // ---------------------------------------------------
    // MAX QUANTITY
    // ---------------------------------------------------

    const maxQuantity =
      this.getMaxPackQuantity(
        product,
        selectedPack
      );


    if (maxQuantity <= 0) {

      this.buyNowItem = null;

      return;

    }


    // ---------------------------------------------------
    // NORMALIZE QUANTITY
    // ---------------------------------------------------

    quantity =
      Math.floor(
        Number(quantity)
      );


    quantity =
      Math.max(
        1,
        Math.min(
          quantity,
          maxQuantity
        )
      );


    // ---------------------------------------------------
    // PACK QUANTITY
    // ---------------------------------------------------

    const packQuantity =
      this.getPackQuantity(
        product,
        selectedPack
      );


    // ---------------------------------------------------
    // CART PRICE
    // ---------------------------------------------------

    const cartPrice =
      this.getPackPrice(
        product,
        selectedPack
      );


    // ---------------------------------------------------
    // CART KEY
    // ---------------------------------------------------

    const cartItemKey =
      this.createCartItemKey(

        product,

        selectedSize,

        selectedColor,

        selectedPack,

        selectedCombination

      );


    // ---------------------------------------------------
    // BUY NOW ITEM
    // ---------------------------------------------------

    this.buyNowItem = {

      ...product,

      quantity,

      selectedSize,

      selectedColor,

      selectedPack,

      selectedCombination,

      cartPrice,

      packQuantity,

      cartItemKey

    };

  }


  // =====================================================
  // GET BUY NOW
  // =====================================================

  getBuyNowItem(): CartItem | null {

    return this.buyNowItem;

  }


  // =====================================================
  // CLEAR BUY NOW
  // =====================================================

  clearBuyNow(): void {

    this.buyNowItem = null;

  }


  // =====================================================
  // SAVE CART
  // =====================================================

  private saveCart(): void {

    localStorage.setItem(

      this.CART_STORAGE_KEY,

      JSON.stringify(
        this.cartItems
      )

    );


    this.publishCart();

  }


  // =====================================================
  // PUBLISH CART
  // =====================================================

  private publishCart(): void {

    this.cartSubject.next([
      ...this.cartItems
    ]);

  }


  // =====================================================
  // CLEAR INVALID STORAGE
  // =====================================================

  private clearStoredCart(): void {

    this.cartItems = [];

    localStorage.removeItem(
      this.CART_STORAGE_KEY
    );

    this.publishCart();

  }

}