import * as csv from 'csvtojson';

const streamToString = async (stream: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        const chunks: any = [];
        stream.on("data", (chunk: any) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        stream.on("error", (error: any) => reject(error));
    });
}

const convertCsvBufferToJson = async (csvContent: string): Promise<any[]> => {
    const jsonArray = await csv().fromString(csvContent);
    try {
        return jsonArray;
    } catch (error) {
        throw new Error(`Error converting CSV to JSON: ${error.message}`);
    }
}

const sleep = async (seconds: number) => {
    const milliseconds = seconds * 1000;
    await new Promise(resolve => setTimeout(resolve, milliseconds));
};

export const utils = {
    streamToString,
    convertCsvBufferToJson,
    sleep
}