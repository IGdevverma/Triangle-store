import { Injectable } from '@angular/core';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductSchemaService {

  private readonly siteUrl =
    'https://www.trianglesports.in';

  private readonly siteName =
    'Triangle Sports';

  constructor() {}

  updateProductSchema(
    product: Product,
    productUrl: string
  ): void {

    if (!product) {
      return;
    }

    // Remove previous product schema
    const existingSchema =
      document.getElementById(
        'triangle-product-schema'
      );

    if (existingSchema) {
      existingSchema.remove();
    }

    const productName =
      product.name?.trim() ||
      'Sportswear Product';

    const description =
      product.description?.trim() ||
      `Shop ${productName} from Triangle Sports.`;

    const image =
      product.image ||
      product.images?.[0] ||
      '';

    const schema: any = {

      '@context': 'https://schema.org',

      '@type': 'Product',

      name: productName,

      description: description,

      url: productUrl,

      brand: {
        '@type': 'Brand',
        name:
          product.brand?.trim() ||
          this.siteName
      },

      image: image
        ? [image]
        : [],

      category:
        product.category || undefined,

      sku:
        product.sku || undefined,

      offers: {
        '@type': 'Offer',

        url: productUrl,

        priceCurrency: 'INR',

        price: Number(product.price || 0),

        availability:
          Number(product.stock || 0) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',

        itemCondition:
          'https://schema.org/NewCondition',

        seller: {
          '@type': 'Organization',
          name: this.siteName
        }
      }
    };

    // Remove undefined values
    Object.keys(schema).forEach(key => {
      if (
        schema[key] === undefined ||
        schema[key] === ''
      ) {
        delete schema[key];
      }
    });

    if (
      schema.brand &&
      !schema.brand.name
    ) {
      delete schema.brand;
    }

    if (
      schema.offers &&
      !schema.offers.price
    ) {
      delete schema.offers;
    }

    const script =
      document.createElement('script');

    script.id =
      'triangle-product-schema';

    script.type =
      'application/ld+json';

    script.text =
      JSON.stringify(schema);

    document.head.appendChild(script);
  }
}