module.exports = () => {

    const year = new Date().getFullYear();

    return `

    <div style="
        background:#1E1E2F;
        color:#ffffff;
        padding:35px;
        text-align:center;
        font-family:Arial,sans-serif;
    ">

        <h3 style="margin:0;color:#ffffff;">
            Triangle Sports
        </h3>

        <p style="margin:12px 0;">
            Premium Sportswear For Champions
        </p>

        <hr style="
            border:none;
            border-top:1px solid rgba(255,255,255,.2);
            margin:25px 0;
        ">

        <p style="margin:8px 0;">
            📞 +91 9990180409
        </p>

        <p style="margin:8px 0;">
            ✉ support@trianglesports.com
        </p>

        <p style="margin:8px 0;">
            🌐 www.trianglesports.com
        </p>

        <div style="margin:25px 0;font-size:22px;">
            📷 &nbsp; 👍 &nbsp; 💼 &nbsp; ▶️
        </div>

        <p style="
            color:#cccccc;
            font-size:13px;
            margin-top:25px;
        ">
            © ${year} Triangle Sports. All Rights Reserved.
        </p>

    </div>

    `;

};