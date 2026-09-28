import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  private readonly siteName = 'Triangle Sports';
  private readonly siteUrl = 'https://www.trianglesports.in';

  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  updateSeo(
    pageTitle: string,
    description: string,
    keywords: string = '',
    image: string = '',
    url: string = this.siteUrl
  ): void {

    const cleanTitle = this.cleanText(pageTitle);
    const cleanDescription = this.cleanText(description);
    const canonicalUrl = this.normalizeUrl(url);
    const imageUrl = image ? this.normalizeUrl(image) : '';

    // =====================================================
    // BASIC SEO
    // =====================================================

    this.title.setTitle(cleanTitle);

    this.updateMeta(
      'name',
      'description',
      cleanDescription
    );

    if (keywords.trim()) {
      this.updateMeta(
        'name',
        'keywords',
        this.cleanText(keywords)
      );
    }

    this.updateMeta(
      'name',
      'robots',
      'index, follow, max-image-preview:large'
    );


    // =====================================================
    // OPEN GRAPH
    // =====================================================

    this.updateMeta(
      'property',
      'og:type',
      'product'
    );

    this.updateMeta(
      'property',
      'og:title',
      cleanTitle
    );

    this.updateMeta(
      'property',
      'og:description',
      cleanDescription
    );

    this.updateMeta(
      'property',
      'og:url',
      canonicalUrl
    );

    this.updateMeta(
      'property',
      'og:site_name',
      this.siteName
    );

    if (imageUrl) {
      this.updateMeta(
        'property',
        'og:image',
        imageUrl
      );

      this.updateMeta(
        'property',
        'og:image:alt',
        cleanTitle
      );
    }


    // =====================================================
    // TWITTER / X
    // =====================================================

    this.updateMeta(
      'name',
      'twitter:card',
      'summary_large_image'
    );

    this.updateMeta(
      'name',
      'twitter:title',
      cleanTitle
    );

    this.updateMeta(
      'name',
      'twitter:description',
      cleanDescription
    );

    if (imageUrl) {
      this.updateMeta(
        'name',
        'twitter:image',
        imageUrl
      );

      this.updateMeta(
        'name',
        'twitter:image:alt',
        cleanTitle
      );
    }


    // =====================================================
    // CANONICAL URL
    // =====================================================

    this.updateCanonical(canonicalUrl);
  }


  // =====================================================
  // META TAG HELPER
  // =====================================================

  private updateMeta(
    attribute: 'name' | 'property',
    key: string,
    content: string
  ): void {

    this.meta.updateTag(
      {
        [attribute]: key,
        content
      },
      `${attribute}="${key}"`
    );
  }


  // =====================================================
  // CANONICAL HELPER
  // =====================================================

  private updateCanonical(url: string): void {

    let canonical =
      document.querySelector(
        'link[rel="canonical"]'
      ) as HTMLLinkElement | null;

    if (!canonical) {

      canonical =
        document.createElement('link');

      canonical.setAttribute(
        'rel',
        'canonical'
      );

      document.head.appendChild(canonical);
    }

    canonical.setAttribute(
      'href',
      url
    );
  }


  // =====================================================
  // URL NORMALIZATION
  // =====================================================

  private normalizeUrl(url: string): string {

    try {

      return new URL(
        url,
        this.siteUrl
      ).href;

    } catch {

      return this.siteUrl;
    }
  }


  // =====================================================
  // TEXT CLEANUP
  // =====================================================

  private cleanText(value: string): string {

    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
