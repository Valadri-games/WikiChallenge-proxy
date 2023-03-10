import https from "https";
import fs from 'fs';

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Activate dotenv
dotenv.config();

// Create global variables
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
const allowedExtrnalRessources = process.env.ALLOWED_REQUESTED_RESSOURCES.split(',');

const serverOptions = {
    key: fs.readFileSync(process.env.SSL_PRIVATEKEY),
    cert: fs.readFileSync(process.env.SSL_FULLCHAIN),
};

https.createServer(
    serverOptions,

    (request, response) => {
    console.log(request.headers.origin)

    // Check if request method is different than GET
    if(request.method != "GET") {
        response.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
        });
        response.end(`${request.method} from origin ${request.headers.origin} is not allowed for the request.`);
        return false;
    }

    //Check if origin is allowed
    if(!allowedOrigins.includes(request.headers.origin)) {
        response.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
        });
        response.end(`Origin ${request.headers.origin} is not allowed for the request.`);
        return false;
    }

    //Check if if url is valid
    let requestUrl;
    try {
        requestUrl = new URL("https://testwikichallenge.com" + request.url); // Change later
    } catch(error) {
        writeHead200(response, request);
        response.end("Url is not valid.");
        return false;
    }
    
    // Check if requested url params are present
    let requestQuery = requestUrl.searchParams.get("query");
    if(requestQuery === null) {
        writeHead200(response, request);
        response.end("Request query is not defined.");
        return false;
    }

    // Check if query url is valid
    let queryUrl;
    try {
        queryUrl = new URL(requestQuery);
    } catch(error) {
        writeHead200(response, request);
        response.end("Query url is not valid.");
        return false;
    }

    // Check if given url match the allowed external ressources
    if(!allowedExtrnalRessources.includes(queryUrl.hostname)) {
        writeHead200(response, request);
        response.end("Query url hostname is not allowed.");
        return false;
    }

    // Request the url given as param
    fetch(requestQuery).then((data) => {
        return data.text();
    }).then((data) => {
        writeHead200(response, request);
        response.end(JSON.stringify({ response: data }));
        return false;
    }).catch(() => {
        writeHead200(response, request);
        response.end(JSON.stringify({ response: false }));
        return false;
    });
}).listen(process.env.SERVER_PORT);

function writeHead200(response, request) {
    response.writeHead(200, {
        "Access-Control-Allow-Origin": request.headers.origin,
        "Access-Control-Allow-Methods": "GET",
    });
}