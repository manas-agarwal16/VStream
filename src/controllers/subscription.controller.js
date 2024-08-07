import { User } from "../models/users.model.js";
import { Video } from "../models/videos.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscriptions.model.js";
import mongoose from "mongoose";

//clear
const subscribe = asyncHandler(async (req, res) => {
  const user = req.user;
  const { username } = req.body; //frontend- username = channel

  if (!username) {
    throw new ApiError(401, "video_id is required");
  }

  const subscribeTo = await User.findOne({ username });

  if (!subscribeTo) {
    throw new ApiError(401, "No such channel exists");
  }

  const subscribed = await Subscription.findOne({
    subscriber: user._id,
    subscribeTo: subscribeTo._id,
  });

  if (subscribed) {
    return res
      .status(201)
      .json(new ApiResponse(201, "You have already subscribed this channel"));
  }

  const subscribeChannel = new Subscription({
    subscribeTo: subscribeTo._id,
    subscriber: user._id,
  });

  await subscribeChannel
    .save()
    .then(() => {
      res
        .status(201)
        .json(new ApiResponse(201, `You have subscribed ${username}`));
    })
    .catch((err) => {
      throw new ApiError(501, "error in subscribing user");
    });
});

//clear
const unSubscribe = asyncHandler(async (req, res) => {
  const user = req.user;
  const { username } = req.body;
  if (!username) {
    throw new ApiError(401, "username is requred");
  }

  const userToUnsubscribe = await User.findOne({ username });
  if (!userToUnsubscribe) {
    throw new ApiError(401, "no such username found");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: user._id,
    subscribeTo: userToUnsubscribe._id,
  });
  if (!isSubscribed) {
    return res
      .status(201)
      .json(new ApiResponse(201, "u have not subscribed this channel already"));
  }

  const deleteSubscription = await Subscription.findOneAndDelete({
    subscriber: user._id,
    subscribeTo: userToUnsubscribe._id,
  });

  console.log(deleteSubscription);
  if (!deleteSubscription) {
    throw new ApiError(501, "error in deleting subscription");
  }
  res
    .status(201)
    .json(new ApiResponse(201, `You have unsubscribed ${username}.`));
});

//clear
const subscriptionChannels = asyncHandler(async (req, res) => {
  const user = req.user;
  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscribeTo",
        foreignField: "_id",
        as: "username",
      },
    },
    {
      $unwind: "$username",
    },
    {
      $group: {
        _id: "$user_id",
        subscriptions: { $push: "$username.username" },
      },
    },
  ]);
  console.log(channels);
  if (channels.length === 0) {
    res
      .status(201)
      .json(new ApiResponse(201, "U have not subscribed any channel yet"));
  }
  res
    .status(201)
    .json(new ApiResponse(201, channels, "subscriptions fetched successfully"));
});

//clear
const subscriptions = asyncHandler(async (req, res) => {
  const user = req.user;
  const videos = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "subscribeTo",
        foreignField: "owner",
        as: "Videos",
      },
    },
    {
      $addFields: {
        username: { $arrayElemAt: ["$Videos.username", 0] },
      },
    },
    {
      $project: {
        username: 1,
        Videos: 1,
      },
    },
    {
      //channel with no videos are excluded
      $match: {
        Videos: { $not: { $size: 0 } }, // Filter out documents where Videos array is empty
      },
    },
  ]);
  if (videos.length === 0) {
    res
      .status(201)
      .json(new ApiResponse(201, "you have not subscribed any channel yet"));
  }
  res
    .status(201)
    .json(new ApiResponse(201, videos, "videos fetched successfully"));
});

export { subscribe, subscriptions, unSubscribe, subscriptionChannels };
