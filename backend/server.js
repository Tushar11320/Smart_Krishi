const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/crops", require("./routes/cropRoutes"));
app.use("/api/machinery", require("./routes/machineryRoutes"));
app.use("/api/milk", require("./routes/milkRoutes"));
app.use("/api/land", require("./routes/landRoutes"));
app.use("/api/tents", require("./routes/tentRoutes"));
app.use("/api/weather", require("./routes/weatherRoutes"));
app.use("/api/fertilizers",require("./routes/fertilizerRoutes"));
app.use("/api/market", require("./routes/marketRoutes"));
app.get("/", (req, res) => {
  res.send("Smart Krishi Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
