const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema(
  {
    order: Object,
    plan: Object,
    tranId: String,
    paidStatus: Boolean,
    startDate: Number,
    endDate: Number,
  },
  {
    timestamps: true,
  }
)

const Order = mongoose.model("Order", orderSchema)

module.exports = Order
