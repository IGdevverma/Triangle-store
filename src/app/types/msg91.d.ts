export {};

declare global {

  interface Window {

    initSendOTP: (
      configuration: any
    ) => void;

    sendOtp: (
      identifier: string,
      success?: (data: any) => void,
      failure?: (error: any) => void
    ) => void;

    verifyOtp: (
      otp: string | number,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string
    ) => void;

    retryOtp: (
      channel: string | null,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string
    ) => void;

    getWidgetData: () => any;
  }

}