const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://seopage:SOWPhaCdHVWCmLuy@cluster0.tort7uo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const upload = multer({ dest: 'uploads/' });

async function run() {
  try {
    await client.connect();
    const database = client.db("seo");
    const infoCollection = database.collection('incomplete');
    const todoCollection = database.collection('todo');
    const completeCollection = database.collection('complete');
    const overdueCollection = database.collection('overdue');
    const underreviewCollection = database.collection('underreview');
    const doingCollection = database.collection('doing');

    console.log("Connected to MongoDB");

    // Unified function to handle file uploads across different collections
    async function handleFileUpload(req, res, collection) {
      const { cardId } = req.body;
      console.log("Card ID:", cardId);

      const files = req.files.map(file => ({
        type: file.mimetype,
        path: file.path,
        name: file.originalname,
        
      }));

      try {
        const result = await collection.updateOne(
          { _id: new ObjectId(cardId) },
          { $push: { attachments: { $each: files } } }
        );

        if (result.modifiedCount === 1) {
          res.status(200).json({ message: `${files.length} files uploaded to existing attachment array.` });
        } else {
          res.status(404).json({ message: "Card not found or no changes made." });
        }
      } catch (error) {
        console.error("Error updating attachment array:", error);
        res.status(500).json({ message: "Failed to upload files." });
      }
    }

    app.post('/upload', upload.array('files'), async (req, res) => {
      await handleFileUpload(req, res, infoCollection);
    });

    app.post('/uploadtodo', upload.array('files'), async (req, res) => {
      await handleFileUpload(req, res, todoCollection);
    });

    app.post('/uploadcomplete', upload.array('files'), async (req, res) => {
      await handleFileUpload(req, res, completeCollection);
    });

    app.post('/uploaddoing', upload.array('files'), async (req, res) => {
      await handleFileUpload(req, res, doingCollection);
    });

    app.post('/uploadoverdue', upload.array('files'), async (req, res) => {
      await handleFileUpload(req, res, overdueCollection);
    });

    app.post('/uploadunderreview', upload.array('files'), async (req, res) => {
      await handleFileUpload(req, res, underreviewCollection);
    });

    
    app.get('/incomplete', async (req, res) => {
      const cards = await infoCollection.find({}).toArray();
      res.json(cards);
    });

    app.get('/todo', async (req, res) => {
      const cards = await todoCollection.find({}).toArray();
      res.json(cards);
    });

    app.get('/underreview', async (req, res) => {
      const cards = await underreviewCollection.find({}).toArray();
      res.json(cards);
    });

    app.get('/overdue', async (req, res) => {
      const cards = await overdueCollection.find({}).toArray();
      res.json(cards);
    });

    app.get('/doing', async (req, res) => {
      const cards = await doingCollection.find({}).toArray();
      res.json(cards);
    });

    app.get('/complete', async (req, res) => {
      const cards = await completeCollection.find({}).toArray();
      res.json(cards);
    });

  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});