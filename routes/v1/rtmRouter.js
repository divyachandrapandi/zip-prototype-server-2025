import express from 'express';
import * as rtmController  from '../../controller/rtmContoller.js';

export const rtmRouter = express.Router();

rtmRouter.post('/generate-pdf', rtmController.generatePDF);
rtmRouter.get('/', rtmController.getRtms);
rtmRouter.get('/test', (req, res) => {

    res.send({ message: 'reached login from 5001' });
});


