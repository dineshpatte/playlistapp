import { Like } from "../models/like.model.js";
import ApiError from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const user = req.user?._id;
  const { videoId } = req.params;

  if (!user) {
    throw new ApiError(402, "please login or user not available");
  }

  if (!videoId) {
    throw new ApiError(403, "video id is required");
  }

  const like = await Like.create({
    videoId,
    user,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { like, user }, "successfully liked"));
});

export { toggleVideoLike };
