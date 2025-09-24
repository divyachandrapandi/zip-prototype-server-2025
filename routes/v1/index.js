import express from 'express';

import { rtmRouter } from './rtmRouter.js';

export const router = express.Router();

const defaultTypes = [
    {
        path: '/rtm',
        route: rtmRouter
    }
];

defaultTypes.forEach(({ path, route }) => {
    router.use(path, route);
});