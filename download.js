// WARNING!!!! Remove TOKEN MOTHERFUCKER


axios = require('axios') 
url = 'https://discordapp.com/api/v6/channels/578632520577318934/messages';
_ = require('lodash')

messages = []

downloadMessages = (before) => {
	return axios.get( url, { 
		params: { limit: 100, before },
		headers: {'Authorization': process.env.TOKEN}
	})
	.then((data) => {
		var newMessages = data.data
		messages = messages.concat(newMessages)
		if (_.get(_.last(newMessages), "id")) {
		 	downloadMessages(_.last(newMessages).id)
		} else {
			console.log('STOPPED on', _.last(newMessages))
		}
	})
	.catch( (err) => console.log('error', err))
}

downloadMessages();
setTimeout(() =>  {
	// console.log(JSON.stringify(messages, 2, 2))
	// "Aleksandra"
	// "maxim.zavadskiy"
	maximMessages = _.filter( messages,  (m) => _.get(m, "author.username") == "maxim.zavadskiy")
	contents = _.map(maximMessages, "content")
	uniqueMessages = _.groupBy(contents.map( (elem) => ({text: elem, count:1})) , 'text')
	keywords = _.flatten(contents.map (phrase => phrase.split(" ")))
	uniqueKeywords = _.sortBy(_.groupBy(keywords), "length").reverse()
	console.log( "unique messages downloaded", _.values(uniqueMessages).length)
	console.log( "Keywords")
	console.log(uniqueKeywords)
	debugger;
// uniqueKeywords = _.sortBy(_.groupBy(keywords.map( (elem) => ({text: elem, count:1})), "text"), "length").reverse()

	// console.log(JSON.stringify(maximMessages, 2, 2))
}, 4000)



// curl_setopt_array($ch, array(
//     CURLOPT_URL            => $url, 
//     CURLOPT_HTTPHEADER     => array('Authorization: NTUyOTAzNzExMzU4NDUxNzMy.XOzxMg.1bijzJTzhuh2vj3yfamJQoTDadg'),
//     CURLOPT_RETURNTRANSFER => 1,
//     CURLOPT_FOLLOWLOCATION => 1,
//     CURLOPT_VERBOSE        => 1,
//     CURLOPT_SSL_VERIFYPEER => 0,
//     CURLOPT_STDERR         => $f,
// ));
// $response = curl_exec($ch);
// fclose($f);
// curl_close($ch);
// print($response);
// print('end');