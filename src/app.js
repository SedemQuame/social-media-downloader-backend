require("dotenv").config();

const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes/api");

const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 3000;
const baseUrl = `http://localhost:${PORT}`;

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});
app.all(`/`, (req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use((req, res, next) => {
    if (
        req.header("x-forwarded-proto") !== "https" &&
        process.env.NODE_ENV === "production"
    ) {
        res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
        next();
    }
});
app.use(express.json());
app.use("/api", apiRoutes);
app.listen(PORT, () => {
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

