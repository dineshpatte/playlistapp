import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getAllVideos,
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";
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
router.route("/getallvideos").get(verifyJWT, getAllVideos);

router.get("/getvideobyid/:videoId", verifyJWT, getVideoById);

router.put("/updatevideo/:videoId", verifyJWT, updateVideo);

router.delete("/deletevideo/:videoId", verifyJWT, deleteVideo);

router.patch("/:videoId/toggle-publish", verifyJWT, togglePublishStatus);
export default router;
