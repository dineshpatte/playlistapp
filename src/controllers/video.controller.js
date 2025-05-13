import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";

//first get the details for the req.body
//title descriptin duration owner
//fins the owner by his user_id
//if the owner matches from the req.body proceed otherwise throw error
//then get the thumbnail and video files upload em in cloudinary
//Video.create next response

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description, duration } = req.body;
  const owner = req.user?._id;

  console.log("owner", owner);

  if ([title, description, duration].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are required");
  }

  if (!owner) {
    throw new ApiError(401, "User not authenticated");
  }

  const user = await User.findById(owner);
  if (!user) {
    throw new ApiError(401, "user id not matching with the user");
  }

  console.log(owner);
  console.log(user);
  console.log(title);
  console.log(description);
  console.log(duration);

  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

  const videofileLocalPath = req.files?.videofile?.[0].path;

  if (!(thumbnailLocalPath || videofileLocalPath)) {
    throw new ApiError(402, "all fileds required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videofile = await uploadOnCloudinary(videofileLocalPath);

  if (!(thumbnail || videofile)) {
    throw new ApiError(402, "thumbnail and avatar are required");
  }

  const newVideo = await Video.create({
    title,
    description,
    owner,
    duration,
    thumbnail: thumbnail.url,
    videofile: videofile.url,
  });
  console.log("New video created:", newVideo);

  return res
    .status(201)
    .json(
      new ApiResponse(201, { video: newVideo }, "Video uploaded successfully")
    );
});

export { uploadVideo };
