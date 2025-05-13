import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/videoupload", verifyJWT).post(
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    {
      name: "videofile",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  uploadVideo
);
export default router;
