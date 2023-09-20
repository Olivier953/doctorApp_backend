const dotenv = require('dotenv')
dotenv.config()

const express = require("express")
const app = express()

const cors = require("cors")
const { mongoose } = require("mongoose")

app.use(cors({ origin: 'https://doctorappcoyan.netlify.app/' }));
app.use(express.json())

app.use("/user", require("./routes/userRoute"))
app.use("/admin", require("./routes/adminRoute"))
app.use("/doctor", require("./routes/doctorRoute"))

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
  if (req.method == "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }

  next();
});

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("connected to mongoDB"))
.catch((err) => console.log(err))

app.listen(5000, () => {
    console.log("Server started at 5000!")
})
