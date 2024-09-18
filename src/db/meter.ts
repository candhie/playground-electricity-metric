import pgFormat from "pg-format";
import { pool } from "../config/db";
import { Meter } from "@models/meter";

const selectAll = (): Promise<Meter[]> => {
    return new Promise((resolve, reject) => {
        pool.connect((err, client, done) => {
            if (err) {
                return reject(err);
            }
            client.query('SELECT * FROM meter_readings', (error, results: {
                rows: Meter[]
            }) => {
                // connection release
                if (error) {
                    return reject(error);
                }
                return resolve(results.rows);
            })
            done()
        })
    });
};

const singleCreate = (nmi, timestamp, consumption): Promise<Meter> => {
    return new Promise((resolve, reject) => {
        pool.connect((err, client, done) => {
            if (err) {
                return reject(err);
            }
            const sqlQuery = pgFormat('INSERT INTO meter_readings(nmi, timestamp, consumption) VALUES (%L, %L, %s)', nmi, timestamp, consumption);            
            client.query(sqlQuery, (error, results: {
                rows: Meter[]
            }) => {
                if (error) {
                    return reject(error);
                }
                return resolve(results.rows[0]);
            })
            done()
        })
    });
};

const bulkCreate = (values): Promise<Meter> => {
    return new Promise((resolve, reject) => {
        pool.connect((err, client, done) => {
            if (err) {
                return reject(err);
            }
            const insertedValues = values.map(([nmi, time, consumption]) => pgFormat('(%L, %L, %s)', nmi, time, consumption)).join(',')
            const sqlQuery = pgFormat('INSERT INTO meter_readings(nmi, timestamp, consumption) VALUES %s', insertedValues);            
            client.query(sqlQuery, (error, results: {
                rows: Meter[]
            }) => {
                if (error) {
                    return reject(error);
                }
                return resolve(results.rows[0]);
            })
            done()
        })
    });
};


export default { selectAll, singleCreate, bulkCreate };