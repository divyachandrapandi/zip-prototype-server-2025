import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotEnv from 'dotenv';
import { router } from "./routes/v1/index.js";

const app = express();

dotEnv.config();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/v1', router);

const port = process.env.PORT || 5000;
const server = app.listen(port, async () => {
    console.log("App listening in", port);
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

// server.on('error', (err) => {
//     console.error('❌ Server error:', err.message);
//     if (err.code === 'EADDRINUSE') {
//         console.error(`Port ${ process.env.PORT} is already in use. Try a different port.`);
//     }
// });