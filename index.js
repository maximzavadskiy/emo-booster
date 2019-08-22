/**
 * A Bot for Slack!
 */


/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

var globalBot = null

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say("Hi & nice to meet you! I am EmoBond, bot that makes your messages fun & sometimes more precise")
                convo.say("Invite me to your channels & I will be make it super-easy to add emojis to your messages. No more :blablabla: typying.")
                // convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}



/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGO_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGO_URI}),
    };
} else {
    config = {
        json_file_store: ((process.env.TOKEN)?'./db_slack_bot_ci/':'./db_slack_bot_a/'), //use a different name if an app or CI
    };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //Treat this as a custom integration
    var customIntegration = require('./lib/custom_integrations');
    var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    var controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    //Treat this as an app
    var app = require('./lib/apps');
    var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    process.exit(1);
}


/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
    globalBot=bot
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});

/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!
var axios = require('axios')
var moment = require('moment')
var _ = require('lodash')
var access_token = process.env.AUTH_TOKEN
// var mongoPass = process.env.MONGO_PASS


controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "Thanks for invite! From time to time I will be offering some emojis based on what you type.")
});

// controller.hears(['what'], [ 'ambient'] , function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'confused',
//    }, function (error) {
//        if (err) {
//            console.log(err)
//        }
//    });
// });

// controller.hears(['yes'], [ 'ambient'] , function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'smile',
//    }, function (error) {
//        if (err) {
//            console.log(err)
//        }
//    });
// });

// controller.hears(['sorry'], [ 'ambient'] , function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'expressionless',
//    }, function (error) {
//        if (err) {
//            console.log(err)
//        }
//    });
// });



controller.hears('', [ 'ambient'] , function (bot, message) {
    // Add 50 emojis, 5 emojis to choose
    // cool
    // good job
    // great

   var emojisPairs = [
        // ["you", "bow"],
        ["need", "bulb"],
        ["$", "dollar"],
        ["really", "confetti_ball"],
        // ["i","sunglasses"],
        ["cool", "sunglasses"],
        ["great", "raised_hands"],
        ["job", "muscle"],
        ["but","face_with_raised_eyebrow"],
        ["not","woman-gesturing-no"],
        ["we","hugging_face"],
        ["we","hugging_face"],
        ["lets","star-struck"],
        ["let's","star-struck"],
        ["can", "muscle"],
        ["like", "+1"],
        ["need", "pray"],
        ["if", "smirk"],
        ["meeting", "handshake"],
        ["yes,", "star-struck"],
        ["sorry", "slightly_frowning_face"],
        ["together", "handshake"]
   ];

    const emojisToAdd = _.map(
        _.filter(emojisPairs, (emojiPair) => _.includes(_.toLower(message.text), emojiPair[0])),
        "[1]"
    )
    debugger;
    if(!_.isEmpty(emojisToAdd)) {
        const getContent = (emojis, message) => ({
        // "response_type": "in_channel",
        response_type: "ephemeral",
        attachments: [
            {
                title: 'Add emojis',
                callback_id: '123',
                attachment_type: 'default',
                actions: _.map(emojis, (emoji) => ({
                        "name": `${emoji}`,
                        "text": `:${emoji}:`,
                        "value": `${message.ts},${message.channel}`,
                        "type": "button",
                }))
                
            }
        ]

      })

        bot.reply(message, getContent(emojisToAdd, message))

    }
   
});

controller.on('interactive_message_callback', function(bot, message) {
    const messageInfoPair = message.actions[0].value.split(",")

    bot.api.reactions.add({
               timestamp: messageInfoPair[0],
               channel: messageInfoPair[1],
               name:  message.actions[0].name,
    }, function (err) {
       if (err) {
           console.log(err)
       }
    });

    // debugger;
    bot.api.chat.delete({
        ts: message.message_ts,
        channel: messageInfoPair[1]
    }, function (err) {
       if (err) {
           console.log(err)
       }
    })

})

    // check message.actions and message.callback_id to see what action to take...




   // emojisPairs.forEach((emojiPair) => {
   //      // TODO split in words
   //      debugger;
   //      if(_.includes(_.toLower(message.text), emojiPair[0])) {
   //          bot.api.reactions.add({
   //             timestamp: message.ts,
   //             channel: message.channel,
   //             name: emojiPair[1],
   //          }, function (err) {
   //             if (err) {
   //                 console.log(err)
   //             }
   //          });
   //      }
   // })