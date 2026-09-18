const orderTable = require("../components/orderTable");
const button = require("../components/button");
const header = require("../components/header");
module.exports = (order) => {

    const escapeHtml = (value) => {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const formatPrice = (value) => {
        const amount = Number(value || 0);

        return amount.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };

    const orderId =
        order?._id
            ? String(order._id).slice(-8).toUpperCase()
            : "N/A";

    const customerName =
        escapeHtml(order?.customerName || "Customer");

    const customerEmail =
        escapeHtml(order?.email || "N/A");

    const customerPhone =
        escapeHtml(order?.phone || "N/A");

    const paymentMethod =
        escapeHtml(order?.paymentMethod || "N/A");

    const paymentStatus =
        escapeHtml(order?.paymentStatus || "N/A");

    const orderStatus =
        escapeHtml(order?.orderStatus || "Processing");

    const total =
        formatPrice(order?.total);


    return `

    <div style="
        margin:0;
        padding:40px 20px;
        background:#f3f3f3;
        font-family:Arial,Helvetica,sans-serif;
    ">

        <div style="
            max-width:700px;
            margin:0 auto;
            background:#ffffff;
            border-radius:10px;
            overflow:hidden;
        ">


          ${header("New Order Received")}


            <!-- CONTENT -->

            <div style="
                padding:35px;
            ">


                <div style="
                    font-size:24px;
                    font-weight:700;
                    color:#151827;
                    margin-bottom:10px;
                ">
                    New Order Received
                </div>


                <div style="
                    font-size:14px;
                    line-height:1.7;
                    color:#666666;
                    margin-bottom:28px;
                ">
                    A new order has been successfully placed on
                    <strong style="color:#151827;">
                        Triangle Sports
                    </strong>.
                </div>


                <!-- ORDER INFORMATION -->

                <div style="
                    border:1px solid #e5e5e5;
                    border-radius:8px;
                    padding:22px;
                    margin-bottom:25px;
                ">

                    <div style="
                        text-align:center;
                        color:#777777;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:1px;
                        text-transform:uppercase;
                        margin-bottom:18px;
                    ">
                        Order Information
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
                                color:#777777;
                                font-size:13px;
                            ">
                                Order ID
                            </td>

                            <td align="right" style="
                                padding:7px 0;
                                color:#151827;
                                font-size:13px;
                                font-weight:700;
                            ">
                                #TS-${orderId}
                            </td>

                        </tr>


                        <tr>

                            <td style="
                                padding:7px 0;
                                color:#777777;
                                font-size:13px;
                            ">
                                Order Status
                            </td>

                            <td align="right" style="
                                padding:7px 0;
                                color:#6A11CB;
                                font-size:13px;
                                font-weight:700;
                            ">
                                ${orderStatus}
                            </td>

                        </tr>


                        <tr>

                            <td style="
                                padding:7px 0;
                                color:#777777;
                                font-size:13px;
                            ">
                                Payment Method
                            </td>

                            <td align="right" style="
                                padding:7px 0;
                                color:#151827;
                                font-size:13px;
                                font-weight:700;
                            ">
                                ${paymentMethod}
                            </td>

                        </tr>


                        <tr>

                            <td style="
                                padding:7px 0;
                                color:#777777;
                                font-size:13px;
                            ">
                                Payment Status
                            </td>

                            <td align="right" style="
                                padding:7px 0;
                                color:#16803c;
                                font-size:13px;
                                font-weight:700;
                            ">
                                ${paymentStatus}
                            </td>

                        </tr>


                        <tr>

                            <td style="
                                padding:7px 0;
                                color:#777777;
                                font-size:13px;
                            ">
                                Order Total
                            </td>

                            <td align="right" style="
                                padding:7px 0;
                                color:#151827;
                                font-size:15px;
                                font-weight:700;
                            ">
                                ₹${total}
                            </td>

                        </tr>

                    </table>

                </div>


                <!-- CUSTOMER -->

                <div style="
                    border:1px solid #e5e5e5;
                    border-radius:8px;
                    padding:22px;
                    margin-bottom:28px;
                ">

                    <div style="
                        color:#777777;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:1px;
                        text-transform:uppercase;
                        margin-bottom:15px;
                    ">
                        Customer Details
                    </div>


                    <div style="
                        color:#151827;
                        font-size:14px;
                        font-weight:700;
                        margin-bottom:7px;
                    ">
                        ${customerName}
                    </div>


                    <div style="
                        color:#666666;
                        font-size:13px;
                        line-height:1.8;
                    ">
                        ${customerEmail}<br>
                        ${customerPhone}
                    </div>

                </div>


                <!-- ITEMS -->

                <div style="
                    color:#777777;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:1px;
                    text-transform:uppercase;
                    margin-bottom:12px;
                ">
                    Ordered Items
                </div>


                ${orderTable(order?.items || [])}


                <!-- ADMIN ACTION -->

                ${button(
                    "VIEW ORDER",
                    `https://www.trianglesports.in/track/${order?._id}`,
                    "#111111"
                )}


                <div style="
                    margin-top:10px;
                    text-align:center;
                    color:#888888;
                    font-size:12px;
                    line-height:1.6;
                ">
                    Please review this order in the admin panel
                    and process it accordingly.
                </div>

            </div>


            <!-- FOOTER -->

            <div style="
                background:#111111;
                padding:22px;
                text-align:center;
                color:#777777;
                font-family:Arial,Helvetica,sans-serif;
                font-size:11px;
            ">

                <div style="
                    color:#ffffff;
                    font-weight:700;
                    letter-spacing:1px;
                    margin-bottom:7px;
                ">
                    TRIANGLE SPORTS
                </div>

                New order notification

            </div>

        </div>

    </div>

    `;
};