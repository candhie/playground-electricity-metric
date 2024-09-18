import { Request, Response } from 'express';
import dayjs from 'dayjs';
import _ from 'lodash';
import utc from "dayjs/plugin/utc";
import meter from '../db/meter';
import { Readable } from 'stream';
import { parseCsv } from '../utils';

dayjs.extend(utc)

const CHUNK_LIMIT = 50
const getAll = (_req: Request, res: Response) => {
    meter.selectAll().then((meters) => {
        res.status(200).send({
            message: 'Success',
            data: meters
        })
    }).catch(err => {
        res.status(500).send({
            message: 'DATABASE ERROR',
            error: err.code
        })
    })
};

const upload =  async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({
            message: 'No file uploaded'
        })
    }
    try {
        const queryValues = [];
        let currentNmi;
        let intLength = 30;
        let totalLength = 0;
        const stream = Readable.from(req.file.buffer);
        const parsedData = await parseCsv(stream);
        if (!(parsedData as unknown[]).length) {
            res.status(422).json({
                message: 'There is no data. Please follow blocking cycle standard.'
            })
        }
        if (parsedData[0][0] !== '100') {
            res.status(422).json({
                message: 'There is no header. Please follow blocking cycle standard.'
            })
        }
        if ((parsedData as unknown[]).length < 500) {
            for(let index = 0; index < (parsedData as unknown[]).length; index++) {
                const [code, ...rest] = parsedData[index];
                if (code === '200') {
                    const [nmi,,,,,,,intervalLength] = rest;
                    intLength = intervalLength;
                    totalLength = 1440/intLength;
                    currentNmi = nmi
                } else if (code === '300' && currentNmi) {
                    const [intervalDate, ...consumptions] = rest;
                    let baseDate = dayjs(`${intervalDate}`)
                    for (let interval = 0; interval < totalLength; interval++) {
                        if (consumptions[interval] < 0) {
                            res.status(422).json({
                                message: 'Consumption can not be less than zero. Please follow blocking cycle standard.'
                            })
                        }
                        if (interval !== 0) {
                            baseDate = baseDate.add(intLength, 'minute');
                        }
                        queryValues.push(
                            meter.singleCreate(
                                currentNmi,
                                baseDate.format('YYYY-MM-DD HH:mm'),
                                consumptions[interval]
                            )
                        );                         
                    }
                }
            }
            if (queryValues.length) {
                await Promise.all(queryValues)   
            }
        } else {
            let chunkValues = [];
            let countChunk = 0;
            for(let index = 0; index < (parsedData as unknown[]).length; index++) {
                const [code, ...rest] = parsedData[index];
                if (code === '200') {
                    if (countChunk === CHUNK_LIMIT) {
                        countChunk = 0;
                        queryValues.push(chunkValues)
                        chunkValues = [];
                    }
                    const [nmi,,,,,,,intervalLength] = rest;
                    intLength = intervalLength;
                    totalLength = 1440 / intLength
                    countChunk++
                    currentNmi = nmi;
                } else if (code === '300' && currentNmi) {
                    const [intervalDate, ...consumptions] = rest;
                    let baseDate = dayjs(`${intervalDate}`)
                    for (let interval = 0; interval < totalLength; interval++) {
                        if (consumptions[interval] < 0) {
                            res.status(422).json({
                                message: 'Consumption can not be less than zero. Please follow blocking cycle standard.'
                            })
                        }
                        if (interval !== 0) {
                            baseDate = baseDate.add(intLength, 'minute');
                        }
                        chunkValues.push(
                            [
                                currentNmi,
                                baseDate.format('YYYY-MM-DD HH:mm'),
                                consumptions[interval]
                            ]
                        );                      
                    }
                }
            }
            if (chunkValues.length) {
                queryValues.push(chunkValues)
                chunkValues = []
            }

            const queries = queryValues.map(meter.bulkCreate)
            await Promise.all(queries);
        }
        res.status(200).json({
            message: 'File successfully uploaded!',
            fileName: req.file.originalname
        })
    } catch (error) {
        res.status(500).json({
            message: `Please re-upload. Server error : ${error}`,
        })
    }
    
}

export default { getAll, upload };
