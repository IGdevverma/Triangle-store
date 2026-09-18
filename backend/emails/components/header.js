module.exports = (title = "Triangle Sports") => {

    const logoUrl =
        "https://res.cloudinary.com/kgphuyoj/image/upload/trianglepng_b5zaun.png";

    return `

    <!-- ==========================================
         TRIANGLE SPORTS EMAIL HEADER
    =========================================== -->

    <div style="
        background:#111111;
        padding:30px 20px 26px;
        text-align:center;
        font-family:Arial,Helvetica,sans-serif;
    ">

        <!-- LOGO -->

        <img
            src="${logoUrl}"
            alt="Triangle Sports"
            width="150"
            style="
                display:block;
                width:150px;
                max-width:150px;
                height:auto;
                margin:0 auto 20px;
                border:0;
                outline:none;
                text-decoration:none;
            "
        >

        <!-- EMAIL TITLE -->

        <div style="
            color:#ffffff;
            font-size:12px;
            font-weight:700;
            letter-spacing:2px;
            text-transform:uppercase;
        ">
            ${title}
        </div>

    </div>

    `;

};