import express from 'express';
import { rtmController } from '../../controller/rtmContoller.js';

export const rtmRouter = express.Router();

rtmRouter.post('/generate-pdf', rtmController.generatePDF);
rtmRouter.get('/test', (req, res) => {

    res.send({ message: 'reached login from 5001' });
});


