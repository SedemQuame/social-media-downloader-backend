const express = require("express");
const router = express.Router();
const controller = require("../controllers/downloader");

router.post("/download", controller.fetchDataForPlatform);
router.post("/checkout", controller.createCheckoutSession);
router.post("/verify", controller.verifyStripePayment);

module.exports = router;