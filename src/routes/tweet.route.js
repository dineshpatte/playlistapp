import { Router } from "express";
import { createTweet, getUserTweets } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/createtweet").post(verifyJWT, createTweet);
router.route("/getusertweet").get(verifyJWT, getUserTweets);

export default router;
