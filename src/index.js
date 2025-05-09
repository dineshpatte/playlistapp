import dotenv from "dotenv";
import mongoose from "mongoose";

import express from "express";
import connectDb from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDb()
  .then(
    app.listen(process.env.PORT || 3000, () => {
      console.log(`server is running at port ${process.env.PORT}`);
    })
  )
  .catch((error) => {
    console.log("mongodb connection failed !!!");
  });

// async () => {
//     try {
//       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//       app.on("error", () => {
//         console.log("ERROR", error);
//         throw error;
//       });

//       app.listen(process.env.PORT, () => {
//         console.log(`app is listening on port ${process.env.PORT}`);
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   };
