require("dotenv").config();

const express = require("express");
const apiRoutes = require("./routes/api");

const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get("/", (req, res) => {
    res.status(200).json({ status: "ok" });
});
app.post("/", (req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/api", apiRoutes);
app.listen(PORT, () => {
    const baseUrl = `http://localhost:${PORT}`;
    switch (NODE_ENV) {
        case "production":
            console.log(`App running in PRODUCTION at ${baseUrl}`);
            break;
        case "test":
            console.log(`App running in TEST mode at ${baseUrl}`);
            break;
        default:
            console.log(`App running in DEVELOPMENT at ${baseUrl}`);
    }
});