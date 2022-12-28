const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@friitraining.a5d8fvh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {

        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const usersCollection = client.db('socialSharing').collection('users');
        const postCollection = client.db('socialSharing').collection('posts');

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const quary = { email: email }
            const user = await usersCollection.findOne(quary);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ assessToken: '' });
        })

        app.get('/posts', async (req, res) => {
            const query = {};
            const posts = await postCollection.find(query).toArray();
            res.send(posts);
        })

        app.get('/postdetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await postCollection.findOne(query);
            res.send(result);
        })



        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.post('/posts', async (req, res) => {
            const post = req.body;
            const result = await postCollection.insertOne(post);
            res.send(result);
        })

        app.put('/user/:email', async (req, res) => {

            const email = req.params.email;
            const name = req.body.name;
            const phone = req.body.phone;
            const filter = { email, name, phone };
            const options = { upsert: true };
            const result = await usersCollection.updateOne(filter, options);
            res.send(result);
        })




    } finally {

    }
}
run().catch(console.log);

app.get('/', (req, res) => {
    res.send('Social Sharing server is running')
});

app.listen(port, () => console.log(`Social Sharing is running on port ${port}`))