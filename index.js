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
                convo.say("Hi & nice to meet you! I am @FairChatBot, your communication bot, and will give you tips on improving your communication")
                convo.say("I am quite dump at the moment but I will learn with time fromy you.")
                // convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}



/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
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
var mongoPass = process.env.MONGO_PASS

// MONGO COnnection
// const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://dataSaver:${mongoPass}@cluster0-pfjyq.mongodb.net/test?retryWrites=true&w=majority`

const mongoose = require('mongoose');
mongoose.connect(uri, {useNewUrlParser: true});

const Cat = mongoose.model('Cat', { name: String });
const Messages = mongoose.model('Messages', {
    bot_id: String,
    channel: String,
    team: String,
    text: String,
    ts: String,
    type: String,
    user: String
});

const kitty = new Cat({ name: 'Zildjian' });
kitty.save().then(() => console.log('DB saved meow'));

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "Great, lets practice some team work. Here is your task to do in 2 minutes:\n"+
        // "*Find as many common things as possible between you two* \n" +
        "*Ask each other how your day went & find what is similar* \n" +
        "Start the timer NOW & ask me to rate when finished. Good luck!")
});

// TODO test
controller.on('team_join', function (bot, message) {
    bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say("Hi & nice to meet you! I am @FairChatBot, your communication bot, and will give you tips on improving your communication")
                convo.say("I am quite dump at the moment but I will learn with time fromy you.")
                // convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
});


controller.on('presence_change', function (bot, message) {
    console.log('Presence changed!')
    bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say("Hi & nice to meet you! I am @FairChatBot, your communication bot, and will give you tips on improving your communication")
                convo.say("I am quite dump at the moment but I will learn with time fromy you.")
                // convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
});

// controller.storage.teams.all(function(err,teams) {
//   if (err) {
//     throw new Error(err);
//   }

//   // connect all teams with bots up to slack!
//   for (var t  in teams) {
//     if (teams[t].bot) {
//         debugger;
//       controller.spawn(teams[t]).startRTM(function(err, bot) {
//         console.log('SPAWNED bot for team', teams[t], bot )
//         if (err) {
//           console.log('Error connecting bot to Slack:',err);
//         } else {
//           trackBot(bot);
//         }
//       });
//     }
//   }

// });


// controller.on('spawned', (bot, ss) =>  console.log('SPAWNED', bot, ss))

controller.webserver.get('/rateUsers',  (req, res) => {
        var bot = globalBot
        // controller.spawn(req.params.team_id).startRTM(function(err, bot) {
        //     console.log('SPAWNED bot', err, bot)
        // })

        // console.log('Check bot', bot, globalBot)
        var channelsMsgs = null;

        axios
        .get('https://slack.com/api/conversations.list?token='+ access_token + '&channel=public_channel,private_channel,mpim,im')
        .then((data,err) => {
            var startTime = moment().subtract(1,'days').startOf('day').add(9, 'hours').unix()

            const msgsRequests = _.map(_.get(data, 'data.channels'), (channel) => 
                    axios.get('https://slack.com/api/conversations.history', {
                        params: {
                            token: access_token,
                            channel: channel.id,
                            oldest: startTime,
                            limit: 1000,
                            _channelData: {
                                data: channel
                            }
                        }, 
                }))
            return Promise.all(msgsRequests)
        })
        .then( (_channelsMsgs) => {
            const messagesToSave = _.flatten(_.map(_channelsMsgs, (channel) => _.map(channel.data.messages, (message) => _.assign({}, message, {channel: channel.config.params._channelData.data.id}))))
            channelsMsgs = _channelsMsgs
            Messages.create(messagesToSave, function (err) {
              console.log(`Saved ${messagesToSave.length} messages to the DB with possible err`, err )
            });
            debugger

            return axios
            .get('https://slack.com/api/users.list?token='+access_token)
        })
        .then((users) => {
            // console.log(users.data)
            _.map(users.data.members, ({id: userId}) => {
                const stats = _.map(channelsMsgs, (channel) => _.assign( {}, channelStats(channel.data, userId), {channel: channel.config.params._channelData.data}))
                const topChannelStats = _
                .chain(stats)
                .filter((stat) => stat.userCharacters > 50 && stat.groupSize > 1 )
                .sortBy('userCharacters')
                .takeRight(3 )
                .reverse()
                .value()
                
                bot.startPrivateConversation({user: userId}, function (err, convo) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (!_.isEmpty(topChannelStats)) {
                            var report = 
                            'Happy to notice you were using slack yesterday! Your most used channels were: '+ _.map(topChannelStats, 'channel.name').join(', ') + '\n' +
                            'I collected some insights for those channels - \n\n' +
                            _.map(topChannelStats, (channelStats) => reportAirTime(channelStats, {bot, user: userId, convo})).join('\n\n')
                            + `\n\n Not happy with what the bot says? <https://etceducation.typeform.com/to/i9ZRER?user_id=${userId}|Report message/bot>`;
                            convo.say(report)
                        }
                    }
                 });
            })
        }) 
        .catch((error)  => {
            console.log('Error occured ' +  error); 
            bot.reply('Error occured ' +  error)
        })


    res.status(200);
    res.send("ok");
});

