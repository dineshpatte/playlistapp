import { Router } from "express";

import {
  addComment,
  deleteComment,
  getAllComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/addcomment").post(verifyJWT, addComment);
router.route("/updatecomment").post(verifyJWT, updateComment);
router.route("/deletecomment").post(verifyJWT, deleteComment);
router.route("/video/:videoId").get(verifyJWT, getAllComments);

export default router;
