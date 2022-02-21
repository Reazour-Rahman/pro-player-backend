const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const mongoose = require("mongoose");
var cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

//middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cexwu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
      let cursor = blogsCollection.find({});
      const page = req.query.page;
      const size = parseInt(req.query.size);
      const category = req?.query?.filter?.toLocaleLowerCase();
      console.log(category);
      let count;
      let products;

      if (page) {
        // console.log(page);
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      }

      //filter by category
      else if (category) {
        // console.log(category.toLocaleLowerCase());
        cursor = blogsCollection.find({ category: { $all: [category] } });
        products = await cursor.toArray();
        count = await cursor.count();
      }
      //default blogs
      else {
        products = await cursor.toArray();
        count = await cursor.count();
      }

      res.send({
        count,
        products,
      });
    });
    
    app.post('/blogs', async (req, res) => {
      const data = req.body
      // const video = req.files
      console.log(data);
      // console.log(video);
      const videoData = req.files.video.data;
      const encodedVideo = videoData.toString('base64');
      const videoBuffer = Buffer.from(encodedVideo, 'base64');


    //   const appartamento2 = {
    //     ids_stile: appartamento.ids_stile.split(", ").map(s => +s),
    //     ids_personaggi: appartamento.ids_personaggi.split(", ").map(s => parseInt(s)),
    // }

      const post = {
            title : data.title, privacy: data.privacy, monetize : data.monetize, language : data.language, description : data.description, license : data.license, status: data.status, category : data.category.split(',').map(s => s) , tags : data.tags.split(',').map(s => s), video: videoBuffer, bloggerName : data.bloggerName, bloggerEmail: data.bloggerEmail, uploadTime : data.uploadTime, date : data.date,  comment: []
        }
      console.log( post);
      const blog = await blogsCollection.insertOne(post)
      res.json(blog)
    })

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

    // Please write down codes with commenting as like as top get request...
    // to start this server follow this command (you must install nodemon globally in your computer before running command)
    // npm run start-dev
    // Start coding, Happy coding Turbo fighter.....sanaul
    // heroku api link https://ancient-atoll-16639.herokuapp.com/
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
