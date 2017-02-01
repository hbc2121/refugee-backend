var express = require('express');
var bodyParser = require('body-parser');
var pdfkit = require('pdfkit');
var fs = require('fs');
var app = express();

// Mongo initialization and connect to database
//var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL;
var mongoUri = "mongodb://main:password1@ds127389.mlab.com:27389/heroku_5qlth62f";
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

var error_msg = "{}";
var config = require('./question_list.json');

app.post('/addPatient', function(request,response) {
	db.collection('patients').insert(request.body);
	response.send(":)");
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
/*
function printObject(object) {
	if (object) {
		for (property in object) {
			console.log(property + ": " + object[property]);	
		}
	}
}

// TODO: could somebody spam this function and crash the server?
// 	--> how can we ensure only one PDF request is made at a time?
app.post('/genPDF', function(request, response) {
	//var email = request.body.email;
	//var obj = request.body.doc;
	printObject(request.body);
	// generate PDF from object
	var doc = new pdfkit();
	doc.pipe(fs.createWriteStream('output.pdf')); //literally no idea if this will work
	//for (property in request.body) {
		doc.font('fonts/LiberationSans-Regular.ttf').fontSize(12).text(JSON.stringify(request.body, null, 2));
	//}
	response.send(":)");
	doc.end();
});
*/
app.get('/', function(request, response) {
	response.send('hey');
});

app.listen(process.env.PORT || 3000);

