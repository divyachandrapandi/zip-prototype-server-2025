import express from 'express';
import { rtmController } from '../../controller/rtmContoller.js';
export const rtmRouter = express.Router();

// rtmRouter.post('/generate-pdf', rtmController.generatePDF);
rtmRouter.post('/generate-rtm', rtmController.generateRTM);
// rtmRouter.get('/files/:fileName', rtmController.fetchRTMFile);

rtmRouter.get('/openai/health', rtmController.healthCheck);
rtmRouter.get('/', rtmController.getRtms);
rtmRouter.get('/test', (req, res) => {

    res.send({ message: 'reached login from 5001' });
});


