const mongoose = require("mongoose")

const planSchema = new mongoose.Schema({
  name: String,
  price: Number,
  durationType: String,
  description: String,
  features: [Object],
})

const Plan = mongoose.model("Plan", planSchema)

module.exports = Plan
