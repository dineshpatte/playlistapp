import { Router } from "express";

import {
  createPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getUserPlaylists,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/createplaylist/:videoId").post(verifyJWT, createPlaylist);
router.get("/:playlistId", getPlaylistById);

router.put("/:playlistId/add/:videoId", verifyJWT, addVideoToPlaylist);

router.put("/:playlistId/remove/:videoId", verifyJWT, removeVideoFromPlaylist);

router.delete("/:playlistId", verifyJWT, deletePlaylist);

router.put("/:playlistId", verifyJWT, updatePlaylist);

router.get("/user/playlists", verifyJWT, getUserPlaylists);

export default router;
