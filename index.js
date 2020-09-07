var Twit = require('twit');
const express = require('express');
const app = express();
const server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');

const config = require('./config.js').config;


// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));



function formatTweet(tweet) {
  let tweetbody = {
    'id': tweet.id,
    'text': tweet.text,
    'userScreenName': "@" + tweet.user.screen_name,
    'userImage': tweet.user.profile_image_url_https ? tweet.user.profile_image_url_https : '',
    'userDescription': tweet.user.description,
  }

  try {
    if(tweet.entities.media[0].media_url_https) {
      tweetbody['image'] = tweet.entities.media[0].media_url_https;
    }
    if(tweet.entities.media.length) {
      tweetbody['images'] = tweet.entities.media.map(val => {
        // console.log(val);
        let sizes = val.sizes.medium;
        if(!sizes) sizes = val.sizes.large;
        return {
          width: sizes.w,
          height: sizes.h,
          url: val.media_url_https
        };
      });
    }
  } catch(err) { }

  return tweetbody;
}

io.on('connection', function(socket) {

    T.get('search/tweets', { q: '(#babymetal_fanart OR #babymetalfanart) filter:images -filter:retweets', count: 200 }, function(err, data, response) {
      var tweetArray=[];
      // console.log('raw tweets', data.statuses);
        for (let index = 0; index < data.statuses.length; index++) {
            const tweet = data.statuses[index];
            // var tweetbody = {
            //   'id': tweet.id,
            //   'text': tweet.text,
            //   'userScreenName': "@" + tweet.user.screen_name,
            //   'userImage': tweet.user.profile_image_url_https,
            //   'userDescription': tweet.user.description,
            // }
            // try {
            //   if(tweet.entities.media[0].media_url_https) {
            //     tweetbody['image'] = tweet.entities.media[0].media_url_https;
            //   }
            //   if(tweet.entities.media.length) {
            //     tweetbody['images'] = tweet.entities.media.map(val => {
            //       // console.log(val);
            //       let sizes = val.sizes.medium;
            //       if(!sizes) sizes = val.sizes.large;
            //       return {
            //         width: sizes.w,
            //         height: sizes.h,
            //         url: val.media_url_https
            //       };
            //     });
            //   }
            // } catch(err) { }

            const tweetbody = formatTweet(tweet);
            tweetArray.push(tweetbody);
        }     
        io.emit('allTweet',tweetArray)
    })

    var stream = T.stream('statuses/filter', { track: ['#babymetal_fanart', '#babymetalfanart'] })

    stream.on('tweet', function (tweet) {
      
        io.emit('tweet',{ 'tweet': formatTweet(tweet) });
    })
});

var T = new Twit(config);

// listen for requests :)
const listener = server.listen(config.port, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
