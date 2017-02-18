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

app.post('/genPDF', function(request, response) {
	// generate PDF from object
	var doc = new pdfkit();
	var d = new Date();
	var date = d.toLocaleString();
	var tab = '        ';
	var writeStream = fs.createWriteStream('output.pdf');
	doc.pipe(writeStream); 

		doc.text(date + '\n\n') //adds date to top of page 
			.fontSize(12);

		doc.font('fonts/LiberationSans-BoldItalic.ttf')
			.fontSize(18)
			.text('HTQR and Hopkins Symptom Checklist Results \n\n');

	for (key in request.body) {
		var questions = request.body[key]['questions'];
		doc.font('fonts/LiberationSans-Bold.ttf')
			.fontSize(12)
			.text(request.body[key]['category']); //prints categories 

		for (qad in questions) {
			var words = ["N/A","Not at all", "A little", "Quite a bit", "Extremely", "Yes", "Neutral", "No"]; //maps numbers to values 
			
			doc.font('fonts/LiberationSans-Regular.ttf')
			   .fontSize(12)

		   if (!isNaN(questions[qad]['answer'])){
		   		doc.text(questions[qad]['question'] + ': ' + words[questions[qad]['answer']] + '\n');
		    } else {
		   		doc.text(questions[qad]['question'] + ': ' + questions[qad]['answer'] + '\n');
		    }

			if (questions[qad]['dropdown']) {
				for (info in questions[qad]['dropdown']) {
					var dropdown = questions[qad]['dropdown'][info];
					doc.font('fonts/LiberationSans-Regular.ttf')
					   .fontSize(12)
					   .text(tab + dropdown['question']+ ': ' + dropdown['answer']);
				}
			}
		}
		doc.text('\n');
	}
	
	doc.end();
	writeStream.on('finish', function() {
		var stat = fs.statSync('output.pdf');
		
		'use strict';
		const nodemailer = require('nodemailer');

		// create reusable transporter object using the default SMTP transport
		let transporter = nodemailer.createTransport({
		    service: 'gmail',
		    auth: {
			user: 'htqr2017@gmail.com',
			pass: 'tuftscapstone'
		    }
		});

		console.log(request.query.email);		

		// setup email data with unicode symbols
		let mailOptions = { 
		    from: '"HTQR" <htqr2017@gmail.com>', // sender address
		    to: request.query.email, // list of receivers
		    subject: 'HTQR Results', // Subject line
		    text: 'Attached is a PDF with the survey results. Thank You \n',
			 attachments : [{
				filename: 'output.pdf',
		    		path: __dirname + '/output.pdf'}]
		    
		};

		// send mail with defined transport object
		transporter.sendMail(mailOptions, (error, info) => {
		    if (error) {
			return console.log(error);
		    }
		    console.log('Message %s sent: %s', info.messageId, info.response);
		});
		response.send(';)');
	});

});

app.get('/getQuestions', function(request,response) {
	
	var fs = require('fs');
	var content = fs.readFileSync('question_list.json', 'utf8');
	 
	response.setHeader('Content-Type', 'application/json');
	response.send((content));
	
});

app.listen(process.env.PORT || 3000);

