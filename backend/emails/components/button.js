module.exports = (
    text,
    url,
    color = "#111111"
) => {

    return `

    <!-- ==========================================
         PREMIUM EMAIL CTA
    =========================================== -->

    <div style="
        text-align:center;
        margin:34px 0;
    ">

        <a
            href="${url}"
            target="_blank"
            style="
                display:inline-block;
                background:${color};
                color:#ffffff;
                padding:15px 34px;
                border-radius:6px;
                text-decoration:none;
                font-family:Arial,Helvetica,sans-serif;
                font-size:13px;
                font-weight:700;
                letter-spacing:.8px;
                text-transform:uppercase;
                line-height:1;
                border:1px solid ${color};
                box-sizing:border-box;
            "
        >
            ${text}
        </a>

    </div>

    `;

};