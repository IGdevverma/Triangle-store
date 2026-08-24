import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OtpService {

  constructor() {}

  sendOtp(
    mobile: string,
    success?: (data: any) => void,
    failure?: (error: any) => void
  ): void {

    if (!mobile) {
      failure?.({
        message: 'Mobile number is required'
      });
      return;
    }

    if (typeof window.sendOtp !== 'function') {

      console.error(
        'MSG91 sendOtp function is not available'
      );

      failure?.({
        message:
          'MSG91 OTP widget is not initialized'
      });

      return;
    }

    window.sendOtp(
      mobile,
      (data) => {

        console.log(
          'FULL MSG91 SEND RESPONSE:',
          data
        );

        success?.(data);

      },
      (error) => {

        console.error(
          'FULL MSG91 SEND ERROR:',
          error
        );

        failure?.(error);

      }
    );
  }


  verifyOtp(
    otp: string,
    success?: (data: any) => void,
    failure?: (error: any) => void
  ): void {

    if (typeof window.verifyOtp !== 'function') {

      failure?.({
        message:
          'MSG91 verifyOtp function is not available'
      });

      return;
    }

    window.verifyOtp(
      otp,

      (data) => {

        console.log(
          'FULL MSG91 VERIFY RESPONSE:',
          data
        );

        success?.(data);

      },

      (error) => {

        console.error(
          'FULL MSG91 VERIFY ERROR:',
          error
        );

        failure?.(error);

      }
    );
  }


  retryOtp(
    channel: string | null = null,
    success?: (data: any) => void,
    failure?: (error: any) => void
  ): void {

    if (typeof window.retryOtp !== 'function') {

      failure?.({
        message:
          'MSG91 retryOtp function is not available'
      });

      return;
    }

    window.retryOtp(
      channel,

      (data) => {

        console.log(
          'FULL MSG91 RETRY RESPONSE:',
          data
        );

        success?.(data);

      },

      (error) => {

        console.error(
          'FULL MSG91 RETRY ERROR:',
          error
        );

        failure?.(error);

      }
    );
  }

}