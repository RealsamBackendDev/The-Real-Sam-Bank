const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./config/databaseConfig"); 



const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", require("./routes/authRoute"));
app.use("/api/v1/onboarding", require("./routes/onboardingRoutes"));
app.use("/api/v1/account", require("./routes/accountRoute"));
app.use("/api/v1/transfers", require("./routes/transactionRoute"));









const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};


startServer();