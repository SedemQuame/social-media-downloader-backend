require("dotenv").config();
const { igdl, ttdl, fbdown, youtube, twitter } = require("btch-downloader");

// Determine current environment
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production"
const PORT = process.env.PORT || 3000;

// Select correct Stripe secret key
const stripeSecretKey = isProduction
    ? process.env.STRIPE_SECRET_PROD_KEY
    : process.env.STRIPE_SECRET_TEST_KEY;

const host = isProduction ? process.env.HOST_URL_PROD : process.env.HOST_URL_TEST;
const stripe = require("stripe")(stripeSecretKey);

// Environment-based redirect URLs
const STRIPE_SUCCESS_URL = isProduction
    ? `${host}/success`
    : `${host}:${PORT}/success`;

const STRIPE_CANCEL_URL = isProduction
    ? `${host}/cancel`
    : `${host}:${PORT}/cancel`;

// Downloader class logic
class Downloader {
    constructor(platform, fetchFunction) {
        this.platform = platform;
        this.fetchFunction = fetchFunction;
    }

    async fetchData(url) {
        if (!url) throw new Error("URL is missing or invalid.");
        if (typeof this.fetchFunction !== "function") {
            throw new Error(`Invalid fetch function for: ${this.platform}`);
        }
        return await this.fetchFunction(url);
    }
}

const platformFetchers = {
    instagram: igdl,
    tiktok: ttdl,
    facebook: fbdown,
    youtube: youtube,
    twitter: twitter,
    x: twitter,
};

const marshalData = (platform, data) => {
    const base = {
        title: "N/A",
        description: "N/A",
        videoUrl: "N/A",
        audioUrl: "N/A",
        thumbnailUrl: "N/A",
        creator: "N/A",
        channelName: "N/A",
        channelUrl: "N/A",
        views: "N/A",
    };

    switch (platform.toLowerCase()) {
        case "tiktok":
            return {
                ...base,
                title: data.title || "N/A",
                videoUrl: data.video?.[0] || "N/A",
                audioUrl: data.audio?.[0] || "N/A",
                thumbnailUrl: data.thumbnail || "N/A",
                creator: data.creator || "N/A",
            };
        case "youtube":
            return {
                ...base,
                title: data.title || "N/A",
                description: data.description || "N/A",
                videoUrl: data.mp4 || "N/A",
                audioUrl: data.mp3 || "N/A",
                thumbnailUrl: data.thumbnail || "N/A",
                channelName: data.name || "N/A",
                channelUrl: data.channel || "N/A",
                views: data.views || "N/A",
            };
        case "twitter":
        case "x":
            return {
                ...base,
                title: data.title || "N/A",
                videoUrl:
                    data.url?.find((e) => e.hd)?.hd ||
                    data.url?.find((e) => e.sd)?.sd ||
                    "N/A",
            };
        case "facebook":
            return {
                ...base,
                videoUrl: data.HD || data.Normal_video || "N/A",
            };
        case "instagram":
            return {
                ...base,
                thumbnailUrl: data[0]?.thumbnail || "N/A",
                videoUrl: data[0]?.url || "N/A",
                creator: data[0]?.wm || "N/A",
            };
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
};

// Controller: fetch downloader data
exports.fetchDataForPlatform = async (req, res) => {
    try {
        const { platform, url } = req.body;
        if (!platform || !url) throw new Error("Missing platform or URL");

        const fetchFunction = platformFetchers[platform.toLowerCase()];
        if (!fetchFunction) throw new Error(`Unsupported platform: ${platform}`);

        const downloader = new Downloader(platform, fetchFunction);
        const rawData = await downloader.fetchData(url);
        const data = marshalData(platform, rawData);

        res.status(200).json(data);
    } catch (err) {
        console.error("Fetch error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// Controller: create checkout session
exports.createCheckoutSession = async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "Download Access",
                        description: "Pay $1 for download access",
                    },
                    unit_amount: 100,
                },
                quantity: 1,
            }],
            mode: "payment",
            success_url: STRIPE_SUCCESS_URL + "?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: STRIPE_CANCEL_URL,
        });

        res.status(200).json({ id: session.id });
    } catch (err) {
        console.error("Stripe error:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// Controller: verify payment
exports.verifyStripePayment = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ success: false, message: "Payment not confirmed" });
        }
    } catch (err) {
        console.error("Verify error:", err.message);
        res.status(500).json({ error: err.message });
    }
};