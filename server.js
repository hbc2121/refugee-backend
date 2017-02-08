var express = require('express');
var bodyParser = require('body-parser');
var pdfkit = require('pdfkit');
var fs = require('fs');
var app = express();
var path = require('path');

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
/*
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
*/
// TODO: could somebody spam this function and crash the server?
// 	--> how can we ensure only one PDF request is made at a time?
app.post('/genPDF', function(request, response) {
	// generate PDF from object
	var doc = new pdfkit();
	var tab = '        ';
	var writeStream = fs.createWriteStream('output.pdf');
	doc.pipe(writeStream); //literally no idea if this will work

	for (key in request.body) {
		var questions = request.body[key]['questions'];
		doc.font('fonts/LiberationSans-Bold.ttf')
			.fontSize(12)
			.text(request.body[key]['category']);
		for (qad in questions) {
			
			doc.font('fonts/LiberationSans-Regular.ttf')
			   .fontSize(12)
			   .text(tab + questions[qad]['question'] + ': ' + questions[qad]['answer']);
			if (questions[qad]['dropdown']) {
				for (info in questions[qad]['dropdown']) {
					var dropdown = questions[qad]['dropdown'][info];
					doc.font('fonts/LiberationSans-Regular.ttf')
					   .fontSize(12)
					   .text(tab.repeat(2) + dropdown['question'] + ': ' + dropdown['answer']);
				}
			}
		}
		doc.text('\n');
	}
	
	doc.end();
	writeStream.on('finish', function() {
		var stat = fs.statSync('output.pdf');
		response.setHeader('Content-Length', stat.size);
		response.setHeader('Content-Type', 'application/pdf');
		response.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
		response.download(__dirname + '/output.pdf');
	});
});

app.listen(process.env.PORT || 3000);

