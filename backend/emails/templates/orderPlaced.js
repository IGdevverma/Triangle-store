const header = require("../components/header");
const footer = require("../components/footer");
const orderTable = require("../components/orderTable");
const button = require("../components/button");

module.exports = (order) => {

    const customerName =
        order.customerName ||
        order.name ||
        "there";

    const orderId =
        String(order._id || "")
            .slice(-8)
            .toUpperCase();

    const paymentMethod =
        String(order.paymentMethod || "Online")
            .toUpperCase();

    const paymentStatus =
        String(order.paymentStatus || "Paid");

    const orderStatus =
        String(order.orderStatus || "Processing");

    const subtotal =
        Number(order.subtotal || 0);

    const discount =
        Number(order.discountAmount || 0);

    const shipping =
        Number(order.shipping || 0);

    const gst =
        Number(order.gst || 0);

    const total =
        Number(order.total || 0);

    return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>Order Confirmed | Triangle Sports</title>

</head>


<body style="
    margin:0;
    padding:0;
    background:#f4f4f6;
    font-family:Arial,Helvetica,sans-serif;
    color:#151827;
">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f4f4f6;"
>

<tr>

<td align="center">

<div style="
    width:100%;
    max-width:700px;
    margin:0 auto;
">

    <!-- ==========================================
         MAIN CONTAINER
    =========================================== -->

    <div style="
        background:#ffffff;
        margin:24px 12px;
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 4px 20px rgba(0,0,0,0.06);
    ">


        <!-- ======================================
             HEADER
        ======================================= -->

        ${header("ORDER CONFIRMED")}


        <!-- ======================================
             MAIN CONTENT
        ======================================= -->

        <div style="
            padding:36px 34px 40px;
        ">


            <!-- SUCCESS ICON -->

            <div style="
                text-align:center;
                margin-bottom:20px;
            ">

                <div style="
                    display:inline-block;
                    width:58px;
                    height:58px;
                    line-height:58px;
                    border-radius:50%;
                    background:#f0e7ff;
                    color:#6a11cb;
                    font-size:30px;
                    font-weight:bold;
                ">

                    ✓

                </div>

            </div>


            <!-- TITLE -->

            <h1 style="
                margin:0;
                text-align:center;
                font-size:30px;
                line-height:1.2;
                font-weight:700;
                color:#151827;
            ">

                Order Confirmed

            </h1>


            <p style="
                margin:12px auto 30px;
                max-width:520px;
                text-align:center;
                font-size:15px;
                line-height:1.7;
                color:#687086;
            ">

                Hi ${customerName}, thank you for choosing
                <strong style="color:#151827;">
                    Triangle Sports
                </strong>.
                We've received your order and we're getting it ready.

            </p>


            <!-- ======================================
                 ORDER SUMMARY
            ======================================= -->

            <div style="
                border:1px solid #e5e7eb;
                border-radius:12px;
                padding:22px;
                background:#fafafa;
                margin-bottom:30px;
            ">

                <div style="
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:1px;
                    color:#6b7280;
                    margin-bottom:18px;
                ">

                    ORDER SUMMARY

                </div>


                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="font-size:14px;"
                >

                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#687086;
                        ">
                            Order ID
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            font-weight:700;
                            color:#151827;
                        ">
                            #TS-${orderId}
                        </td>

                    </tr>


                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#687086;
                        ">
                            Order Status
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            font-weight:700;
                            color:#6a11cb;
                        ">
                            ${orderStatus}
                        </td>

                    </tr>


                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#687086;
                        ">
                            Payment Method
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            font-weight:700;
                            color:#151827;
                        ">
                            ${paymentMethod}
                        </td>

                    </tr>


                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#687086;
                        ">
                            Payment Status
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            font-weight:700;
                            color:#16803c;
                        ">
                            ${paymentStatus}
                        </td>

                    </tr>

                </table>

            </div>


            <!-- ======================================
                 ITEMS
            ======================================= -->

            <div style="
                font-size:12px;
                font-weight:700;
                letter-spacing:1px;
                color:#6b7280;
                margin-bottom:12px;
            ">

                YOUR ITEMS

            </div>


            ${orderTable(order.items)}


            <!-- ======================================
                 PAYMENT SUMMARY
            ======================================= -->

            <div style="
                margin-top:26px;
                border:1px solid #e5e7eb;
                border-radius:12px;
                padding:22px;
                background:#ffffff;
            ">

                <div style="
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:1px;
                    color:#6b7280;
                    margin-bottom:16px;
                ">

                    PAYMENT SUMMARY

                </div>


                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="font-size:14px;"
                >

                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#687086;
                        ">
                            Subtotal
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            color:#151827;
                        ">
                            ₹${subtotal.toLocaleString("en-IN")}
                        </td>

                    </tr>


                    ${
                        discount > 0
                            ? `
                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#16803c;
                        ">
                            Discount
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            color:#16803c;
                        ">
                            -₹${discount.toLocaleString("en-IN")}
                        </td>

                    </tr>
                    `
                            : ""
                    }


                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#687086;
                        ">
                            Shipping
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            color:#151827;
                        ">
                            ${
                                shipping > 0
                                    ? `₹${shipping.toLocaleString("en-IN")}`
                                    : "FREE"
                            }
                        </td>

                    </tr>


                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#687086;
                        ">
                            GST
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            color:#151827;
                        ">
                            ₹${gst.toLocaleString("en-IN")}
                        </td>

                    </tr>


                    <tr>

                        <td colspan="2"
                            style="
                                padding-top:16px;
                                border-top:1px solid #e5e7eb;
                            ">
                        </td>

                    </tr>


                    <tr>

                        <td style="
                            padding:4px 0;
                            font-size:18px;
                            font-weight:700;
                            color:#151827;
                        ">
                            Total Paid
                        </td>

                        <td align="right" style="
                            padding:4px 0;
                            font-size:22px;
                            font-weight:700;
                            color:#6a11cb;
                        ">
                            ₹${total.toLocaleString("en-IN")}
                        </td>

                    </tr>

                </table>

            </div>


            <!-- ======================================
                 CTA
            ======================================= -->

            <div style="
                text-align:center;
                margin:32px 0;
            ">

                ${button(
                    "Track Your Order",
                    `https://www.trianglesports.in/track/${order._id}`
                )}

            </div>


            <!-- ======================================
                 WHAT HAPPENS NEXT
            ======================================= -->

            <div style="
                background:#f7f2ff;
                border:1px solid #eadcff;
                border-radius:12px;
                padding:20px 22px;
                margin-top:10px;
            ">

                <div style="
                    font-size:15px;
                    font-weight:700;
                    color:#151827;
                    margin-bottom:8px;
                ">

                    What happens next?

                </div>


                <p style="
                    margin:0;
                    font-size:14px;
                    line-height:1.7;
                    color:#687086;
                ">

                    Our team will begin processing your order.
                    We'll keep you updated as your order moves through
                    packing, shipping and delivery.

                </p>

            </div>


            <!-- ======================================
                 THANK YOU
            ======================================= -->

            <p style="
                margin:30px 0 0;
                text-align:center;
                font-size:14px;
                line-height:1.7;
                color:#687086;
            ">

                Thank you for choosing
                <strong style="color:#151827;">
                    Triangle Sports
                </strong>.

                <br>

                <span style="
                    color:#6a11cb;
                    font-weight:600;
                ">
                    Train hard. Move better.
                </span>

            </p>


        </div>


        <!-- ======================================
             FOOTER
        ======================================= -->

        ${footer()}


    </div>

</div>

</td>

</tr>

</table>


</body>

</html>

    `;

};