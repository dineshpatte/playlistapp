import mongoose, { Schema } from "mongoose";

const likeSchema = mongoose.Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
    likedby: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timstamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
