import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {

  const token = localStorage.getItem('token');

  // Public APIs
  if (
    request.url.includes('/auth/login') ||
    request.url.includes('/auth/register')
  ) {
    return next(request);
  }

  if (!token) {
    return next(request);
  }

  const authRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authRequest);
};