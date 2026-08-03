import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { loadingInterceptor } from './interceptors/loading-interceptor';



export const appConfig: ApplicationConfig = {

  providers: [

    provideBrowserGlobalErrorListeners(),

    provideZoneChangeDetection({

      eventCoalescing: true

    }),

    provideRouter(

      routes,

      withInMemoryScrolling({

        scrollPositionRestoration: 'top',

        anchorScrolling: 'enabled'

      })

    ),

    provideHttpClient(
      withInterceptors([
        loadingInterceptor,
        authInterceptor
      ])
    ),

    provideAnimations(),
    importProvidersFrom(
      NgxSpinnerModule.forRoot()
    ),

    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 3000,
      closeButton: true,
      progressBar: true,
      preventDuplicates: true
    })

  ]



};
