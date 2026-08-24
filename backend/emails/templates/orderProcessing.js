const header = require("../components/header");
const footer = require("../components/footer");
const button = require("../components/button");

module.exports = (order) => {

    const orderId = order?._id
        ? order._id.toString()
        : "N/A";

    const customerName =
        order?.customerName || "Customer";

    const total =
        Number(order?.total || 0).toLocaleString("en-IN");

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
        Order Processing - Triangle Sports
    </title>

</head>


<body style="
    margin:0;
    padding:0;
    background:#f5f5f7;
    font-family:Arial,Helvetica,sans-serif;
    color:#1e1e2f;
">


    <!-- ============================= -->
    <!-- EMAIL WRAPPER -->
    <!-- ============================= -->

    <div style="
        max-width:680px;
        margin:0 auto;
        background:#ffffff;
    ">


        <!-- ============================= -->
        <!-- HEADER -->
        <!-- ============================= -->

        ${header("Your Order Is Being Processed")}


        <!-- ============================= -->
        <!-- MAIN CONTENT -->
        <!-- ============================= -->

        <div style="
            padding:45px 35px;
        ">


            <!-- STATUS ICON -->

            <div style="
                text-align:center;
                margin-bottom:25px;
            ">

                <div style="
                    width:72px;
                    height:72px;
                    line-height:72px;
                    margin:0 auto;
                    border-radius:50%;
                    background:#f3e8ff;
                    color:#6A11CB;
                    font-size:34px;
                    font-weight:bold;
                ">

                    ⚙

                </div>

            </div>


            <!-- TITLE -->

            <h2 style="
                margin:0;
                text-align:center;
                font-size:28px;
                line-height:36px;
                color:#1e1e2f;
            ">

                Your order is being processed

            </h2>


            <!-- GREETING -->

            <p style="
                margin:25px 0 10px;
                font-size:16px;
                line-height:26px;
            ">

                Hi
                <strong>
                    ${customerName}
                </strong>,

            </p>


            <p style="
                margin:0 0 25px;
                color:#666666;
                font-size:15px;
                line-height:25px;
            ">

                Great news! We've received your order and
                our team has started preparing it.

                We'll keep you updated as your order moves
                through each stage.

            </p>


            <!-- ============================= -->
            <!-- ORDER INFORMATION -->
            <!-- ============================= -->

            <div style="
                background:#fafafa;
                border:1px solid #e8e8ed;
                border-radius:12px;
                padding:22px;
                margin:25px 0;
            ">


                <div style="
                    margin-bottom:18px;
                ">

                    <p style="
                        margin:0 0 6px;
                        color:#888888;
                        font-size:12px;
                        font-weight:bold;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                    ">

                        Order ID

                    </p>

                    <p style="
                        margin:0;
                        color:#6A11CB;
                        font-size:17px;
                        font-weight:bold;
                        word-break:break-all;
                    ">

                        #${orderId}

                    </p>

                </div>


                <div>

                    <p style="
                        margin:0 0 6px;
                        color:#888888;
                        font-size:12px;
                        font-weight:bold;
                        text-transform:uppercase;
                        letter-spacing:.8px;
                    ">

                        Order Total

                    </p>

                    <p style="
                        margin:0;
                        color:#1e1e2f;
                        font-size:20px;
                        font-weight:bold;
                    ">

                        ₹${total}

                    </p>

                </div>

            </div>


            <!-- ============================= -->
            <!-- ORDER JOURNEY -->
            <!-- ============================= -->

            <div style="
                margin:30px 0;
                padding:22px;
                background:#f9f7ff;
                border-radius:12px;
                border:1px solid #eee7ff;
            ">

                <p style="
                    margin:0 0 18px;
                    color:#6A11CB;
                    font-size:12px;
                    font-weight:bold;
                    text-transform:uppercase;
                    letter-spacing:1px;
                ">

                    Order Journey

                </p>


                <div style="
                    font-size:14px;
                    line-height:30px;
                ">

                    <div>
                        <strong style="color:#6A11CB;">
                            ✓
                        </strong>
                        Order Placed
                    </div>

                    <div>
                        <strong style="color:#6A11CB;">
                            ⚙
                        </strong>
                        <strong>
                            Processing
                        </strong>
                    </div>

                    <div style="color:#999999;">
                        ○ Packed
                    </div>

                    <div style="color:#999999;">
                        ○ Shipped
                    </div>

                    <div style="color:#999999;">
                        ○ Delivered
                    </div>

                </div>

            </div>


            <!-- ============================= -->
            <!-- CTA -->
            <!-- ============================= -->

            ${button(
                "View My Orders",
                "http://localhost:4200/orders",
                "#6A11CB"
            )}


            <!-- ============================= -->
            <!-- NOTE -->
            <!-- ============================= -->

            <p style="
                margin:30px 0 0;
                text-align:center;
                color:#888888;
                font-size:13px;
                line-height:22px;
            ">

                We'll send you another email when your
                order has been packed and shipped.

            </p>


        </div>


        <!-- ============================= -->
        <!-- FOOTER -->
        <!-- ============================= -->

        ${footer()}


    </div>


</body>

</html>

    `;

};