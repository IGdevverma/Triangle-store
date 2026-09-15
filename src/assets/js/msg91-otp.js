var configuration = {
  widgetId: "366874664d57383734313131",
  tokenAuth: "562456T0RXrgQVXSg06a86a3f1P1",
  exposeMethods: true,

  success: function (data) {
    console.log("MSG91 SUCCESS:", data);
  },

  failure: function (error) {
    console.error("MSG91 FAILURE:", error);
  }
};

function loadOtpScript(urls) {
  let i = 0;

  function attempt() {
    const script = document.createElement("script");

    script.src = urls[i];
    script.async = true;

    script.onload = function () {
      if (typeof window.initSendOTP === "function") {
        window.initSendOTP(configuration);
      } else {
        console.error("MSG91 initSendOTP is not available");
      }
    };

    script.onerror = function () {
      i++;

      if (i < urls.length) {
        attempt();
      }
    };

    document.head.appendChild(script);
  }

  attempt();
}

loadOtpScript([
  "https://verify.msg91.com/otp-provider.js",
  "https://verify.phone91.com/otp-provider.js"
]);