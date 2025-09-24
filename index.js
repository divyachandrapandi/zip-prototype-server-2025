import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotEnv from 'dotenv';
import { router } from "./routes/v1/index.js";

const app = express();

dotEnv.config();
app.use(cors());
app.use(bodyParser.json());

app.use('/v1', router);

const server = app.listen(process.env.PORT, async () => {
    console.log("App listening in", process.env.PORT);
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
process.title = 'zip-server';

process.on('SIGTERM', () => {
    if (server) {
        server.close();
    }
});