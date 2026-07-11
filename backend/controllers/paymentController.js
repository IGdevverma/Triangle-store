const Razorpay = require("razorpay");
const crypto = require("crypto");
const razorpay = new Razorpay({

    key_id: process.env.RAZORPAY_KEY_ID,

    key_secret: process.env.RAZORPAY_KEY_SECRET

});

exports.createOrder = async (req, res) => {
      
    try {

        const { amount } = req.body;

        const options = {

            amount: amount * 100, // paise

            currency: "INR",

            receipt: `receipt_${Date.now()}`

        };

        const order = await razorpay.orders.create(options);
       

        res.status(200).json({

            success: true,

            order,

            key: process.env.RAZORPAY_KEY_ID

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
exports.verifyPayment = async (req, res) => {
       console.time("VERIFY");

    try {

        const {

            razorpay_order_id,

            razorpay_payment_id,

            razorpay_signature

        } = req.body;

        const body =
            razorpay_order_id + "|" + razorpay_payment_id;
         
        const expectedSignature = crypto
          
            .createHmac(

                "sha256",

                process.env.RAZORPAY_KEY_SECRET

            )

            .update(body.toString())

            .digest("hex");

        if (expectedSignature === razorpay_signature) {
           
            return res.status(200).json({

                success: true,

                message: "Payment Verified"

            });

        }
        
        return res.status(400).json({

            success: false,

            message: "Invalid Signature"

        });

    } catch (error) {
         
        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};
