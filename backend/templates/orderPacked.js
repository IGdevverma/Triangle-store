module.exports = (order) => `
<div style="font-family:Arial;padding:30px">
<h2>📦 Your Order Has Been Packed</h2>

<p>Hello <b>${order.customerName}</b>,</p>

<p>Your order has been packed and is ready for dispatch.</p>

<p><b>Order ID:</b> ${order._id}</p>

<p><b>Status:</b> Packed</p>

<hr>

<p>Triangle Sports Team</p>

</div>
`;