function calculateAirTime(channel) {
    return 0.3
}

function getTotalCharacters(messages) {return _.sum(_.map(messages, "text.length"))}

var channelStats = function(channel, userId) {
    var humanMessages = _.filter(_.get(channel, 'messages'), function(msg){ 
        return !msg.bot_id && !msg.subtype && !msg.text.includes("@ULS02H6JG")
    })

    var _groupedMessages = _.groupBy(humanMessages, "user")
    var userCharacters = getTotalCharacters(_groupedMessages[userId])
    var groupedMessages = _.toPairs(_groupedMessages)
    var groupSize = groupedMessages.length
    var totalCharacters = _.sum(_.map(groupedMessages, function(pair) {return getTotalCharacters(pair[1])}))

    return {totalCharacters, userCharacters, groupSize}
}

function reportAirTime({userCharacters, totalCharacters, groupSize, channel}, {bot, user, convo}) {
    console.log(`Channel #${channel.name}. Typed letters: *${userCharacters}*, Total letters: ${totalCharacters}, Active members: ${groupSize}, user: ${user}`)
    var msg = ''
    msg += `*Channel #${channel.name}*. *${userCharacters}* letters typed by you. *${groupSize}* daily active members . *${totalCharacters}* letters in total \n`
    var airTime = userCharacters/totalCharacters
    var idealTime = 1/groupSize;

    if(airTime > idealTime*1.4 ) {
        msg += 'You were quite more talkative than the rest of your group peers, great energy! '
        + 'However, I observed that peers you interact with may not speak as much :warning: . Research suggests that, teamwork is most efficient when everyone chats about equally. '
        + 'Tip: Try encouraging others to speak more, ask them questions and give them more time to express themselves.'
    } else if(airTime < idealTime*0.6 ) {
        msg += 'I observed, that you have communicated quite a bit less than your group peers :warning:. Research suggests that, teamwork is most efficient when everyone chats about equally.'
         + 'Tip: Try being more brave with expressing your opinions or raising questions'
    }
    else {
        msg += 'Well done :tada:! I observed that you talk about the same amount as your group peers. Letting your teammates speak is crucial for establishing phycological safety & letting the team to groove.'
        + 'Keep up this good communication style!'
    }
    console.log(user + ' spoke ' + airTime*100 + '% of the time' );
    return msg;
}

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
   var emojisPairs = [
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
        const getContent = (emojis) => ({
        // "response_type": "in_channel",
        attachments: [
            {
                title: 'Add emojis',
                callback_id: '123',
                attachment_type: 'default',
                actions: _.map(emojis, (emoji) => ({
                        "name":"yes",
                        "text": `:${emoji}:`,
                        "value": "yes",
                        "type": "button",
                }))
                
            }
        ]

      })

        bot.reply(message, getContent(emojisToAdd) )

    }
   
});


controller.on('block_actions', function(bot, message) {
    bot.reply(message, "You clicked")
});


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