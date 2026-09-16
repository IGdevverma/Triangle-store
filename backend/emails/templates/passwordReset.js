const passwordReset = (resetUrl) => {

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>

<body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial,sans-serif;">

    <div style="max-width:600px; margin:40px auto; background:#ffffff; padding:40px 30px;">

        <h2 style="margin-top:0; color:#111111;">
            Reset Your Password
        </h2>

        <p style="color:#555555; line-height:1.6;">
            We received a request to reset your Triangle Sports account password.
        </p>

        <p style="color:#555555; line-height:1.6;">
            Click the button below to create a new password.
        </p>

        <div style="margin:30px 0;">
            <a
                href="${resetUrl}"
                style="
                    display:inline-block;
                    padding:14px 24px;
                    background:#111111;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold;
                "
            >
                Reset Password
            </a>
        </div>

        <p style="color:#777777; font-size:14px; line-height:1.6;">
            This password reset link will expire in 15 minutes.
        </p>

        <p style="color:#777777; font-size:14px; line-height:1.6;">
            If you did not request a password reset, you can safely ignore this email.
        </p>

        <hr style="border:none; border-top:1px solid #eeeeee; margin:30px 0;">

        <p style="color:#999999; font-size:12px;">
            Triangle Sports
        </p>

    </div>

</body>
</html>
    `;
};

module.exports = passwordReset;