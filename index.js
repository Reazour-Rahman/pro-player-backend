const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const serviceAccount = require("./proplayers-firebase-adminsdk.json");

const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

var cors = require("cors");
const { json } = require("body-parser");
const { parse } = require("dotenv");

const app = express();
const port = process.env.PORT || 5000;

//middle ware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cexwu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// jwt token
async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const idToken = req.headers.authorization.split(" ")[1];
    console.log("Bearer", idToken);
    try {
      const decodedAdmin = await admin.auth().verifyIdToken(idToken);
      console.log("email :", decodedAdmin.email);
      req.decodedAdminEmail = decodedAdmin.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    /* database */
    const database = client.db("proPlayer");
    const blogsCollection = database.collection("blogs");
    const usersCollection = database.collection("users");

    /*::::::::::::::::::::::::::::::::::::::::: 
    access blogs collection including pagination
    :::::::::::::::::::::::::::::::::::::::::::*/
    app.get("/blogs", async (req, res) => {
      const cursor = blogsCollection.find({});
      const page = req.query.page;
      const size = parseInt(req.query.size);
      const count = await cursor.count();
      let blogs;
      if (page) {
        blogs = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        blogs = await cursor.toArray();
      }
      res.send({
        count,
        blogs,
      });
    });

    app.post("/blogs", async (req, res) => {
      const data = req.body;
      // const video = req.files
      console.log(data);
      // console.log(video);
      const videoData = req.files.video.data;
      const encodedVideo = videoData.toString("base64");
      const videoBuffer = Buffer.from(encodedVideo, "base64");

      const post = {
        title: data.title,
        privacy: data.privacy,
        monetize: data.monetize,
        language: data.language,
        description: data.description,
        license: data.license,
        status: data.status,
        category: data.category.split(",").map((s) => s),
        tags: data.tags.split(",").map((s) => s),
        video: videoBuffer,
        bloggerName: data.bloggerName,
        bloggerEmail: data.bloggerEmail,
        uploadTime: data.uploadTime,
        date: data.date,
        comment: [],
      };
      console.log(post);
      const blog = await blogsCollection.insertOne(post);
      res.json(blog);
    });

    //user sign up data saving

    app.post("/users", async (req, res) => {
      const data = req.body;
      console.log(data);
      const user = await usersCollection.insertOne(data);
      res.json(user);
    });

    app.get("/users", async (req, res) => {
      const users = await usersCollection.find({}).toArray();
      res.send(users);
    });

    // Make Admin jwt token
    app.get("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      console.log(req.headers);
      console.log(req.decodedAdminEmail);
      const requester = req.decodedAdminEmail;
      if (requester) {
        const requesterAccount = usersCollection.findOne({ email: requester });
        if (requester.role === "admin") {
          console.log("put", req.decodedAdminEmail);
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res.status(403).json({ message: " You are not Admin" });
      }
    });

    //if your data already had saved in the database then we don't want save it again
    app.put("/users", async (req, res) => {
      const data = req.body;
      const filter = { email: data.email };
      const option = { upsert: true };
      const updateDoc = {
        $set: data,
      };
      const user = await usersCollection.updateOne(filter, updateDoc, option);
      res.json(user);
    });

    // Please write down codes with commenting as like as top get request...
    // to start this server follow this command (you must install nodemon globally in your computer before running command)
    // npm run start-dev
    // Start coding, Happy coding Turbo fighter.....sanaul
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Pro player server is running now!");
});

app.listen(port, () => {
  console.log(`Turbo Server is running http://localhost:${port}`);
});
