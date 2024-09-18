import request from 'supertest';
import express from 'express';
import meterRouter from '../meter.route';
import meterController from '../../controllers/meter.controller';

jest.mock('../../controllers/meter.controller');

const app = express();
app.use(express.json());
app.use('/meters', meterRouter);

describe('Meter Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /meters should return all meters', async () => {
    (meterController.getAll as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ message: 'All meters' });
    });

    const response = await request(app).get('/meters');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'All meters' });
    expect(meterController.getAll).toHaveBeenCalledTimes(1);
  });

  it('POST /meters/upload should handle file upload', async () => {
    (meterController.upload as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ message: 'File uploaded' });
    });

    const response = await request(app)
      .post('/meters/upload')
      .attach('file', Buffer.from('test file content'), 'testfile.txt');  // Simulating file upload

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'File uploaded' });
    expect(meterController.upload).toHaveBeenCalledTimes(1);
  });
});