const express = require("express")
const dotenv = require('dotenv')
dotenv.config()
const cors = require("cors")
const { mongoose } = require("mongoose")
const app = express()
app.use(express.json())
const userRoute = require("./routes/userRoute")
const adminRoute = require("./routes/adminRoute")
const doctorRoute = require("./routes/doctorRoute")
app.use(cors())

app.use("/user", userRoute)
app.use("/admin", adminRoute)
app.use("/doctor", doctorRoute)

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("connected to mongoDB"))
.catch((err) => console.log(err))

app.listen(5000, () => {
    console.log("Server started at 5000!")
})
