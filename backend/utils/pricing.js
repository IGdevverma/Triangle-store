const calculatePricing = (items, couponCode = '') => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.packPrice || 0) * Number(item.quantity || 0),
    0
  );

  const normalizedCoupon = couponCode?.trim().toUpperCase();

  const allowedCoupons = [
    "SAVE10",
    "WELCOME20"
  ];

  if (
    normalizedCoupon &&
    !allowedCoupons.includes(normalizedCoupon)
  ) {
    throw new Error("Invalid coupon code");
  }

  let discountAmount = 0;

  if (normalizedCoupon === "SAVE10") {
    discountAmount = Math.round(subtotal * 0.10);
  } else if (normalizedCoupon === "WELCOME20") {
    discountAmount = Math.round(subtotal * 0.20);
  }

  const taxableAmount = Math.max(
    subtotal - discountAmount,
    0
  );

  const shipping = subtotal >= 999 ? 0 : 99;

  const gst = 0;

  const total = taxableAmount + shipping;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    shipping,
    gst,
    total,
    couponCode: normalizedCoupon || ''
  };
};

module.exports = {
  calculatePricing
};