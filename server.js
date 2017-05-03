var express = require('express');
var bodyParser = require('body-parser');
var pdfkit = require('pdfkit');
var fs = require('fs');
var app = express();
var path = require('path');

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
		var transporter = nodemailer.createTransport({
		    service: 'gmail',
		    auth: {
			user: process.env.EMAIL_ADDRESS,
			pass: process.env.EMAIL_PASSWORD
		    }
		});

		console.log(request.query.email);

		// setup email data with unicode symbols
		var mailOptions = {
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

// TODO: remove this; just here for debugging
function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

/****************************************************************
*					PATIENT FUNCTIONS							*
****************************************************************/
app.post('/addNewPatient', function(request, response) {
    var patientFirstName = request.body['firstName'];
    var patientLastName = request.body['lastName'];
    var dob = request.body['dateOfBirth'];

    db.collection('patients', function (err, coll) {
        if (err) {
            response.send({ "message": "error accessing \'patient\' collection"});
            return;
        } else {
            coll.insert({
                firstName: patientFirstName,
                lastName: patientLastName,
                dateOfBirth: dob,
                visits: []
            });
        }
    });

    var patientQuery = {
        firstName: patientFirstName,
        lastName: patientLastName,
        dateOfBirth: dob
    };

    var doctorQuery = { userName: request.body['username'] };
    db.collection('patients').findOne(patientQuery, function(err, pat) {
        db.collection('doctors').updateOne(doctorQuery, { $push: { patients: pat._id }}, function(err, result) {
            if (err) {
                response.send({ "message": "error updating patient list" });
            } else {
                response.send(200);
            }
        });
    });
});

// TODO
app.post('/updatePatient', function(request,response) {
	//first confirm doctor is allowed to view this patient
	if(!validPatient(request.body[name])) {
		response.send(false)
	} else {
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

app.get('/getPatient', function(request, response){
    var patientQuery = {
        firstName: request.query.firstName,
        lastName: request.query.lastName,
        dateOfBirth: request.query.dateOfBirth
    };
    var pat = db.patients.findOne(patientQuery, function(err, patient) {
        response.send(patient);
    });
});

// TODO
app.post('/deletePatient', function(request,response) {
	db.patient.remove({name : request.body[name]});
});

/****************************************************************
*					DOCTOR FUNCTIONS							*
****************************************************************/
// TODO
app.get('/getPatientsOfDoctor', function(request, response) {

});

// TODO
app.post('/addDoctor', function(request,response){

		db.doctors.insert(

		{
			//add their name
			name: request.body[name],
			//initializes a list of their visits
			patients: []
		}
		);
});

// TODO
app.post('/removeDoctor', function(request,response){

		db.doctors.remove({name : request.body[name]});

});

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
