import express from 'express';

import { rtmRouter } from './rtmRouter.js';
import notificationRouter from './notificationRouter.js';
import requirementsRouter from './requirementsRouter.js';
import projectRouter from './projectRouter.js';
import projectTimelineRouter from './projectTimelineRouter.js';

export const router = express.Router();

const defaultTypes = [
    {
        path: '/rtm',
        route: rtmRouter
    },
    {
        path: '/notifications',
        route: notificationRouter
    },
    {
        path: '/requirements',
        route: requirementsRouter
    },
    {
        path: '/projects',
        route: projectRouter
    },
    {
        path: '/project-timelines',
        route: projectTimelineRouter
    }
];

defaultTypes.forEach(({ path, route }) => {
    router.use(path, route);
});