const express = require('express');
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId
// const admin = require("firebase-admin");

const port = process.env.PORT || 5000;

// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2rrk7.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log('database connected')
        const database = client.db("smartGlasses");
        const glassesCollections = database.collection("glasses");
        const ordersCollections = database.collection("orders");
        const usersCollections = database.collection("users");

        // for glassesCollections: get normally
        app.get('/glasses', async (req, res) => {
            const cursor = glassesCollections.find({});
            const glasses = await cursor.toArray();
            res.json(glasses);
        })


        // Add NEW Glasses API
        app.post('/glasses', async (req, res) => {
            console.log(req.body);
            const result = await glassesCollections.insertOne(req.body);
            res.send(result);
        })

        // Add orders API
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const result = await ordersCollections.insertOne(orders);
            res.send(orders);
        })

        // GET orders API
        app.get('/orders', async (req, res) => {
            const cursor = ordersCollections.find({});
            const orders = await cursor.toArray();
            console.log(orders);
            res.send(orders);
        })

        // get user by unique email 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const users = await usersCollections.findOne(query);
            let isAdmin = false;
            if (users?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // Add Users
        app.post('/users', async (req, res) => {
            const users = req.body;
            const result = await usersCollections.insertOne(users);
            res.json(result)
        });


        // update users 
        app.put('/users', async (req, res) => {
            const users = req.body;
            const filter = { email: users.email };
            const options = { upsert: true };
            const updateDoc = { $set: users };
            const result = await usersCollections.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // GET orders with EMAIL API
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const result = await ordersCollections.find({ email }).toArray();
            res.json(result);
        })

        // orders deleted by order id
        app.delete("/orders/:id", async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await ordersCollections.deleteOne(query);
            console.log(result);
            res.send(result);
        });

        // confirmation order 
        app.put("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = {
                $set: {
                    status: "Confirmed",
                },
            };
            const result = await ordersCollections.updateOne(query, order);
            console.log(result);
            res.json(result);
        });


        // users check by admin 
        app.put('users/admin', async (req, res) => {
            const users = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollections.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: users.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollections.updateOne(filter, updateDoc);
                    res.json(result);
                }
            } else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }
        })


    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello Neo Smart Eye!');
})

app.listen(port, () => {
    console.log('database connected port', port);
})