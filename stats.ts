// Written by Edwin Jones - http://edwinjones.me.uk
// Initial port to TypeScript by Jason Browne - https://jbrowne.io

// Dependencies
const log = require('debug')('stats');
import { MongoClient, MongoError } from 'mongodb';
const StringBuilder = require('string-builder');

const auth = require('./auth.json'); // you need to make this file yourself!

const dbName = 'catbot';
const collectionName = 'catstats';
const client = new MongoClient(auth.mongourl);

/**
 * Use this function to incremement a stat
 *
 * @param name the stat to increment
 * @returns a Promise that resolves on success, or rejects on failure
 */
export function incrementStat(name: string): Promise<void> {

    return new Promise((resolve, reject) => {

        client.connect((err: MongoError, client: MongoClient) => {

            if (err) {
                log("failed to connect to mongodb: " + err);
                reject(err);
                return;
            }

            log("connected to mongodb");

            let database = client.db(dbName);
            let catstats = database.collection(collectionName);

            catstats.updateOne(
                { name: name },
                { $inc: { count: 1 } }
            ).then(() => {
                log(`incremented stat ${name} successfully`);
                client.close(); // Promise.finally is not yet part of the spec
                resolve();
            }).catch((err: any) => {
                client.close(); // Promise.finally is not yet part of the spec
                reject(err);
            });
        });
    });
}

/**
 * Use this function to get stats
 *
 * @returns a promise of a string (to send to chat)
 */
export function getStats(): Promise<string> {

    return new Promise((resolve, reject) => {

        client.connect((err: MongoError, client: MongoClient) => {

            if (err) {
                log("failed to connect to mongodb: " + err);
                reject(err);
                return;
            }

            log("connected to mongodb");

            let database = client.db(dbName);
            let catstats = database.collection(collectionName);

            var sb = new StringBuilder();
            catstats.find().toArray((err: MongoError, result: any[]) => {

                if (err) {
                    log("failed to find documents: " + err);
                    reject(err);
                    return;
                }

                sb.appendLine("So far I have:")

                for (var i in result) {
                    sb.appendLine(`\t${result[i].prefix} **${result[i].count}** ${result[i].suffix}`);
                }

                resolve(sb.toString());
            });

            client.close();
        });
    });
}