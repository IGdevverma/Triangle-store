module.exports = (order) => {
     console.log("✅ orderPlaced.js CALLED");


    const products = order.items.map(item => `
        <tr>
            <td style="padding:8px;border:1px solid #ddd;">${item.name}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right;">₹${item.price}</td>
        </tr>
    `).join("");

    return `
    <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:30px;">

        <div style="max-width:700px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">

            <div style="background:#6a0dad;color:white;padding:25px;text-align:center;">
                <h1 style="margin:0;">Triangle Sports</h1>
                <p style="margin-top:8px;">Order Confirmation</p>
            </div>

            <div style="padding:30px;">

                <h2>Hello ${order.customerName}, 👋</h2>

                <p>
                    Thank you for shopping with <b>Triangle Sports</b>.
                    Your order has been placed successfully.
                </p>

                <hr>

                <p><b>Order ID:</b> ${order._id}</p>
                <p><b>Status:</b> ${order.orderStatus}</p>
                <p><b>Payment:</b> ${order.paymentMethod}</p>

                <h3>Ordered Items</h3>

                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#eee;">
                            <th style="padding:10px;border:1px solid #ddd;">Product</th>
                            <th style="padding:10px;border:1px solid #ddd;">Qty</th>
                            <th style="padding:10px;border:1px solid #ddd;">Price</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${products}
                    </tbody>
                </table>

                <h2 style="text-align:right;margin-top:20px;">
                    Total : ₹${order.total}
                </h2>

                <hr>

                <p>
                    We'll notify you when your order is packed and shipped.
                </p>

                <p>
                    Thank you for choosing Triangle Sports ❤️
                </p>

            </div>

        </div>

    </div>
    `;

};