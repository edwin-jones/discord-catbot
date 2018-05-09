// Written by Edwin Jones - http://edwinjones.me.uk
// Documentation and Discord.js integration by Jason Browne - https://jbrowne.io

'use strict';

//dependencies
const log = require('debug')('stats');
const client = require('mongodb').MongoClient;
const StringBuilder = require('string-builder');

const auth = require('./auth.json'); //you need to make this file yourself!

const dbName = 'catbot';
const collectionName = 'catstats';


/**
 * Use this function to incremement a stat
 *
 * @param name the stat to increment
 * @returns a Promise that resolves on success, or rejects on failure
 */
exports.incrementStat = (name) => {

    return new Promise((resolve, reject) => {

        client.connect(auth.mongourl, function (err, client) {

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
            );

            client.close();

            log(`incremented stat ${name} successfully`);

            resolve();
        });
    });
}

/**
 * Use this function to get stats
 *
 * @returns a promise of a string (to send to chat)
 */
exports.getStats = () => {

    return new Promise((resolve, reject) => {

        client.connect(auth.mongourl, function (err, client) {

            if (err) {
                log("failed to connect to mongodb: " + err);
                reject(err);
                return;
            }

            log("connected to mongodb");

            let database = client.db(dbName);
            let catstats = database.collection(collectionName);

            var sb = new StringBuilder();
            catstats.find({}).toArray(function (err, result) {

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