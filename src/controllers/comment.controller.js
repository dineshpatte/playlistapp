import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import ApiError from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getAllComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!videoId) {
    throw new ApiError(402, "videoId is required");
  }

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    { $sort: { createdAt: -1 } },
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
        content: 1,
        createdAt: 1,
        "ownerInfo.username": 1,
        "ownerInfo.avatar": 1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  const totalCount = await Comment.countDocuments({ video: videoId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        page,
        totalPages: Math.ceil(totalCount / limit),
        totalComments: totalCount,
      },
      "All comments"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { content, video } = req.body;
  const owner = req.user?._id;

  console.log("owner", owner);

  if (!(content || video)) {
    throw new ApiError(401, "content is required");
  }
  const newComment = await Comment.create({
    owner,
    video,
    content,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, content, "comment posted successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { content, comment } = req.body;
  const owner = req.user?._id;
  if (!owner) {
    throw new ApiError(402, "the user is not found ");
  }

  if (!(comment || content)) {
    throw new ApiError(402, "video and content are required ");
  }

  await Comment.findByIdAndUpdate(
    comment,
    { $set: { content: content } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, content, "updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.body;

  if (!commentId) {
    throw new ApiError(402, "comemnt id is required");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, commentId, "the above id commnet is deleted"));
});

export { addComment, updateComment, deleteComment, getAllComments };
