import { Router } from 'express';
import multer from 'multer';
import meterController from '../controllers/meter.controller';

const meterRouter = Router();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

meterRouter.get('/', meterController.getAll);
meterRouter.post('/upload', upload.single('file'), meterController.upload);

export default meterRouter;