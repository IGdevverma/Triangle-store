module.exports = (order) => `
<div style="font-family:Arial;padding:30px">

<h2>🚚 Your Order Has Been Shipped</h2>

<p>Hello <b>${order.customerName}</b>,</p>

<p>Your order is on the way.</p>

<p><b>Order ID:</b> ${order._id}</p>

<hr>

<p>Thank you for shopping with Triangle Sports.</p>

</div>
`;