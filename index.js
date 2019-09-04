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
                convo.say("Invite me to your channels & I will automatically add emojis as reactions to your messages. No more :blablabla: typying.")
                convo.say("If you have any feedback to creators just write to me here & I will forward it!")
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
    console.log(`INVITE ${JSON.stringify(message)}`);
    bot.reply(message, "Thanks for invite! From time to time I will be adding some emojis as reactions based on what you type.")
});

controller.on('reaction_added',function(bot, event) {
   console.log(`REACTED ${JSON.stringify(event)}`)
});

controller.hears(
    '',
    ['direct_message'],
    function(bot,message) {
        console.log(`DIRECT_MESSAGE '${message.text}' ${JSON.stringify(message)}`)
    }
);

const lastMessageTs = {};
const lastMessageText = {};
controller.hears('', [ 'ambient'] , function (bot, message) {

    if(lastMessageText[message.user] === message.text && lastMessageTs[message.user] === message.ts ) {
        console.log('Dublicate caught: ', message.text, message.user)
        return
    }
    lastMessageText[message.user] = message.text
    lastMessageTs[message.user] = message.ts

   var emojisPairs = [
        // POSITIVE FEELINGS
        ["cool", "sunglasses"],

        ["great", "raised_hands"],
        ["great", "muscle"],
        ["amazing", "star-struck"],
        ["amazing", "muscle"],
        ["amazing", "raised_hands"],
        ["best", "grin"],
        ["laugh", "grin"],
        ["happy", "grin"],
        ["well", "simple_smile"],
        ["well", "raised_hands"],
        ["nice", "raised_hands"],
        ["beautiful", "raised_hands"],
        ["beautiful", "sunflower"],

        // SYMBOLS performance - stop
        ["job", "muscle"],
        ["engine", "racing_motorcycle"],
        ["news", "trumpet"],
        ["meeting", "handshake"],
        ["together", "handshake"],
        ["$", "money_mouth_face"],
        ["dagger", "dagger_knife"],
        ["feedback", "dagger_knife"],

        // POWER WORDS
        ["omg", "man-facepalming"],
        ["super", "man-facepalming"],
        ["omg", "heart_eyes"],
        ["super", "heart_eyes"],

        // NEGATIVE FEELINGS
        ["need", "pray"],
        ["sorry", "slightly_frowning_face"],
        ["cry", "cry"],
        ["sad", "cry"],
        ["hard", "sweat"],
        ["hard", "sweat_drops"],
        ["shit", "shit"],
        ["shit", "cry"],
        ["shit", "man-facepalming"],
        ["fuck", "shit"],
        ["fuck", "cry"],
        ["fuck", "man-facepalming"],

        // AFTERWORK
        ["celebration", "champagne"],
        ["celebration", "raised_hands"],
        ["celebration", "wine_glass"],
        ["celebration", "wine_glass"],  
        ["celebration", "tada"],  
        ["party", "champagne"],  
        ["party", "beer"],  
        ["party", "wine_glass"],  
        ["drink", "beer"],  
        ["drink", "potable_water"],  
        ["drink", "champagne"],  
        ["lunch", "bowl_with_spoon"],
        ["lunch", "chopsticks"],
        ["lunch", "hatching_chick"],
        ["lunch", "tongue"],
        ["hungry", "bowl_with_spoon"],
        ["hungry", "chopsticks"],
        ["hungry", "hatching_chick"],
        ["hungry", "tongue"],
        ["let's go", "woman-running"],
        ["let's go", "timer_clock"],
        ["lets go", "woman-running"],
        ["lets go", "timer_clock"],

        
        // HOME weekend, sleep, vacation
        ["home", "house"],

        
   ];

    const emojisToAdd = _.map(
        _.filter(emojisPairs, (emojiPair) => _.includes(_.toLower(message.text), emojiPair[0])),
        "[1]"
    )

    if(!_.isEmpty(emojisToAdd)) {
        console.log(`OFFER ${JSON.stringify(message)} EMOJIS ${JSON.stringify(emojisToAdd)} ${bot.team_info.domain} `)

        // _.map(emojisToAdd, (emoji) => {
        //     bot.api.reactions.add({
        //                timestamp: message.ts,
        //                channel: message.channel,
        //                name:  emoji,
        //     }, function (err) {
        //        if (err) {
        //            console.log(err)
        //        } 
        //     });
        // })

        // debugger;
        // bot.api.chat.postEphemeral({
        //     channel: message.channel,
        //     text: 'are you sure?',
        //     user: message.user
        // }, function (err) {
        //        if (err) {
        //            console.log(err)
        //        } 
        // });

        const getContent = (emojis, message) => (
                [
                    {
                        title: 'Add emojis',
                        callback_id: '123',
                        attachment_type: 'default',
                        actions: _.map([].concat(emojis).concat("Close"), (emoji) => ({
                                "name": `${emoji}`,
                                "text": `:${emoji}:`,
                                "value": JSON.stringify(message),
                                "type": "button",
                        }))
                        
                    }
                ]

        )


        // bot.reply(message, getContent(emojisToAdd, message))
        debugger    
        bot.api.callAPI('chat.postEphemeral', {
            channel: message.channel,
            user: message.user,
             // attachments: JSON.stringify([{"pretext": "pre-hello", "text": "text-world"}])
            attachments: JSON.stringify(getContent(emojisToAdd, message)),
        }, (e, desc) => {
            if(e) {
                console.log('error occured', e, desc)
            }
        })
    }
   
});


