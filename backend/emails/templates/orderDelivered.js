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
        Order Delivered | Triangle Sports
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

        ${header("Your Order Has Been Delivered")}


        <!-- MAIN CONTENT -->

        <div style="
            padding:42px 35px;
        ">


            <!-- SUCCESS ICON -->

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
                    background:#111111;
                    color:#ffffff;
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
                Your order has been delivered
            </h1>


            <!-- MESSAGE -->

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
                your Triangle Sports order has been
                delivered successfully.
            </p>


            <!-- THANK YOU -->

            <p style="
                margin:10px auto 0;
                max-width:540px;
                text-align:center;
                color:#777777;
                font-size:14px;
                line-height:23px;
            ">
                We hope you enjoy your new gear and
                get the most out of every move.
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
                            color:#16803c;
                            font-size:13px;
                            font-weight:700;
                        ">
                            Delivered
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
                    Order Journey
                </div>


                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                >

                    <!-- ORDER PLACED -->

                    <tr>

                        <td width="34" valign="top">

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

                        </td>

                    </tr>


                    <!-- PROCESSING -->

                    <tr>

                        <td
                            width="34"
                            valign="top"
                            style="padding-top:12px;"
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

                        <td
                            valign="top"
                            style="padding-top:12px;"
                        >

                            <div style="
                                color:#151827;
                                font-size:14px;
                                font-weight:700;
                            ">
                                Processing
                            </div>

                        </td>

                    </tr>


                    <!-- PACKED -->

                    <tr>

                        <td
                            width="34"
                            valign="top"
                            style="padding-top:12px;"
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

                        <td
                            valign="top"
                            style="padding-top:12px;"
                        >

                            <div style="
                                color:#151827;
                                font-size:14px;
                                font-weight:700;
                            ">
                                Packed
                            </div>

                        </td>

                    </tr>


                    <!-- SHIPPED -->

                    <tr>

                        <td
                            width="34"
                            valign="top"
                            style="padding-top:12px;"
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

                        <td
                            valign="top"
                            style="padding-top:12px;"
                        >

                            <div style="
                                color:#151827;
                                font-size:14px;
                                font-weight:700;
                            ">
                                Shipped
                            </div>

                        </td>

                    </tr>


                    <!-- DELIVERED -->

                    <tr>

                        <td
                            width="34"
                            valign="top"
                            style="padding-top:12px;"
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

                        <td
                            valign="top"
                            style="padding-top:12px;"
                        >

                            <div style="
                                color:#151827;
                                font-size:14px;
                                font-weight:700;
                            ">
                                Delivered
                            </div>

                            <div style="
                                margin-top:3px;
                                color:#16803c;
                                font-size:12px;
                            ">
                                Your order has arrived.
                            </div>

                        </td>

                    </tr>

                </table>

            </div>


            <!-- CTA -->

            ${button(
                "View Your Order",
                trackingUrl,
                "#111111"
            )}


            <!-- CLOSING -->

            <p style="
                margin:25px 0 0;
                text-align:center;
                color:#777777;
                font-size:13px;
                line-height:21px;
            ">
                Thank you for choosing Triangle Sports.
            </p>


        </div>


        <!-- FOOTER -->

        ${footer()}


    </div>

</body>

</html>

    `;

};