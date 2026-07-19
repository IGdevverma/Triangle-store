module.exports = (quote) => {
    return `
<!DOCTYPE html>
<html>
<body style="font-family:Arial;background:#f5f5f5;padding:30px">

<div style="max-width:650px;background:#fff;border-radius:12px;padding:30px;margin:auto">

    <h2 style="color:#16a34a;">
        ✅ Your Manufacturing Quote has been Approved
    </h2>

    <hr>

    <p>Dear <strong>${quote.name}</strong>,</p>

    <p>
        Thank you for choosing <strong>Triangle Sports</strong>.
        We are pleased to inform you that your manufacturing enquiry has been
        <strong style="color:#16a34a;">APPROVED</strong>.
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
            <td><strong>Quantity</strong></td>
            <td>${quote.quantity}</td>
        </tr>

        <tr>
            <td><strong>Status</strong></td>
            <td style="color:#16a34a;font-weight:bold;">
                Approved
            </td>
        </tr>
    </table>

    <br>

    <p>
        Our sales team will contact you shortly regarding pricing,
        production timeline and further discussion.
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