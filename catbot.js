//full source for the tutorial this bot is based on is available here: https://medium.com/@renesansz/tutorial-creating-a-simple-discord-bot-9465a2764dc0
//written by Edwin Jones - http://edwinjones.me.uk

//dependencies
const discord = require('discord.io');
const log = require('debug')('catbot')
const request = require('request');
const mongoClient = require('mongodb').MongoClient
const StringBuilder = require('string-builder')

const auth = require('./auth.json'); //you need to make this file yourself!

function onError(bot, channelID) {
    bot.sendMessage(
        {
            to: channelID,
            message: "Sorry, I'm catnapping now. Please ask me later."
        });
}

//Use this function to incremement a stat
function incrementStat(name)
{
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

//Use this function to post a cat fact into the relevant discord channel via the bot object.
function getCatFact(bot, channelID) {
    request('https://polite-catfacts.herokuapp.com/catfact', { json: true }, (err, res, body) => {
        if (err) {
            onError(bot, channelID);
            return;
        }

        bot.sendMessage(
            {
                to: channelID,
                message: body.fact
            });

        incrementStat("catfacts");
        log("catfact command completed");
    });
}

//use this function to get cat pictures and post them in discord
function getCatPic(bot, channelID, userID) {
    request('http://thecatapi.com/api/images/get?format=src', (err, res, body) => {
        if (err) {
            onError(bot, channelID);
            return;
        }

        bot.sendMessage({
            to: channelID,
            embed:
                {
                    color: 4954687, //RGB value cast from hex to int. This is green!
                    image:
                        {
                            url: res.request.href
                        }
                }
        });

        incrementStat("catpics");
        log("catpic command completed");
    });

}

//use this function to stroke catbot!
function stroke(bot, channelID, userID) {
    
    bot.sendMessage(
        {
            to: channelID,
            message: "**puuurrrrrrrrrr!** Thank you <@" + userID + "> **:3**"
        });
    
    incrementStat("catstrokes");
}


//use this function to get stats
function getCatStats(bot, channelID) {

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

// Initialize Discord Bot
var bot = new discord.Client(
    {
        token: auth.token,
        autorun: true
    });

//log when the bot is ready
bot.on('ready', function (evt) {
    log('Connected');
    log('Logged in as: ');
    log(bot.username + ' - (' + bot.id + ')');
});

//handle disconnects by auto reconnecting
bot.on('disconnect', function (erMsg, code) {
    log(`----- Bot disconnected from Discord with code ${code} for reason: ${erMsg} -----`);
    bot.connect();
})

//log when the bot get a message. NOTE: discord supports markdown syntax.
bot.on('message', function (user, userID, channelID, message, evt) {
    // catbot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        log("recieved a command!")

        let args = message.substring(1).split(' ');
        let cmd = args[0];
        args = args.splice(1);

        switch (cmd) {
            // handle commands
            case 'help':
                bot.sendMessage(
                    {
                        to: channelID,
                        message: "You can ask me for a random cat fact with **!catfact**, picture with **!catpic** or you can stroke me with **!stroke** - I do love to be stroked **:3**\n" +
                                 "I can also provide interesting cat fact stats with the **!catstats** command."
                    });

                log("help command executed");
                break;

            case 'catfact':
                getCatFact(bot, channelID);
                log("catfact command executed");
                break;

            case 'catpic':
                getCatPic(bot, channelID);
                log("catpic command executed");
                break;

            case 'stroke':
                stroke(bot, channelID, userID);
                log("stroke command executed");
                break;

            case 'catstats':
                getCatStats(bot, channelID);
                log("catstats command executed");
                break;
        }
    }
});