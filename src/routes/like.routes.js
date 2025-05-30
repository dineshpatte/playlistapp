import { Router } from "express";

import { toggleVideoLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/togglelike/:videoId").post(verifyJWT, toggleVideoLike);

export default router;
