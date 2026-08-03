const header = require("../components/header");
const footer = require("../components/footer");
const orderTable = require("../components/orderTable");
const button = require("../components/button");
module.exports = (order) => {

    return `

    <div style="
        background:#f5f5f5;
        padding:40px 20px;
        font-family:Arial,sans-serif;
    ">

        <div style="
            max-width:700px;
            margin:auto;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 5px 20px rgba(0,0,0,.08);
        ">

            ${header("🎉 Order Confirmed")}

            <div style="padding:35px;">

                <h2 style="margin-top:0;">
                    Hello ${order.customerName}, 👋
                </h2>

                <p style="font-size:16px;color:#555;line-height:1.8;">
                    Thank you for shopping with
                    <strong>Triangle Sports</strong>.
                    Your order has been placed successfully.
                </p>

                <hr style="
                    border:none;
                    border-top:1px solid #eeeeee;
                    margin:25px 0;
                ">

                <table style="
                    width:100%;
                    font-size:15px;
                    margin-bottom:25px;
                ">

                    <tr>
                        <td><strong>Order ID</strong></td>
                        <td>${order._id}</td>
                    </tr>

                    <tr>
                        <td><strong>Status</strong></td>
                        <td>${order.orderStatus}</td>
                    </tr>

                    <tr>
                        <td><strong>Payment</strong></td>
                        <td>${order.paymentMethod}</td>
                    </tr>

                </table>

                <h3 style="
                    margin-bottom:15px;
                    color:#6A11CB;
                ">
                    Ordered Items
                </h3>

                ${orderTable(order.items)}

                <div style="
                    text-align:right;
                    margin-top:25px;
                    font-size:22px;
                    font-weight:bold;
                    color:#6A11CB;
                ">
                    Total : ₹${order.total}
                </div>

                <hr style="
                    border:none;
                    border-top:1px solid #eeeeee;
                    margin:30px 0;
                ">

                <p style="
                    color:#555;
                    line-height:1.8;
                ">
                    We have received your order successfully.
                    Our team will start processing it shortly.
                </p>

                <p style="
                    color:#555;
                    line-height:1.8;
                ">
                    You'll receive another email as soon as your
                    order is packed and shipped.
                </p>

                <p style="
                    margin-top:25px;
                    font-weight:bold;
                    color:#6A11CB;
                ">
                    Thank you for choosing Triangle Sports ❤️
                </p>
            

                ${button(
        "Track Your Order",
        `https://trianglesports.com/track/${order._id}`
    )}
            </div>

            ${footer()}

        </div>

    </div>

    `;

};