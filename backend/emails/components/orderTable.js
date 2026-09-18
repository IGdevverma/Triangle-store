module.exports = (items = []) => {

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


    const getImage = (item) => {

        if (
            typeof item.image === "string" &&
            item.image.trim()
        ) {
            return item.image.trim();
        }

        if (
            Array.isArray(item.images) &&
            typeof item.images[0] === "string" &&
            item.images[0].trim()
        ) {
            return item.images[0].trim();
        }

        return "";
    };


    const getPackLabel = (item) => {

        if (
            item.selectedPack &&
            item.selectedPack !== "single"
        ) {

            if (item.packQuantity) {
                return `${item.packQuantity}-Pack`;
            }

            return String(item.selectedPack);
        }

        if (item.packType === 3) {
            return "3-Pack";
        }

        return "";
    };


    const rows = items.map((item) => {

        const name =
            escapeHtml(item.name || "Product");

        const image =
            getImage(item);

        const quantity =
            Number(item.quantity || 1);

        const price =
            Number(
                item.price ??
                item.packPrice ??
                0
            );

        const subtotal =
            price * quantity;

        const size =
            item.selectedSize ||
            item.size ||
            "";

        const color =
            item.selectedColor ||
            item.color ||
            "";

        const pack =
            getPackLabel(item);


        const details = [];

        if (size) {
            details.push(
                `Size: ${escapeHtml(size)}`
            );
        }

        if (color) {
            details.push(
                `Color: ${escapeHtml(color)}`
            );
        }

        if (pack) {
            details.push(
                `Pack: ${escapeHtml(pack)}`
            );
        }


        return `

        <tr>

            <!-- PRODUCT -->

            <td style="
                padding:18px 12px;
                border-bottom:1px solid #eeeeee;
                vertical-align:middle;
            ">

                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                >

                    <tr>

                        ${
                            image
                                ? `
                        <td
                            width="76"
                            valign="middle"
                            style="
                                padding-right:14px;
                            "
                        >

                            <img
                                src="${escapeHtml(image)}"
                                alt="${name}"
                                width="64"
                                height="64"
                                style="
                                    display:block;
                                    width:64px;
                                    height:64px;
                                    object-fit:cover;
                                    border-radius:8px;
                                    border:1px solid #eeeeee;
                                    background:#f7f7f7;
                                "
                            >

                        </td>
                        `
                                : ""
                        }


                        <td valign="middle">

                            <div style="
                                font-family:Arial,Helvetica,sans-serif;
                                font-size:14px;
                                line-height:1.4;
                                font-weight:700;
                                color:#151827;
                            ">
                                ${name}
                            </div>


                            ${
                                details.length
                                    ? `
                            <div style="
                                margin-top:6px;
                                font-family:Arial,Helvetica,sans-serif;
                                font-size:12px;
                                line-height:1.6;
                                color:#777777;
                            ">
                                ${details.join(" &nbsp;•&nbsp; ")}
                            </div>
                            `
                                    : ""
                            }

                        </td>

                    </tr>

                </table>

            </td>


            <!-- QTY -->

            <td
                width="55"
                align="center"
                style="
                    padding:18px 6px;
                    border-bottom:1px solid #eeeeee;
                    vertical-align:middle;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:13px;
                    color:#555555;
                "
            >

                ${quantity}

            </td>


            <!-- PRICE -->

            <td
                width="90"
                align="right"
                style="
                    padding:18px 8px;
                    border-bottom:1px solid #eeeeee;
                    vertical-align:middle;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:13px;
                    color:#555555;
                "
            >

                ₹${formatPrice(price)}

            </td>


            <!-- SUBTOTAL -->

            <td
                width="100"
                align="right"
                style="
                    padding:18px 12px 18px 6px;
                    border-bottom:1px solid #eeeeee;
                    vertical-align:middle;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:14px;
                    font-weight:700;
                    color:#151827;
                "
            >

                ₹${formatPrice(subtotal)}

            </td>

        </tr>

        `;

    }).join("");


    return `

    <!-- ==========================================
         ORDER ITEMS TABLE
    =========================================== -->

    <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
            width:100%;
            border-collapse:collapse;
            font-family:Arial,Helvetica,sans-serif;
        "
    >

        <!-- HEADER -->

        <thead>

            <tr>

                <th
                    align="left"
                    style="
                        padding:14px 12px;
                        background:#111111;
                        color:#ffffff;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:.7px;
                        text-transform:uppercase;
                    "
                >
                    Product
                </th>


                <th
                    width="55"
                    align="center"
                    style="
                        padding:14px 6px;
                        background:#111111;
                        color:#ffffff;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:.7px;
                        text-transform:uppercase;
                    "
                >
                    Qty
                </th>


                <th
                    width="90"
                    align="right"
                    style="
                        padding:14px 8px;
                        background:#111111;
                        color:#ffffff;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:.7px;
                        text-transform:uppercase;
                    "
                >
                    Price
                </th>


                <th
                    width="100"
                    align="right"
                    style="
                        padding:14px 12px 14px 6px;
                        background:#111111;
                        color:#ffffff;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:.7px;
                        text-transform:uppercase;
                    "
                >
                    Total
                </th>

            </tr>

        </thead>


        <!-- PRODUCTS -->

        <tbody>

            ${rows}

        </tbody>

    </table>

    `;

};