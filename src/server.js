const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const redisConnection = require("../config/redis-connection");
const nrpSender = require("../utils/nrp-sender-shim");

app.use(bodyParser.json());

app.get("/api/people/:id", async (req, res) => {
    try {
        const response = await nrpSender.sendMessage({
            redis: redisConnection,
            eventName: "find",
            data: {
                id: parseInt(req.params.id)
            },
            expectsResponse: true
        });

        res.json(response.person);
    } catch (e) {
        res.json({error: e.message});
    }
});

app.post("/api/people", async (req, res) => {
    try {
        const response = await nrpSender.sendMessage({
            redis: redisConnection,
            eventName: "create",
            data: {
                person: req.body
            },
            expectsResponse: true
        });

        res.json(response.createdPerson);

    } catch (e) {
        res.json({error: e.message});
    }
});

app.delete("/api/people/:id", async (req, res) => {
    try {
        const response = await nrpSender.sendMessage({
            redis: redisConnection,
            eventName: "delete",
            data: {
                id: parseInt(req.params.id)
            },
            expectsResponse: true
        });

        res.json(response.message);
    } catch (e) {
        res.json({error: e.message});
    }
});

app.put("/api/people/:id", async (req, res) => {
    try {
        const response = await nrpSender.sendMessage({
            redis: redisConnection,
            eventName: "update",
            data: {
                id: parseInt(req.params.id),
                person: req.body
            },
            expectsResponse: true
        });

        res.json(response.updatedPerson);
    } catch (e) {
        res.json({error: e.message});
    }
});

app.get("*", (req, res) => {
    res.status(404).send("Page not found");
});

app.listen(3000, () => {
    console.log("Express server running on http://localhost:3000");
});