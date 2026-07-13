const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

exports.getDashboard = async (req, res) => {

    try {

        const [
            totalProducts,
            totalOrders,
            totalUsers
        ] = await Promise.all([
            Product.countDocuments(),
            Order.countDocuments(),
            User.countDocuments()
        ]);
        const lowStockProducts = await Product.countDocuments({
            stock: { $lte: 5 }
        });
        const categories = await Product.distinct("category");

        const totalCategories = categories.length;

        const revenue = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$total"
                    }
                }
            }
        ]);


        const monthlySales = await Order.aggregate([
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
        ]);

        const [
            processingOrders,
            packedOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders
        ] = await Promise.all([

            Order.countDocuments({
                orderStatus: "Processing"
            }),

            Order.countDocuments({
                orderStatus: "Packed"
            }),

            Order.countDocuments({
                orderStatus: "Shipped"
            }),

            Order.countDocuments({
                orderStatus: "Delivered"
            }),

            Order.countDocuments({
                orderStatus: "Cancelled"
            })

        ]);





        const stock = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalStock: {
                        $sum: "$stock"
                    }
                }
            }
        ]);

        const inventory = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    inventoryValue: {
                        $sum: {
                            $multiply: [
                                "$price",
                                "$stock"
                            ]
                        }
                    }
                }
            }
        ]);


        res.status(200).json({

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

                totalRevenue: revenue[0]?.totalRevenue || 0,

                totalCategories,

                lowStockProducts,

                totalStock: stock[0]?.totalStock || 0,

                inventoryValue: inventory[0]?.inventoryValue || 0,
                monthlySales
                



            }

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};