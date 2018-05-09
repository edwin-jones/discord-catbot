//full source for the tutorial this bot is based on is available here: https://medium.com/@renesansz/tutorial-creating-a-simple-discord-bot-9465a2764dc0
//written by Edwin Jones - http://edwinjones.me.uk

//dependencies
const discord = require('discord.io');
const log = require('debug')('catbot')
import * as request from 'request-promise';

const stats = require('./stats');
const auth = require('./auth.json'); //you need to make this file yourself!

const helpmsg =
    "You can ask me for a random cat fact with **!catfact**, picture with **!catpic** " +
    "or you can stroke me with **!stroke** - " +
    "I do love to be stroked **:3**\n" +
    "I can also provide interesting stats with the **!catstats** command.";


//send a message to discord
function sendMessage(bot: any, channelID: any, message: any) {

    return new Promise((resolve, reject) => {

        bot.sendMessage(
            {
                to: channelID,
                message: message

            }, resolve);
    });
}

//send an image (via a url) to discord
function sendImage(bot: any, channelID: any, url: any) {

    return new Promise((resolve, reject) => {

        bot.sendMessage(
            {
                to: channelID,
                embed:
                    {
                        color: 4954687, //RGB value cast from hex to int. This is green!
                        image:
                            {
                                url: url
                            }
                    }
            }, resolve);
    });
}

//error handler
async function onError(bot: any, channelID: any, err: any) {

    log(`Error: ${err}`);
    await sendMessage(bot, channelID, "Sorry, I'm catnapping now. Please ask me later.");
}

//Use this function to post a cat fact into the relevant discord channel via the bot object.
async function getCatFact(bot: any, channelID: any) {

    var options = {
        method: 'GET',
        uri: 'https://polite-catfacts.herokuapp.com/catfact',
        json: true
    }

    let response = await request(options);

    await sendMessage(bot, channelID, response.fact);
    await stats.incrementStat("catfacts");
    log("catfact command completed");
}

//use this function to get cat pictures and post them in discord
async function getCatPic(bot: any, channelID: any) {

    var include_href = (body: any, response: any, resolveWithFullResponse: any) => {
        return { 'href': response.request.href };
    };

    var options = {
        method: 'GET',
        uri: 'http://thecatapi.com/api/images/get?format=src',
        transform: include_href,
    }

    let response = await request(options);
    await sendImage(bot, channelID, response.href)
    await stats.incrementStat("catpics");

    log("catpic command completed");
}

//use this function to stroke catbot!
async function stroke(bot: any, channelID: any, userID: any) {

    await sendMessage(bot, channelID, "**puuurrrrrrrrrr!** Thank you <@" + userID + "> **:3**");
    await stats.incrementStat("catstrokes");
    log("catstroke command completed");
}

// Initialize Discord Bot
var bot = new discord.Client(
    {
        token: auth.token,
        autorun: true
    });

//log when the bot is ready
bot.on('ready', () => {

    log('Connected');
    log('Logged in as: ');
    log(bot.username + ' - (' + bot.id + ')');
});

//handle disconnects by auto reconnecting
bot.on('disconnect', (erMsg: any, code: any) => {

    log(`----- Bot disconnected from Discord with code ${code} for reason: ${erMsg} -----`);
    bot.connect();
})

//decide what to do when the bot get a message. NOTE: discord supports markdown syntax.
bot.on('message', async (user: any, userID: any, channelID: any, message: any, evt: any) => {

    try {
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
                    await sendMessage(bot, channelID, helpmsg);
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
                    var message = await stats.getStats();
                    await sendMessage(bot, channelID, message);
                    log("catstats command executed");
                    break;
            }
        }
    }
    catch (err) {
        onError(bot, channelID, err);
    }
});