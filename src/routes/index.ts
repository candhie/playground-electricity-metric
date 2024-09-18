import { Router } from 'express';
import meterRouter from './meter.route';

const routes = Router();

routes.use('/meters', meterRouter);

export default routes;
