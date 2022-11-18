// Written by Edwin Jones - http://edwinjones.me.uk
// Documentation and Discord.js integration by Jason Browne - https://jbrowne.io

'use strict';

//dependencies
const discord = require('discord.js');
const request = require('request-promise');
const facts = require('./facts.json');
const auth = require('./auth.json'); //you need to make this file yourself!

const helpmsg =
    "You can ask me for a random cat fact with **!catfact**, picture with **!catpic** " +
    "or you can stroke me with **!stroke** - " +
    "I do love to be stroked **:3**";


/**
 * Error handler
 *
 * @param channel the text channel to send the message to
 * @param err the error message to log
 */
async function onError(channel, err) {

    console.log(err);
    await channel.send("Sorry, I'm catnapping now. Please ask me later.");
}

/**
 * Sends an image (via a url) to discord
 *
 * @param channel the text channel to send the message to
 * @param url the url of the image
 */
function sendImage(channel, url) {

    return channel.send({

        embed: {

            color: 4954687, //RGB value cast from hex to int. This is green!
            image: { url }
        }
    });
}

/**
 * Use this function to post a cat fact into the relevant discord channel
 *
 * @param channel the text channel to send the message to
 */
async function getCatFact(channel) {

    const index = Math.floor(Math.random() * facts.length);
    let fact = facts[index];

    await channel.send(fact);
    console.log("catfact command completed");
}

/**
 * Use this function to get cat pictures and post them into the relevant discord channel
 *
 * @param channel the channel to send the image to
 */
async function getCatPic(channel) {

    var include_href = function (_, response, __) {

        return { 'href': response.request.href };
    };

    var options = {

        method: 'GET',
        uri: 'http://thecatapi.com/api/images/get?format=src',
        transform: include_href,
    }

    let response = await request(options);
    await sendImage(channel, response.href);

    console.log("catpic command completed");
}

/**
 * Use this function to stroke catbot!
 *
 * @param channel the channel to send the image to
 * @param userID the user ID of the person who stroked catbot
 */
async function stroke(channel, userID) {

    await channel.send(`**puuurrrrrrrrrr!** Thank you <@${userID}> **:3**`);
    console.log("catstroke command completed");
}

// Initialize Discord Bot
var bot = new discord.Client();

//log when the bot is ready
bot.on('ready', (evt) => {

    console.log('connected');
    console.log('logged in as: ');
    console.log(`${bot.user.username} - (${bot.user.id})`);
});

// Decide what to do when the bot get a message. NOTE: discord supports markdown syntax.
bot.on('message', async (message) => {

    console.log("recieved a message");
    try {

        // catbot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        if (message.content.substring(0, 1) == '!') {

            console.log('recieved a command!')

            let args = message.content.substring(1).split(' ');
            let cmd = args[0];
            args = args.splice(1);

            switch (cmd) {

                // handle commands
                case 'help':
                    await message.channel.send(helpmsg);
                    console.log("help command executed");
                    break;

                case 'catfact':
                    await getCatFact(message.channel);
                    console.log("catfact command executed");
                    break;

                case 'catpic':
                    await getCatPic(message.channel);
                    console.log("catpic command executed");
                    break;

                case 'stroke':
                    await stroke(message.channel, message.author.id);
                    console.log("stroke command executed");
                    break;
            }
        }
    }
    catch (err) {

        onError(message.channel, err);
    }
});

bot.login(auth.token);
