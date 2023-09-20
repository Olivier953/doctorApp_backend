const dotenv = require('dotenv')
dotenv.config()

const express = require("express")
const app = express()

const cors = require("cors")
const { mongoose } = require("mongoose")

app.use(cors({ origin: '*' }));
app.use(express.json())

app.use("/user", require("./routes/userRoute"))
app.use("/admin", require("./routes/adminRoute"))
app.use("/doctor", require("./routes/doctorRoute"))

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("connected to mongoDB"))
.catch((err) => console.log(err))

app.listen(5000, () => {
    console.log("Server started at 5000!")
})
