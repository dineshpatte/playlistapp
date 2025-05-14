import { Playlist } from "../models/playlist.model.js";
import ApiError from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const { videoId } = req.params;

  const owner = req.user?._id;

  console.log(owner);

  if (!(name, description)) {
    throw new ApiError(402, "name and decsription both are required");
  }
  if (!videoId) {
    throw new ApiError(
      402,
      "video id is requred for the uplaoding videos in playlist"
    );
  }
  if (!owner) {
    throw new ApiError(403, "please login");
  }

  const playlist = await Playlist.create({
    name,
    description,
    videos: videoId,
    owner,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "playlist successfully created"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(402, "the id is required to fetch the playlist");
  }

  const playlist = await Playlist.findById(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist fetched sucessfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!(playlistId, videoId)) {
    throw new ApiError(
      403,
      "both videois nad playlist id are required to upload teh video in the playlist"
    );
  }

  const newPlaylist = await Playlist.findByIdAndUpadte(
    playlistId,
    { $push: { videoId } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!(playlistId, videoId)) {
    throw new ApiError(
      403,
      "both videois nad playlist id are required to upload teh video in the playlist"
    );
  }

  const newPlaylist = await Playlist.findByIdAndDelete(
    playlistId,
    { $pull: { videoId } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "video deleted from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(403, "playlistid is required for deletion");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  res.status(200).json(200, playlist, "deleted playlist sucessfully");
});
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!playlistId) {
    throw new ApiError(402, "playlistid is required for updation");
  }
  if (!(name || description)) {
    throw new ApiError(403, "details are required for upadation");
  }
  const playlist = await Playlist.findByIdAndUpadte(
    playlistId,
    { $set: { name, description } },
    { new: true }
  );
  return res.status(200).json(200, playlist, "updated playlist sucessfully");
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const user = req.user?._id;

  if (!user) {
    throw new ApiError(402, "please login");
  }
  const playlist = Playlist.findById(user);

  return res
    .status(200)
    .json(200, playlist, "fetched playlist for users sucessfully");
});

export {
  createPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getUserPlaylists,
};
