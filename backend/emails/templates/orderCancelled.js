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

    const cancellationReason =
        order?.cancellationReason || "";

    const refundStatus =
        order?.refundStatus || "Not Applicable";

    const refundAmount =
        Number(order?.refundAmount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

    const hasRefund =
        order?.paymentStatus === "Paid" ||
        order?.paymentStatus === "Refunded" ||
        Number(order?.refundAmount || 0) > 0;

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
        Order Cancelled | Triangle Sports
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

        ${header("Your Order Has Been Cancelled")}


        <!-- MAIN CONTENT -->

        <div style="
            padding:42px 35px;
        ">


            <!-- STATUS -->

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
                    background:#f3f3f3;
                    color:#555555;
                    font-size:28px;
                    font-weight:700;
                ">
                    ×
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
                Your order has been cancelled
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
                your Triangle Sports order has been cancelled
                successfully.
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
                            color:#555555;
                            font-size:13px;
                            font-weight:700;
                        ">
                            Cancelled
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


            ${
                cancellationReason
                    ? `

            <!-- CANCELLATION REASON -->

            <div style="
                margin:28px 0;
                padding:22px;
                background:#fafafa;
                border:1px solid #e5e5e5;
                border-radius:10px;
            ">

                <div style="
                    margin-bottom:9px;
                    color:#737783;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:1px;
                    text-transform:uppercase;
                ">
                    Cancellation Reason
                </div>

                <div style="
                    color:#333333;
                    font-size:14px;
                    line-height:22px;
                ">
                    ${cancellationReason}
                </div>

            </div>

            `
                    : ""
            }


            ${
                hasRefund
                    ? `

            <!-- REFUND INFORMATION -->

            <div style="
                margin:28px 0;
                padding:24px;
                background:#fafafa;
                border:1px solid #e5e5e5;
                border-radius:10px;
            ">

                <div style="
                    margin-bottom:18px;
                    color:#151827;
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:1px;
                    text-transform:uppercase;
                ">
                    Refund Information
                </div>


                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                >

                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#737783;
                            font-size:13px;
                        ">
                            Refund Amount
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            color:#151827;
                            font-size:14px;
                            font-weight:700;
                        ">
                            ₹${refundAmount}
                        </td>

                    </tr>


                    <tr>

                        <td style="
                            padding:7px 0;
                            color:#737783;
                            font-size:13px;
                        ">
                            Refund Status
                        </td>

                        <td align="right" style="
                            padding:7px 0;
                            color:#6A11CB;
                            font-size:13px;
                            font-weight:700;
                        ">
                            ${refundStatus}
                        </td>

                    </tr>

                </table>


                ${
                    refundStatus === "Pending"
                        ? `
                <p style="
                    margin:16px 0 0;
                    color:#777777;
                    font-size:12px;
                    line-height:20px;
                ">
                    Your refund has been initiated and is being
                    processed. We'll update you when the refund
                    is completed.
                </p>
                `
                        : ""
                }


                ${
                    refundStatus === "Processing"
                        ? `
                <p style="
                    margin:16px 0 0;
                    color:#777777;
                    font-size:12px;
                    line-height:20px;
                ">
                    Your refund is currently being processed.
                </p>
                `
                        : ""
                }


                ${
                    refundStatus === "Completed"
                        ? `
                <p style="
                    margin:16px 0 0;
                    color:#16803c;
                    font-size:12px;
                    line-height:20px;
                ">
                    Your refund has been completed successfully.
                </p>
                `
                        : ""
                }

            </div>

            `
                    : ""
            }


            <!-- CTA -->

            ${button(
                "View Order",
                trackingUrl,
                "#111111"
            )}


            <!-- SUPPORT -->

            <p style="
                margin:25px 0 0;
                text-align:center;
                color:#777777;
                font-size:13px;
                line-height:21px;
            ">
                If you have any questions about your cancellation
                or refund, please contact our support team.
            </p>


        </div>


        <!-- FOOTER -->

        ${footer()}


    </div>

</body>

</html>

    `;

};