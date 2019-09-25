const express        = require('express');
const MongoClient    = require('mongodb').MongoClient;
const bodyParser     = require('body-parser');
const app            = express();
const port           = 8000;

app.use(bodyParser.urlencoded({ extended: true }));
MongoClient.connect(db.url, (err, database) => {
  if (err) return console.log('rfrrf')
  require('./app/routes')(app, database);
  app.listen(port, () => {
    console.log('We are live on ' + port);
  });               
})


module.exports = function(app, db) {
    app.post('/notes', (req, res) => {
      // Здесь будем создавать заметку.
      res.send('Hello')
    });
  };