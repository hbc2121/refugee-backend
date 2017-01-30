var express = require('express');
//var bodyParser = require('body-parser');
var app = express();

// Mongo initialization and connect to database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL|| 'mongodb://localhost/grocery';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

var error_msg = "{}";
var config = require('./question_list.json');
console.log(config.te1 + ' ' + config.te2);

app.post('/addPatient', function(request,response) {
	db.collection('patients', function(error, coll) {
		coll.insert(request.body);	
	});
});

app.get('/deletePatient', function(request,response) {
	
});

app.get('/getQuestions', function(request,response) {
	
});

app.get('/', function(request, response) {
	console.log('hi');
	response.send('hey');
});

app.listen(process.env.PORT || 3000);

