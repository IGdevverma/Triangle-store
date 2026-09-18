module.exports = () => {

    const year = new Date().getFullYear();

    const logoUrl =
        "https://res.cloudinary.com/kgphuyoj/image/upload/trianglepng_b5zaun.png";

    return `

    <!-- ==========================================
         PREMIUM EMAIL FOOTER
    =========================================== -->

    <div style="
        background:#111111;
        padding:34px 24px;
        text-align:center;
        font-family:Arial,Helvetica,sans-serif;
    ">


        <!-- LOGO -->

        <img
            src="${logoUrl}"
            alt="Triangle Sports"
            width="110"
            style="
                display:block;
                width:110px;
                max-width:110px;
                height:auto;
                margin:0 auto 16px;
                border:0;
                outline:none;
                text-decoration:none;
            "
        >


        <!-- TAGLINE -->

        <div style="
            color:#a1a1aa;
            font-size:13px;
            line-height:1.6;
            margin-bottom:24px;
        ">
            Premium sportswear built for movement.
        </div>


        <!-- DIVIDER -->

        <div style="
            height:1px;
            background:#2d2d2d;
            margin:0 auto 22px;
            max-width:520px;
        "></div>


        <!-- SUPPORT -->

        <div style="
            color:#ffffff;
            font-size:13px;
            font-weight:600;
            margin-bottom:8px;
        ">
            Need help with your order?
        </div>


        <div style="
            color:#a1a1aa;
            font-size:13px;
            line-height:1.8;
        ">

            <a
                href="mailto:support@trianglesports.com"
                style="
                    color:#ffffff;
                    text-decoration:none;
                "
            >
                support@trianglesports.com
            </a>

            &nbsp;&nbsp;•&nbsp;&nbsp;

            <a
                href="tel:+919990180409"
                style="
                    color:#ffffff;
                    text-decoration:none;
                "
            >
                +91 9990180409
            </a>

        </div>


        <!-- WEBSITE -->

        <div style="
            margin-top:16px;
        ">

            <a
                href="https://www.trianglesports.in/"
                style="
                    color:#ffffff;
                    font-size:13px;
                    font-weight:600;
                    text-decoration:none;
                "
            >
                www.trianglesports.in
            </a>

        </div>


        <!-- NAVIGATION LINKS -->

        <div style="
            margin-top:25px;
            font-size:12px;
            line-height:2;
        ">

            <a
                href="https://www.trianglesports.in/"
                style="
                    color:#a1a1aa;
                    text-decoration:none;
                "
            >
                SHOP
            </a>

            &nbsp;&nbsp;&nbsp;

            <a
                href="https://www.trianglesports.in/"
                style="
                    color:#a1a1aa;
                    text-decoration:none;
                "
            >
                TRACK ORDER
            </a>

            &nbsp;&nbsp;&nbsp;

            <a
                href="mailto:support@trianglesports.com"
                style="
                    color:#a1a1aa;
                    text-decoration:none;
                "
            >
                SUPPORT
            </a>

        </div>


        <!-- DIVIDER -->

        <div style="
            height:1px;
            background:#2d2d2d;
            margin:24px auto 18px;
            max-width:520px;
        "></div>


        <!-- COPYRIGHT -->

        <div style="
            color:#71717a;
            font-size:11px;
            line-height:1.6;
        ">
            © ${year} Triangle Sports. All rights reserved.
        </div>


    </div>

    `;

};