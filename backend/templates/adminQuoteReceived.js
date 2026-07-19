module.exports = (quote) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial;background:#f5f5f5;padding:30px">

<div style="max-width:650px;background:white;border-radius:12px;padding:30px">

<h2 style="color:#6D28D9;">
📩 New Manufacturing Quote
</h2>

<hr>

<p><strong>Name:</strong> ${quote.name}</p>

<p><strong>Company:</strong> ${quote.company || "-"}</p>

<p><strong>Email:</strong> ${quote.email}</p>

<p><strong>Phone:</strong> ${quote.phone}</p>

<p><strong>Product:</strong> ${quote.product}</p>

<p><strong>Quantity:</strong> ${quote.quantity}</p>

<p><strong>Requirements:</strong></p>

<p>${quote.requirements || "No requirements"}</p>

</div>

</body>
</html>
`;