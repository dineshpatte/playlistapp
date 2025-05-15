import { Router } from "express";
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/createtweet").post(verifyJWT, createTweet);
router.route("/getusertweet").get(verifyJWT, getUserTweets);

router.put("/updatetweet/:tweetId", verifyJWT, updateTweet);

router.delete("/deletetweet/:tweetId", verifyJWT, deleteTweet);

export default router;
