var express = require('express');
//var uuid = require('uuid');
 
var app = express();

// Mongo initialization and connect to database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL|| 'mongodb://localhost/grocery';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

var error_msg = "{}";

/*
//enable CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
*/

app.get('/add', function(request,response){
});

app.get('/delete', function(request,response){
});

app.get('/', function(request, response) {
	response.send('hey');
  });

app.listen(process.env.PORT || 3000);

