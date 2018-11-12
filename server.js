var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}))

var Message = mongoose.model('Message', {
  username: String,
  message: String,
  time: String
})

var User = mongoose.model('User', {
  username : String,
  password : String
})

var dbUrl = `mongodb://admin:${process.env.MONGODB_PASSWORD}@ds159073.mlab.com:59073/slackchat`

app.get('/messages', (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages);
  })
})


app.get('/messages/:username', (req, res) => {
  var user = req.params.username
  Message.find({
    username: user
  }, (err, messages) => {
    res.send(messages);
  })
})

app.get('/login/:username', (req, res) => {
  var user = req.params.username
  User.find({
    username: user
  }, (err, users) => {
    res.send(users);
  })
})

app.get('/signup/:username', (req, res) => {
  var user = req.params.username
  User.find({
    username: user
  }, (err, users) => {
    res.send(users);
  })
})

app.post('/signup', async (req, res) => {
  try {
    req.body.password = bcrypt.hashSync(req.body.password, 7);
    var n_user = new User(req.body);
    var savedUser = await n_user.save()
    res.sendStatus(200);
  } catch (error) {
      res.sendStatus(500);
      return console.log('error', error);
  } finally {
      console.log('User Added')
  }
})

app.post('/login', async (req, res) => {
  try {
    var username = req.body.username;
    var password = req.body.password;
    
    User.find({
      username: username
    }, (err, users) => {
      var hash = users[0].password;
      if (bcrypt.compareSync(password, hash)) res.sendStatus(200); res.sendStatus(404);
    })
    

  } catch (error) {
      res.sendStatus(500);
      return console.log('error', error);
} finally {
    console.log('User Added')
}
})

app.post('/messages', async (req, res) => {
  try {
    var message = new Message(req.body);

    var savedMessage = await message.save()
    console.log('saved');

    var censored = await Message.findOne({
      message: 'badword'
    });
    if (censored)
      await Message.remove({
        _id: censored.id
      })
    else
      io.emit('message', req.body);
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
    return console.log('error', error);
  } finally {
    console.log('Message Posted')
  }

})

io.on('connection', () => {
  console.log('a user is connected')
})

mongoose.connect(dbUrl, { useNewUrlParser: true }, (err) => {
  console.log('mongodb connected', err);
})

var server = http.listen(port, () => {
  console.log('server is running on port', server.address().port);
});