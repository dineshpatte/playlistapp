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

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = -1,
    userId,
  } = req.query;
  const skip = (page - 1) * limit;

  const matchCriteria = {};
  if (query) {
    matchCriteria.title = { $regex: query, $options: "i" };
  }

  const videos = await Video.aggregate([
    {
      $match: matchCriteria,
    },
    {
      $sort: { [sortBy]: sortType },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    { $unwind: "$ownerInfo" },
    {
      $project: {
        title: 1,
        description: 1,
        createdAt: 1,
        "ownerInfo.username": 1,
        "ownerInfo.avatar": 1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  const totalCount = await Video.countDocuments(matchCriteria);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        page,
        totalPages: Math.ceil(totalCount / limit),
        totalVideos: totalCount,
      },
      "All videos fetched successfully"
    )
  );
});

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

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(402, "video id is required for fetching videos");
  }
  const video = Video.findById(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "vidoe has been fetched"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(402, "please upload teh thumbnail file");
  }

  if (!videoId) {
    throw new ApiError(402, "videoid is required for updation");
  }

  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(
      400,
      "At least one field (title, description, thumbnail) is required for update"
    );
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "the details have been updated"));
});
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "videoId is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: video.isPublished },
        `Video has been ${video.isPublished ? "published" : "unpublished"}`
      )
    );
});

export { uploadVideo, getAllVideos, getVideoById, updateVideo, deleteVideo };
