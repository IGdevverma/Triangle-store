module.exports = (items = []) => {

    const rows = items.map(item => `

        <tr>

            <td style="
                padding:12px;
                border:1px solid #e5e5e5;
            ">
                ${item.name}
            </td>

            <td style="
                padding:12px;
                border:1px solid #e5e5e5;
                text-align:center;
            ">
                ${item.quantity}
            </td>

            <td style="
                padding:12px;
                border:1px solid #e5e5e5;
                text-align:right;
            ">
                ₹${item.price}
            </td>

            <td style="
                padding:12px;
                border:1px solid #e5e5e5;
                text-align:right;
            ">
                ₹${item.price * item.quantity}
            </td>

        </tr>

    `).join("");

    return `

        <table style="
            width:100%;
            border-collapse:collapse;
            margin-top:20px;
            font-family:Arial,sans-serif;
        ">

            <thead>

                <tr style="background:#6A11CB;color:white;">

                    <th style="padding:14px;">Product</th>

                    <th style="padding:14px;">Qty</th>

                    <th style="padding:14px;">Price</th>

                    <th style="padding:14px;">Subtotal</th>

                </tr>

            </thead>

            <tbody>

                ${rows}

            </tbody>

        </table>

    `;

};