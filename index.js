const express = require('express');
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;

// port
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// firebase uri
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
        const reviewCollections = database.collection("review");

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
            res.send(result);
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

        // orders deleted by users and admin
        app.delete("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollections.deleteOne(query);
            console.log(result);
            res.send(result);
        });

        // products deleted by admin
        app.delete("/glasses/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await glassesCollections.deleteOne(query);
            console.log(result);
            res.send(result);
        });

        // Reviews deleted by admin
        app.delete("/review/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollections.deleteOne(query);
            console.log(result);
            res.send(result);
        });

        //add review by user
        app.post("/review", async (req, res) => {
            const cursor = req.body;
            const review = await reviewCollections.insertOne(cursor);
            console.log(review);
            res.send(review);
        });

        // get product review from user
        app.get('/review', async (req, res) => {
            const cursor = reviewCollections.find({})
            const review = await cursor.toArray()
            res.json(review)
        })

        // order confirmation by admin 
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


        //make role admin
        app.put("/users/admin", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: "admin" } };
            const result = await usersCollections.updateOne(filter, updateDoc);
            res.send(result);
        });

        // get user with role normal user and admin user
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollections.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

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