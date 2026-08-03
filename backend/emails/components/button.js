module.exports = (text, url, color = "#6A11CB") => {

    return `

    <div style="text-align:center;margin:35px 0;">

        <a
            href="${url}"
            style="
                background:${color};
                color:#ffffff;
                padding:14px 34px;
                border-radius:8px;
                text-decoration:none;
                display:inline-block;
                font-size:16px;
                font-weight:bold;
                font-family:Arial,sans-serif;
            "
        >

            ${text}

        </a>

    </div>

    `;

};