import Papa from 'papaparse';

const CSV_CONFIG = {
    header: false,
    worker: true,
    delimiter: ",",
}

export const parseCsv = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
          ...CSV_CONFIG,
          complete (results, file) {
            resolve(results.data)
          },
          error (err, file) {
            reject(err)
          }
        })
    })
}
