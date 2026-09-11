
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");


let dashboardCache = null;
let dashboardCacheTime = 0;

const DASHBOARD_CACHE_TTL = 30 * 1000; // 30 seconds


exports.getDashboard = async (req, res) => {

    try {

        const now = Date.now();

        if (
            dashboardCache &&
            now - dashboardCacheTime < DASHBOARD_CACHE_TTL
        ) {
            return res.status(200).json(dashboardCache);
        }


        const [
            totalOrders,
            totalUsers,
            productStats,

        ] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments(),

            Product.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        lowStockProducts: {
                            $sum: {
                                $cond: [
                                    { $lte: ["$stock", 5] },
                                    1,
                                    0
                                ]
                            }
                        },
                        totalStock: { $sum: "$stock" },
                        inventoryValue: {
                            $sum: {
                                $multiply: ["$price", "$stock"]
                            }
                        },
                        categories: {
                            $addToSet: "$category"
                        }
                    }
                }
            ])
        ]);

        const stats = productStats[0] || {};

        const totalProducts = stats.totalProducts || 0;
        const lowStockProducts = stats.lowStockProducts || 0;
        const totalStock = stats.totalStock || 0;
        const inventoryValue = stats.inventoryValue || 0;
        const totalCategories = stats.categories?.length || 0;


        const orderStats = await Order.aggregate([
            {
                $facet: {
                    revenue: [
                        {
                            $group: {
                                _id: null,
                                totalRevenue: {
                                    $sum: "$total"
                                }
                            }
                        }
                    ],

                    monthlySales: [
                        {
                            $group: {
                                _id: {
                                    month: {
                                        $month: "$createdAt"
                                    }
                                },
                                revenue: {
                                    $sum: "$total"
                                }
                            }
                        },
                        {
                            $sort: {
                                "_id.month": 1
                            }
                        }
                    ],

                    statusCounts: [
                        {
                            $group: {
                                _id: "$orderStatus",
                                count: { $sum: 1 }
                            }
                        }
                    ]
                }
            }
        ]);

        const orderData = orderStats[0] || {};

        const totalRevenue =
            orderData.revenue?.[0]?.totalRevenue || 0;

        const monthlySales =
            orderData.monthlySales || [];

        const orderStatusMap = Object.fromEntries(
            (orderData.statusCounts || []).map(
                item => [item._id, item.count]
            )
        );

        const processingOrders = orderStatusMap.Processing || 0;
        const packedOrders = orderStatusMap.Packed || 0;
        const shippedOrders = orderStatusMap.Shipped || 0;
        const deliveredOrders = orderStatusMap.Delivered || 0;
        const cancelledOrders = orderStatusMap.Cancelled || 0;








        const responseData = {
            success: true,

            dashboard: {
                processingOrders,
                packedOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,

                totalProducts,
                totalOrders,
                totalUsers,

                totalRevenue,
                totalCategories,
                lowStockProducts,
                totalStock,
                inventoryValue,

                monthlySales
            }
        };

        dashboardCache = responseData;
        dashboardCacheTime = Date.now();

        res.status(200).json(responseData);

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};