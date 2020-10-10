const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const admin = require('firebase-admin');
const serviceAccount = require("./config/volunteer-network-spa-firebase-adminsdk-mbnvv-1051d3a22b.json");
require('dotenv').config()

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `${process.env.SITE_NAME}`
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ukskk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port = 3360;

client.connect(err => {
    const eventCollection = client.db("volunteerNetwork").collection("events");
    const volunteerCollection = client.db("volunteerNetwork").collection('volunteers');

    app.get('/events', (req, res) => {
        eventCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.post('/addEvent', (req, res) => {
        const newEvent = req.body;
        eventCollection.insertOne(newEvent)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.post('/addVolunteer', (req, res) => {
        const newVolunteer = req.body;
        volunteerCollection.insertOne(newVolunteer)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/tasks', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail === queryEmail) {
                        volunteerCollection.find({email: queryEmail})
                            .toArray( (err,documents) => {
                                res.status(200).send(documents);
                                
                            })
                    }
                    else{
                        res.status(401).send('Un-Authorized Access!!')
                    }
                }).catch(function (error) {
                    res.status(401).send('Un-Authorized Access!!')
                });
        }
        else{
            res.status(401).send('Un-Authorized Access!!')
        }
    })

    app.get('/allVolunteer', (req, res) => {
        volunteerCollection.find({})
            .toArray( (err,documents) => {
            res.status(200).send(documents);
        })    
    })

    app.delete('/deleteTask/:id', (req, res) => {
        const id = req.params.id;
        volunteerCollection.deleteOne({_id: ObjectId(req.params.id)})
        .then(result => {
            res.send(result.deletedCount > 0)
        })
    })

})



app.listen(process.env.PORT || port);