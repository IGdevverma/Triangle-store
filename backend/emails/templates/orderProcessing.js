const header = require("../components/header");
const footer = require("../components/footer");
const button = require("../components/button");

module.exports = (order) => {

    const customerName =
        order?.customerName || "Customer";

    const orderId = order?._id
        ? `TS-${order._id.toString().slice(-8).toUpperCase()}`
        : "TS-N/A";

    const total =
        Number(order?.total || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

    const trackingUrl =
        `https://www.trianglesports.in/track/${order?._id || ""}`;

    return `

<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Order Processing | Triangle Sports
    </title>

</head>


<body style="
    margin:0;
    padding:0;
    background:#f3f3f3;
    font-family:Arial,Helvetica,sans-serif;
    color:#151827;
">


    <!-- EMAIL CONTAINER -->

    <div style="
        max-width:700px;
        margin:0 auto;
        background:#ffffff;
    ">


        <!-- HEADER -->

        ${header("Your Order Is Being Processed")}


        <!-- MAIN CONTENT -->

        <div style="
            padding:42px 35px;
        ">


            <!-- STATUS ICON -->

            <div style="
                text-align:center;
                margin-bottom:22px;
            ">

                <div style="
                    width:68px;
                    height:68px;
                    line-height:68px;
                    margin:0 auto;
                    border-radius:50%;
                    background:#f1e8ff;
                    color:#6A11CB;
                    font-size:30px;
                    font-weight:700;
                ">
                    ✓
                </div>

            </div>


            <!-- TITLE -->

            <h1 style="
                margin:0;
                text-align:center;
                color:#151827;
                font-size:28px;
                line-height:36px;
                font-weight:700;
            ">
                Your order is being processed
            </h1>


            <!-- INTRO -->

            <p style="
                margin:20px auto 0;
                max-width:540px;
                text-align:center;
                color:#666666;
                font-size:15px;
                line-height:24px;
            ">
                Hi
                <strong style="color:#151827;">
                    ${customerName}
                </strong>,
                we've started preparing your order.
                We'll keep you updated as it moves through
                each stage.
            </p>


            <!-- ORDER SUMMARY -->

            <div style="
                margin:30px 0;
                padding:24px;
                background:#fafafa;
                border:1px solid #e5e5e5;
                border-radius:10px;
            ">

                <div style="
                    margin-bottom:20px;
                    text-align:center;
                    color:#737783;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:1px;
                    text-transform:uppercase;
                ">
                    Order Summary
                </div>


                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                >

                    <tr>

                        <td style="
                            padding:8px 0;
                            color:#737783;
                            font-size:13px;
                        ">
                            Order ID
                        </td>

                        <td align="right" style="
                            padding:8px 0;
                            color:#151827;
                            font-size:13px;
                            font-weight:700;
                        ">
                            #${orderId}
                        </td>

                    </tr>


                    <tr>

                        <td style="
                            padding:8px 0;
                            color:#737783;
                            font-size:13px;
                        ">
                            Status
                        </td>

                        <td align="right" style="
                            padding:8px 0;
                            color:#6A11CB;
                            font-size:13px;
                            font-weight:700;
                        ">
                            Processing
                        </td>

                    </tr>


                    <tr>

                        <td style="
                            padding:8px 0;
                            color:#737783;
                            font-size:13px;
                        ">
                            Order Total
                        </td>

                        <td align="right" style="
                            padding:8px 0;
                            color:#151827;
                            font-size:16px;
                            font-weight:700;
                        ">
                            ₹${total}
                        </td>

                    </tr>

                </table>

            </div>


            <!-- ORDER JOURNEY -->

            <div style="
                margin:28px 0;
                padding:24px;
                border:1px solid #e5e5e5;
                border-radius:10px;
                background:#ffffff;
            ">

                <div style="
                    margin-bottom:20px;
                    color:#151827;
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:1px;
                    text-transform:uppercase;
                ">
                    Your Order Journey
                </div>


                <!-- STEP 1 -->

                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                >

                    <tr>

                        <td
                            width="34"
                            valign="top"
                        >

                            <div style="
                                width:24px;
                                height:24px;
                                line-height:24px;
                                border-radius:50%;
                                background:#111111;
                                color:#ffffff;
                                text-align:center;
                                font-size:12px;
                                font-weight:700;
                            ">
                                ✓
                            </div>

                        </td>

                        <td valign="top">

                            <div style="
                                color:#151827;
                                font-size:14px;
                                font-weight:700;
                            ">
                                Order Placed
                            </div>

                            <div style="
                                margin-top:3px;
                                color:#888888;
                                font-size:12px;
                            ">
                                Your order has been confirmed.
                            </div>

                        </td>

                    </tr>


                    <tr>

                        <td
                            width="34"
                            valign="top"
                            style="
                                padding-top:12px;
                            "
                        >

                            <div style="
                                width:24px;
                                height:24px;
                                line-height:24px;
                                border-radius:50%;
                                background:#6A11CB;
                                color:#ffffff;
                                text-align:center;
                                font-size:12px;
                                font-weight:700;
                            ">
                                2
                            </div>

                        </td>

                        <td
                            valign="top"
                            style="
                                padding-top:12px;
                            "
                        >

                            <div style="
                                color:#151827;
                                font-size:14px;
                                font-weight:700;
                            ">
                                Processing
                            </div>

                            <div style="
                                margin-top:3px;
                                color:#6A11CB;
                                font-size:12px;
                            ">
                                Your order is being prepared.
                            </div>

                        </td>

                    </tr>


                    <tr>

                        <td
                            width="34"
                            valign="top"
                            style="
                                padding-top:12px;
                            "
                        >

                            <div style="
                                width:24px;
                                height:24px;
                                line-height:24px;
                                border-radius:50%;
                                background:#eeeeee;
                                color:#999999;
                                text-align:center;
                                font-size:12px;
                            ">
                                3
                            </div>

                        </td>

                        <td
                            valign="top"
                            style="
                                padding-top:12px;
                            "
                        >

                            <div style="
                                color:#999999;
                                font-size:14px;
                            ">
                                Packed
                            </div>

                        </td>

                    </tr>


                    <tr>

                        <td
                            width="34"
                            valign="top"
                            style="
                                padding-top:12px;
                            "
                        >

                            <div style="
                                width:24px;
                                height:24px;
                                line-height:24px;
                                border-radius:50%;
                                background:#eeeeee;
                                color:#999999;
                                text-align:center;
                                font-size:12px;
                            ">
                                4
                            </div>

                        </td>

                        <td
                            valign="top"
                            style="
                                padding-top:12px;
                            "
                        >

                            <div style="
                                color:#999999;
                                font-size:14px;
                            ">
                                Shipped
                            </div>

                        </td>

                    </tr>


                    <tr>

                        <td
                            width="34"
                            valign="top"
                            style="
                                padding-top:12px;
                            "
                        >

                            <div style="
                                width:24px;
                                height:24px;
                                line-height:24px;
                                border-radius:50%;
                                background:#eeeeee;
                                color:#999999;
                                text-align:center;
                                font-size:12px;
                            ">
                                5
                            </div>

                        </td>

                        <td
                            valign="top"
                            style="
                                padding-top:12px;
                            "
                        >

                            <div style="
                                color:#999999;
                                font-size:14px;
                            ">
                                Delivered
                            </div>

                        </td>

                    </tr>

                </table>

            </div>


            <!-- CTA -->

            ${button(
                "Track Your Order",
                trackingUrl,
                "#111111"
            )}


            <!-- NOTE -->

            <p style="
                margin:25px 0 0;
                text-align:center;
                color:#888888;
                font-size:12px;
                line-height:20px;
            ">
                We'll email you again when your order
                is packed and shipped.
            </p>


        </div>


        <!-- FOOTER -->

        ${footer()}


    </div>

</body>

</html>

    `;

};