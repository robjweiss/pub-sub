const fetch = require('node-fetch');
const redisConnection = require("../config/redis-connection");

(async () => {

    const url = 'https://gist.githubusercontent.com/philbarresi/5cf15393d245b38a2d86ce8207d5076c/raw/d529fb474c1af347702ca4d7b992256237fa2819/lab5.json';
    const res = await fetch(url);
    const people = await res.json();


    redisConnection.on("find:request:*", (message, channel) => {
        const requestId = message.requestId;
        const eventName = message.eventName;

        const successEvent = `${eventName}:success:${requestId}`;
        const failedEvent = `${eventName}:failed:${requestId}`;
        
        const id = message.data.id;
        const person = people.find(entry => entry.id === id);

        // Person found
        if (person !== undefined) {
            redisConnection.emit(successEvent, {
                requestId: requestId,
                data: {
                    person: person
                },
                eventName: eventName
            });
        }
        // Person not found
        else {
            redisConnection.emit(failedEvent, {
                requestId: requestId,
                data: {
                    message: "Person not found"
                },
                eventName: eventName
            });
        }
    });


    redisConnection.on("create:request:*", (message, channel) => {
        const requestId = message.requestId;
        const eventName = message.eventName;

        const successEvent = `${eventName}:success:${requestId}`;
        const failedEvent = `${eventName}:failed:${requestId}`;

        const person = message.data.person;

        let error = null;
        
        // Duplicate ID
        for (existingPerson of people) {
            if (existingPerson.id === person.id) {
                error = "A person with that ID already exists";
                break;
            }
        }

        const validKeys = ["id", "first_name", "last_name", "email", "gender", "ip_address"];
        // Invalid key provided
        for (let key in person) {
            if (!validKeys.includes(key)) {
                error = key + " is not a valid key for a person";
            }
        }

        // Missing key
        for (let key of validKeys) {
            if (!Object.keys(person).includes(key)) {
                error = "Missing key: " + key;
            }
        }

        if (!error) {
            people.push(person);

            const createdPerson = people.find(entry => entry.id === person.id);

            redisConnection.emit(successEvent, {
                requestId: requestId,
                data: {
                    createdPerson: createdPerson
                },
                eventName: eventName
            });
        }
        // Error
        else {
            redisConnection.emit(failedEvent, {
                requestId: requestId,
                data: {
                    message: error
                },
                eventName: eventName
            });
        }
    });


    redisConnection.on("delete:request:*", (message, channel) => {
        const requestId = message.requestId;
        const eventName = message.eventName;

        const successEvent = `${eventName}:success:${requestId}`;
        const failedEvent = `${eventName}:failed:${requestId}`;

        const id = message.data.id;

        const index = people.findIndex(person => person.id === id);

        // Person found
        if (index !== -1) {
            people.splice(index, 1);

            redisConnection.emit(successEvent, {
                requestId: requestId,
                data: {
                    message: "Person deleted"
                },
                eventName: eventName
            });
        }
        // Person not found
        else {
            redisConnection.emit(failedEvent, {
                requestId: requestId,
                data: {
                    message: "Person not found"
                },
                eventName: eventName
            });
        }
    });


    redisConnection.on("update:request:*", (message, channel) => {
        const requestId = message.requestId;
        const eventName = message.eventName;

        const successEvent = `${eventName}:success:${requestId}`;
        const failedEvent = `${eventName}:failed:${requestId}`;

        
        const id = message.data.id;
        const person = message.data.person;

        let error = null;

        const index = people.findIndex(person => person.id === id);
        // Person not found
        if (index === -1) {
            error = "Person not found";
        }
        // Updated ID is for a person that already exists
        else if (person.id) {
            if (people.find(entry => entry.id === person.id) !== undefined) {
                error = "A person with the ID " + person.id + " already exists";
            }
        }
        // Invalid key provided
        else {
            for (let key in person) {
                if (!Object.keys(people[index]).includes(key)) {
                    error = key + " is not a valid key for a person";
                }
            }
        }

        // Person found
        if (!error) {
            for (let key in person) {
                for (let existingKey in people[index]) {
                    if (key === existingKey) {
                        people[index][key] = person[key];
                    }
                }
            }

            const updatedPerson = people[index];

            redisConnection.emit(successEvent, {
                requestId: requestId,
                data: {
                    updatedPerson: updatedPerson
                },
                eventName: eventName
            });
        }

        // Error
        if (error) {
            redisConnection.emit(failedEvent, {
                requestId: requestId,
                data: {
                    message: error
                },
                eventName: eventName
            });
        }
    });

})();