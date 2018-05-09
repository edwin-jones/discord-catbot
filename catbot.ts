// Full source for the tutorial this bot is based on is available here:
// https://medium.com/@renesansz/tutorial-creating-a-simple-discord-bot-9465a2764dc0
// Written by Edwin Jones - http://edwinjones.me.uk
// Initial port to TypeScript by Jason Browne - https://jbrowne.io

// Dependencies
import * as discord from 'discord.js';
const log = require('debug')('catbot')
import * as request from 'request-promise';

import * as stats from './stats';
const auth = require('./auth.json'); // you need to make this file yourself!

const helpmsg =
    "You can ask me for a random cat fact with **!catfact**, picture with **!catpic** " +
    "or you can stroke me with **!stroke** - " +
    "I do love to be stroked **:3**\n" +
    "I can also provide interesting stats with the **!catstats** command.";


/**
 * Sends a message to discord
 *
 * @param bot the client this bot is connected with
 * @param channel the text channel to send the message to
 * @param message the message to send
 */
function sendMessage(bot: discord.Client, channel: discord.TextChannel, message: string) {
    return channel.send(message);
}

/**
 * Sends an image (via a url) to discord
 *
 * @param bot the client this bot is connected with
 * @param channel the text channel to send the message to
 * @param url the url of the image
 */
function sendImage(bot: discord.Client, channel: discord.TextChannel, url: string) {
    return channel.sendEmbed({
        color: 4954687, //RGB value cast from hex to int. This is green!
        image: { url }
    });
}

/**
 * Error handler
 *
 * @param bot the client this bot is connected with
 * @param channel the text channel to send the message to
 * @param err the error message to log
 */
async function onError(bot: discord.Client, channel: discord.TextChannel, err: any) {
    log(`Error: ${err}`);
    await sendMessage(bot, channel, 'Sorry, I\'m catnapping now. Please ask me later.');
}

/**
 * Use this function to post a cat fact into the relevant discord channel
 *
 * @param bot the client this bot is connected with
 * @param channel the text channel to send the message to
 */
async function getCatFact(bot: discord.Client, channel: discord.TextChannel) {
    var options = {
        method: 'GET',
        uri: 'https://polite-catfacts.herokuapp.com/catfact',
        json: true
    }

    let response = await request(options);

    await sendMessage(bot, channel, response.fact);
    await stats.incrementStat('catfacts');
    log('catfact command completed');
}

/**
 * Use this function to get cat pictures and post them into the relevant discord channel
 *
 * @param bot the client this bot is connected with
 * @param channel the channel to send the image to
 */
async function getCatPic(bot: discord.Client, channel: discord.TextChannel) {
    // Blindly typing as `any` to prevent excess imports
    var include_href = (body: any, response: any, resolveWithFullResponse: boolean) => {
        return { 'href': response.request.href };
    };

    var options = {
        method: 'GET',
        uri: 'http://thecatapi.com/api/images/get?format=src',
        transform: include_href,
    }

    let response = await request(options);
    await sendImage(bot, channel, response.href)
    await stats.incrementStat('catpics');

    log('catpic command completed');
}

/**
 * Use this function to stroke catbot!
 *
 * @param bot the client this bot is connected with
 * @param channel the channel to send the image to
 * @param userID the user ID of the oerson who stroked catbot
 */
async function stroke(bot: discord.Client, channel: discord.TextChannel, userID: discord.Snowflake) {
    await sendMessage(bot, channel, `**puuurrrrrrrrrr!** Thank you <@${userID}> **:3**`);
    await stats.incrementStat('catstrokes');
    log('catstroke command completed');
}

// Initialize Discord Bot
var bot = new discord.Client();

// Log when the bot is ready
bot.on('ready', () => {
    log('Connected');
    log('Logged in as: ');
    log(`${bot.user.username} - (${bot.user.id})`);
});

// Handle disconnects by auto reconnecting
bot.on('disconnect', (erMsg: any, code: any) => {
    log(`----- Bot disconnected from Discord with code ${code} for reason: ${erMsg} -----`);
    bot.login();
})

// Decide what to do when the bot get a message. NOTE: discord supports markdown syntax.
bot.on('message', async (message: discord.Message) => {

    // I'd like to be able to remove this limitation, but TextBasedChannel (the
    // base channel class for text channels) is not exported in the typings
    if (message.channel.type !== 'text') {
        log('Not a text channel');
        return;
    }
  
    const typedChannel = message.channel as discord.TextChannel;

    try {
        // catbot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        if (message.content.substring(0, 1) == '!') {
            log('recieved a command!')

            let args = message.content.substring(1).split(' ');
            let cmd = args[0];
            args = args.splice(1);

            switch (cmd) {
                // handle commands
                case 'help':
                    await sendMessage(bot, typedChannel, helpmsg);
                    log("help command executed");
                    break;

                case 'catfact':
                    getCatFact(bot, typedChannel);
                    log("catfact command executed");
                    break;

                case 'catpic':
                    getCatPic(bot, typedChannel);
                    log("catpic command executed");
                    break;

                case 'stroke':
                    stroke(bot, typedChannel, message.author.id);
                    log("stroke command executed");
                    break;

                case 'catstats':
                    var statsText = await stats.getStats();
                    await sendMessage(bot, typedChannel, statsText);
                    log("catstats command executed");
                    break;
            }
        }
    }
    catch (err) {
        onError(bot, typedChannel, err);
    }
});

bot.login(auth.token);
