const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const cors = require("cors")
const Plan = require("./Plan.js")
const SSLCommerzPayment = require("sslcommerz-lts")
const Order = require("./Order.js")
// env setup
dotenv.config()

// app setup
const app = express()
const port = process.env.POST || 3000
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ssl commerce

const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASSWORD
const is_live = false

async function main() {
  console.log("Connecting to MongoDB 🔃")
  // MongoDB connection
  await mongoose.connect(process.env.MONGODB_URL)
  console.log("✔ Connected to MongoDB 💖")

  // root route
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Welcome to Backend SSL Commerce React With Node Js",
    })
  })

  // get all plans
  app.get("/plans", async (req, res) => {
    try {
      const plans = await Plan.aggregate([
        {
          $group: {
            _id: "$durationType",
            plans: { $push: "$$ROOT" },
          },
        },
      ])
      const keys = [plans[0]._id, plans[1]._id]
      const newData = {
        [keys[0]]: plans[0].plans,
        [keys[1]]: plans[1].plans,
      }
      res.json({
        success: true,
        message: "Plans fetched successfully",
        data: newData,
      })
    } catch (err) {
      res.json({
        success: false,
        message: err.message,
        data: null,
      })
    }
  })

  // order

  app.post("/order", async (req, res) => {
    const order = req.body

    const plan = await Plan.findOne({
      _id: req.body.planId,
    })

    const main_tran =
      Math.floor(Math.random() * 1000000000000000000)
        .toString(36)
        .slice(0, 9) +
      Math.floor(Math.random() * 1000000000000000000)
        .toString(36)
        .slice(0, 9)

    const data = {
      total_amount: plan.price,
      currency: "BDT",
      tran_id: main_tran, // use unique tran_id for each api call
      success_url: `${process.env.BACKEND_URL}/payment/success/${main_tran}`,
      fail_url: `${process.env.BACKEND_URL}/payment/fail/${main_tran}`,
      cancel_url: `${process.env.BACKEND_URL}/payment/fail/${main_tran}`,
      ipn_url: "http://localhost:3030/ipn",
      shipping_method: "Courier",
      product_name: "Computer.",
      product_category: "Electronic",
      product_profile: "general",
      cus_name: order?.userData?.location,
      cus_email: order?.userData?.email,
      cus_add1: "Dhaka",
      cus_add2: "Dhaka",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: "01711111111",
      cus_fax: "01711111111",
      ship_name: "Customer Name",
      ship_add1: "Dhaka",
      ship_add2: "Dhaka",
      ship_city: "Dhaka",
      ship_state: "Dhaka",
      ship_postcode: 1000,
      ship_country: "Bangladesh",
    }
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
    sslcz.init(data).then(async (apiResponse) => {
      // Redirect the user to payment gateway
      let GatewayPageURL = apiResponse.GatewayPageURL
      res.send({
        url: GatewayPageURL,
      })

      const finalOrder = {
        order,
        plan: plan,
        tranId: main_tran,
        startDate: Date.now(),
        endDate:
          plan.durationType.toLowerCase() === "monthly"
            ? Date.now() + 30 * 24 * 60 * 60 * 1000
            : Date.now() + 365 * 24 * 60 * 60 * 1000,
        paidStatus: false,
      }

      const result = await Order.create(finalOrder)
    })

    app.post("/payment/success/:tranId", async (req, res) => {
      const tranId = req?.params?.tranId
      const result = await Order.updateOne(
        {
          tranId,
        },
        {
          $set: {
            paidStatus: true,
          },
        }
      )
      res.redirect(`${process.env.FRONTEND_URL}/payment/success/${tranId}`)
    })
    app.post("/payment/fail/:tranId", async (req, res) => {
      console.log("payment failed", req.params.tranId)
      const tranId = req?.params?.tranId
      const result = await Order.deleteOne({
        tranId,
      })
      res.redirect(`${process.env.FRONTEND_URL}/payment/fail/${tranId}`)
    })
  })

  // get order details
  app.get("/order", async (req, res) => {
    const allOrder = await Order.find({}).sort({
      updatedAt: -1,
    })
    res.json({
      success: true,
      message: "order details",
      data: allOrder,
    })
  })
  // app listen
  app.listen(port, () => {
    console.log(
      `Example app listening on port ${port} http://localhost:${port}`
    )
  })
}
main().catch((err) => console.log(err))
