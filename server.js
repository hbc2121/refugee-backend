var express = require('express');
//var bodyParser = require('body-parser');
var app = express();

// Mongo initialization and connect to database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL|| 'mongodb://localhost/grocery';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

//TODO: why do we need this
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

var error_msg = "{}";
var config = require('./question_list.json');
console.log(config.te1 + ' ' + config.te2);

app.post('/addPatient', function(request,response) {
	db.collection('patients', function(error, coll) {
		coll.insert(request.body);	
	});
});


app.get('/get', function(request,response){


});

app.get('/getall', function(request,response){
	
	
});


app.get('/deletePatient', function(request,response) {
	
});

app.get('/getQuestions', function(request,response) {
	
	var fs = require('fs');
	var content = fs.readFileSync('question_list.json', 'utf8');
	 
	response.setHeader('Content-Type', 'application/json');
	response.send((content));
	
});

app.get('/', function(request, response) {
	response.send('hey');
});

app.listen(process.env.PORT || 3000);

