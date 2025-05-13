import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import { json } from "express";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validationBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      501,
      "something went wrong whule generating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body;
  console.log("email:", email);

  if (
    [username, fullname, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "user already exist");
  }
  console.log("username:", username);
  console.log("fullname:", fullname);
  console.log("email:", email);
  console.log("password:", password);

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverimageLocalPath = req.files?.coverimage?.[0]?.path;
  //   let coverimageLocalPath;
  //   if (
  //     req.files &&
  //     Array.isArray(req.files.coverimage) &&
  //     req.files.coverimage.length > 0
  //   ) {
  //     coverimageLocalPath = req.files.coverimage[0].path;
  //   }

  if (!avatarLocalPath) {
    throw new ApiError(400, "all fields are required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverimage = await uploadOnCloudinary(coverimageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  );

  if (!createdUser) {
    throw new ApiError(500, "seomething went wrong while registering");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!(username || email)) {
    throw new ApiError(409, "either email or username is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  console.log("Entered password:", password);
  console.log("Stored hash:", user.password);

  const isPasswordValid = await user.isPasswordCorrect(password);

  console.log("Password match:", isPasswordValid);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  console.log(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedInUser,
        refreshToken,
        accessToken,
      }),
      "user logged in successfully"
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,

    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "logout successfull"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,

      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedRefreshToken._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or alreaady used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken:", accessToken, options)
      .cookie("refreshToken:", newRefreshToken, options)
      .json(
        new ApiResponse(
          (200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed")
        )
      );
  } catch (error) {
    throw new ApiError(401, "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findOne(req.user?._id);
  const isPasswordCorrect = isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid password request");
  }

  user.password = newPassword;
  await user.save({ validationBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password change successfull"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!(fullname || email)) {
    throw new ApiError(404, "both emai and fullane are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname, email: email } },
    { new: true }
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
      },
      "Account details updated successfully"
    )
  );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(401, "avatar file is missing");
  }

  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId);
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(404, "erroe while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
      },
      "the avatar is upadted"
    )
  );
});

const updateUserCoverimage = asyncHandler(async (req, res) => {
  const coverimageLocalPath = req.file?.path;
  if (!coverimageLocalPath) {
    throw new ApiError(401, "cover image file is missing");
  }

  if (user.coverimagePublicId) {
    await cloudinary.uploader.destroy(user.coverimagePublicId);
  }

  const coverimage = await uploadOnCloudinary(coverimageLocalPath);

  if (!coverimage.url) {
    throw new ApiError(404, "error while uplaoding coverimage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverimage: coverimage.url,
      },
    },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
      },
      "the cover image is upadted"
    )
  );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "usernam eis missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: $subscribers,
        },
        channelsSubscriberToCount: {
          $size: $subscribedTo,
        },
        isSubscribedCount: {
          $cond: {
            if: { $in: [req.user?.id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscriberToCount: 1,
        isSubscribedCount: 1,
        avatar: 1,
        coverimage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel doesnot exist");
  }

  res
    .status(200)
    .json(new ApiResponse(200, channel[0], "channel fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverimage,
  getUserChannelProfile,
};