controller.on('interactive_message_callback', function(bot, message) {
    const originalMessage = JSON.parse(message.actions[0].value)

    console.log(`ADD ${JSON.stringify(message)}`)

    const offerAuthorize = () => bot.reply(message, `Seems you have not authorized me to add emojis. Go to ${process.env.AUTH_URL} and lets try again after that`)

    if(message.actions[0].name != "Close") {
        bot.botkit.storage.users.get(message.user).then((userInfo ) =>{
            bot.api.chat.update({
                       ts: originalMessage.ts,
                       channel: originalMessage.channel,
                       text: originalMessage.text + ` :${message.actions[0].name}:`,
                       token: userInfo.access_token
            }, function (err, err2) {
                
               if (err) {
                   console.log('Error adding emoji', JSON.stringify(err), err2)
                   offerAuthorize();
               } else {
                    console.log("ADDED EMOJI")
               }
            });
        }).catch((e) => {
            console.log('ERROR while adding emoji', e)
            offerAuthorize();
        })
    }


    bot.replyInteractive(message, {
        'response_type': 'ephemeral',
        'text': '',
        'replace_original': true,
        'delete_original': true
    }, function (err, desc) {
       if (err) {
           console.log('Error removing bots message', err, desc)
       }
    })

})

controller.webserver.get('/message',  (req, res) => {
        // var bot = globalBot
        const teamId = req.query.team_id
        const userId = req.query.user_id // UMHSQDM1B, eric UMT68EZ5F
        // const channelId = 'DMBQP3FFB'
        const bot = controller.spawn(teamId)

        bot.botkit.storage.teams.get(teamId).then((teamInfo ) =>{
            // bot.api.chat.update({
            //            ts: originalMessage.ts,
            //            channel: originalMessage.channel,
            //            text: originalMessage.text + ` :${message.actions[0].name}:`,
            //            token: userInfo.access_token

            //        })
            debugger;
            bot.api.callAPI('chat.postMessage', {
                token: teamInfo.bot.token,
                channel: userId,
                user: userId,
                as_user: true, 
                text: "Hello from /message",
            }, (e, desc) => {
                if(e) {
                    console.log('Error occured', e, desc)
                }
            })
        }).catch((e) => {
            console.log('ERROR ', e)
        })

        // bot.startPrivateConversation(userId, function(err, bot) {
        //     debugger
        //     console.log('SPAWNED bot for team', teamId, 'error: ', err, bot)
        // })

        // // console.log('Check bot', bot, globalBot)
        // var channelsMsgs = null;

        // axios
        // .get('https://slack.com/api/conversations.list?token='+ access_token + '&channel=public_channel,private_channel,mpim,im')
        // .then((data,err) => {
        //     var startTime = moment().subtract(1,'days').startOf('day').add(9, 'hours').unix()

        //     const msgsRequests = _.map(_.get(data, 'data.channels'), (channel) => 
        //             axios.get('https://slack.com/api/conversations.history', {
        //                 params: {
        //                     token: access_token,
        //                     channel: channel.id,
        //                     oldest: startTime,
        //                     limit: 1000,
        //                     _channelData: {
        //                         data: channel
        //                     }
        //                 }, 
        //         }))
        //     return Promise.all(msgsRequests)
        // })
        // .then( (_channelsMsgs) => {
        //     const messagesToSave = _.flatten(_.map(_channelsMsgs, (channel) => _.map(channel.data.messages, (message) => _.assign({}, message, {channel: channel.config.params._channelData.data.id}))))
        //     channelsMsgs = _channelsMsgs
        //     Messages.create(messagesToSave, function (err) {
        //       console.log(`Saved ${messagesToSave.length} messages to the DB with possible err`, err )
        //     });
        //     debugger

        //     return axios
        //     .get('https://slack.com/api/users.list?token='+access_token)
        // })
        // .then((users) => {
        //     // console.log(users.data)
        //     _.map(users.data.members, ({id: userId}) => {
        //         const stats = _.map(channelsMsgs, (channel) => _.assign( {}, channelStats(channel.data, userId), {channel: channel.config.params._channelData.data}))
        //         const topChannelStats = _
        //         .chain(stats)
        //         .filter((stat) => stat.userCharacters > 50 && stat.groupSize > 1 )
        //         .sortBy('userCharacters')
        //         .takeRight(3 )
        //         .reverse()
        //         .value()
                
        //         bot.startPrivateConversation({user: userId}, function (err, convo) {
        //             if (err) {
        //                 console.log(err);
        //             } else {
        //                 if (!_.isEmpty(topChannelStats)) {
        //                     var report = 
        //                     'Happy to notice you were using slack yesterday! Your most used channels were: '+ _.map(topChannelStats, 'channel.name').join(', ') + '\n' +
        //                     'I collected some insights for those channels - \n\n' +
        //                     _.map(topChannelStats, (channelStats) => reportAirTime(channelStats, {bot, user: userId, convo})).join('\n\n')
        //                     + `\n\n Not happy with what the bot says? <https://etceducation.typeform.com/to/i9ZRER?user_id=${userId}|Report message/bot>`;
        //                     convo.say(report)
        //                 }
        //             }
        //          });
        //     })
        // }) 
        // .catch((error)  => {
        //     console.log('Error occured ' +  error); 
        //     bot.reply('Error occured ' +  error)
        // })


    res.status(200);
    res.send("ok");
});


// let bot = await controller.spawn(SLACK_TEAM_ID);

// // Set the context for the bot's next action...
// await bot.startPrivateConversation(SLACK_ADMIN_USER);

// // Begin a dialog in the 1:1 context
// await bot.beginDialog(ALERT_DIALOG);