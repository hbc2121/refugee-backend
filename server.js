var express = require('express');
var bodyParser = require('body-parser');
var pdfkit = require('pdfkit');
var fs = require('fs');
var app = express();
var path = require('path');
var doctor_name = "";

//Mongo initialization and connect to database
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL;
var mongoUri = "mongodb://main:password1@ds127389.mlab.com:27389/heroku_5qlth62f";
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

var error_msg = "{}";
var config = require('./question_list.json');


app.post('/genPDF', function(request, response) {
	// generate PDF from object
	var doc = new pdfkit();
	var d = new Date();
	var date = d.toLocaleString();
	var tab = '    ';
	var fname = JSON.stringify(d.getMonth() + 1) + '-' + JSON.stringify(d.getDate()) + '-' + JSON.stringify(d.getFullYear()) + 'Output.pdf';
	var writeStream = fs.createWriteStream(fname);
	doc.pipe(writeStream); 

		doc.text(date + ' GMT' + '\n\n') //adds date to top of page 
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
			
			
			doc.font('fonts/LiberationSans-Regular.ttf')
			   .fontSize(12)

		   
		   		doc.text(questions[qad]['body'] + ': ' + questions[qad]['value'] + '\n');
		   

			if (questions[qad]['dropdown']) {
				for (info in questions[qad]['dropdown']) {
					var dropdown = questions[qad]['dropdown'][info];
					doc.font('fonts/LiberationSans-Regular.ttf')
					   .fontSize(12)
					   .text(tab + dropdown['body']+ ': ' + dropdown['value'] + '\n');
				}
			}
		}
		if (request.body[key]['additional_comments'] != '') {
			doc.text('Additional Comments: ' + request.body[key]['additional_comments']);
		}
		doc.text('\n');		
	}
	
	doc.end();
	writeStream.on('finish', function() {
		var stat = fs.statSync(fname);
		
		'use strict';
		const nodemailer = require('nodemailer');

		// create reusable transporter object using the default SMTP transport
		let transporter = nodemailer.createTransport({
		    service: 'gmail',
		    auth: {
			user: process.env.EMAIL_ADDRESS,
			pass: process.env.EMAIL_PASSWORD
		    }
		});

		console.log(request.query.email);		

		// setup email data with unicode symbols
		let mailOptions = { 
		    from: '"HTQR" <' + process.env.EMAIL_ADDRESS + '>', // sender address
		    to: request.query.email, // list of receivers
		    subject: 'HTQR Results', // Subject line
		    text: 'Attached is a PDF with the survey results. Thank You \n',
			 attachments : [{
				filename: fname,
		    		path: __dirname + '/' + fname}]
		    
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

/****************************************************************
*	 			THIS IS PHASE 2 SHIT!!!   		  				*
*				I REPEAT...THIS IS PHASE 2 SHIT!!!!	 	   	    *
*				IF IT DOESN'T WORK....I'M SORRY :(	  			*
****************************************************************/


/****************************************************************
*					PATIENT FUNCTIONS							*
****************************************************************/
app.get('/setDoctor', function(request,response) {

	doctor_name = request.body[user_name];

});

app.post('/addNewPatient', function(request,response) {


	var d = new Date();
	var date_string = JSON.stringify(d.getMonth() + 1) + '-' + JSON.stringify(d.getDate()) + '-' + JSON.stringify(d.getFullYear());
	var patient_info = request.body;

	//created a new document to store patients data
	db.patients.insert(

		{	
			//add their name
			name: request.body[name],
			//initializes a list of their visits
			visits: { 

			}}
		);

	//adds patients ID to list of patients for doctor currently signed in
	var user = db.patients.find({name:request.body[name]});
	var id = user._id;
	addPatientToDoctor(id,doctor_name);

});

app.post('/updatePatient', function(request,response) {

	//first confirm doctor is allowed to view this patient
	if(!validPatient(request.body[name])) {
		response.send(false)
	}

	else {
	var d = new Date();
	var date_string = JSON.stringify(d.getMonth() + 1) + '-' + JSON.stringify(d.getDate()) + '-' + JSON.stringify(d.getFullYear());
	var patient_info = request.body;

	db.patients.update(

		//query for document for specific patient
		{name : request.body[name]},

		//update visits array by adding new field
		{'$set' : {"visits" : { d : {date: date_string,
									data: patient_info}} 
							}
		},

		//if no record exists, add patient
   		{ upsert: true }

	);
	}
});

app.get('/getPatient', function(request,response){

	//puts cursor at document of patients
	var cursor = db.patients.find({name : request.body[name]});

	var patient_doc = cursor.toArray();

	response.send(patient_doc);

});

app.get('/getAllPatients', function(request,response){

	//no parameter returns all documents
	var cursor = db.patients.find();

	var patient_doc = cursor.toArray();

	response.send(patient_doc);

});


app.get('/deletePatient', function(request,response) {	

	db.patient.remove({name : request.body[name]});
});

app.get('/deleteAllPatients', function(request,response) {	

	db.patient.remove();
});

/****************************************************************
*					DOCTOR FUNCTIONS							*
****************************************************************/

app.get('/addDoctor', function(request,response){

		db.doctors.insert(

		{	
			//add their name
			name: request.body[name],
			//initializes a list of their visits
			patients: [] 
		}	
		);
});

app.get('/removeDoctor', function(request,response){

		db.doctors.remove({name : request.body[name]});	

});

function addPatientToDoctor(id,doctor){

	var user = db.doctors.find({name:doctors_name});
	var new_patients = user.patients;
	new_patients.push(id);

	db.doctors.update(

		{name:doctor_name},

		{patients:new_patients}

	);

}

function removePatientFromDoctor(id){
	
	var user = db.doctors.find({name:doctors_name});
	var new_patients = user.patients;

	var index = new_patients.indexOf(id);
	new_patients.splice(index,1);

		db.doctors.update(

		{name:doctor_name},

		{patients:new_patients}

	);

}

function validPatient(id){

	var user = db.doctors.find({name:doctors_name});
	var patients = user.patients;

  	return patients.indexOf(id) > -1;
}

app.listen(process.env.PORT || 3000);
