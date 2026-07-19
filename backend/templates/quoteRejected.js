module.exports = (quote) => {
    return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial;background:#f5f5f5;padding:30px">

<div style="max-width:650px;background:#fff;border-radius:12px;padding:30px;margin:auto">

    <h2 style="color:#dc2626;">
        ❌ Manufacturing Quote Update
    </h2>

    <hr>

    <p>Dear <strong>${quote.name}</strong>,</p>

    <p>
        Thank you for your enquiry.

        After reviewing your request, we are unable to approve it at this time.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-top:20px">

        <tr>
            <td><strong>Company</strong></td>
            <td>${quote.company}</td>
        </tr>

        <tr>
            <td><strong>Product</strong></td>
            <td>${quote.product}</td>
        </tr>

        <tr>
            <td><strong>Status</strong></td>
            <td style="color:#dc2626;font-weight:bold;">
                Rejected
            </td>
        </tr>

    </table>

    <br>

    <p>
        If you would like to discuss your requirements further,
        please feel free to contact us.
    </p>

    <br>

    <p>

        Regards,<br>

        <strong>Triangle Sports</strong>

    </p>

</div>

</body>
</html>
`;
};