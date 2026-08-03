module.exports = (order) => `
<div style="font-family:Arial;padding:30px">

<h2>❌ Order Cancelled</h2>

<p>Hello <b>${order.customerName}</b>,</p>

<p>Your order has been cancelled.</p>

<p>If you have any questions, please contact our support team.</p>

<hr>

<p>Triangle Sports</p>

</div>
`;