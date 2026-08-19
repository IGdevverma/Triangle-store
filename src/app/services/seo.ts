import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
    providedIn: 'root'
})
export class SeoService {

    constructor(
        private title: Title,
        private meta: Meta
    ) { }

    updateSeo(
        pageTitle: string,
        description: string,
        keywords: string = '',
        image: string = '',
        url: string = window.location.href
    ) {

        this.title.setTitle(pageTitle);

        this.meta.updateTag({
            name: 'description',
            content: description
        });

        this.meta.updateTag({
            name: 'keywords',
            content: keywords
        });

        this.meta.updateTag({
            property: 'og:title',
            content: pageTitle
        });

        this.meta.updateTag({
            property: 'og:description',
            content: description
        });

        this.meta.updateTag({
            name: 'twitter:title',
            content: pageTitle
        });

        this.meta.updateTag({
            name: 'twitter:description',
            content: description
        });


        let link: HTMLLinkElement | null =
            document.querySelector("link[rel='canonical']");

        if (!link) {

            link = document.createElement('link');

            link.setAttribute('rel', 'canonical');

            document.head.appendChild(link);

        }

        link.setAttribute('href', url);



        this.meta.updateTag({

            property: 'og:url',

            content: url

        });


        if (image) {

            this.meta.updateTag({

                property: 'og:image',

                content: image

            });

            this.meta.updateTag({

                name: 'twitter:image',

                content: image

            });

        }
    }


}