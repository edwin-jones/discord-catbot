//dependencies
const log = require('debug')('stats')
const mongoClient = require('mongodb').MongoClient
const StringBuilder = require('string-builder')

const auth = require('./auth.json'); //you need to make this file yourself!


//Use this function to incremement a stat
exports.incrementStat = (name) => {

    mongoClient.connect(auth.mongourl, function(err, database) {
    
        if (err)
        {
            log("failed to connect to mongodb with error: " + err);
            return;
        }

        log("connected to mongodb");
        
        let connection = database.db('catbot');
        let catstats = connection.collection('catstats');

        catstats.update(
            { name: name },
            { $inc: { count: 1 } }
        )
    
        database.close();

        log(`incremented stat ${name} successfully`);

  });  
}



//use this function to get stats
exports.getCatStats = (bot, channelID) => {

    mongoClient.connect(auth.mongourl, function(err, database) {
    
        if (err)
        {
            log("failed to connect to mongodb with error: " + err);
            return;
        }

        log("connected to mongodb");
        
        let connection = database.db('catbot');
        let catstats = connection.collection('catstats');

        catstats.find({}).toArray(function(err, result) {
            if (err) throw err;

            var sb = new StringBuilder();
            sb.appendLine("So far I have:")

            for(var i in result)
            {
                sb.appendLine(`\t${result[i].prefix} **${result[i].count}** ${result[i].suffix}`);  
            }

            bot.sendMessage(
                {
                    to: channelID,
                    message: sb.toString()
                });
            
          });

        database.close();
    });  
}


