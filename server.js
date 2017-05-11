var express = require('express');
var bodyParser = require('body-parser');
var pdfkit = require('pdfkit');
var fs = require('fs');
var app = express();
var path = require('path');
var ObjectId = require('mongodb').ObjectId; 
var mongoose = require('mongoose');

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

//just here for debugging
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
//THIS WORKS
app.post('/addNewPatient', function(request, response) {

    var patientFirstName = request.body['firstName'];
    var patientLastName = request.body['lastName'];
    var dob = request.body['dateOfBirth'];

    var patientQuery = {
        firstName: patientFirstName,
        lastName: patientLastName,
        dateOfBirth: dob
    };

    db.collection('patients', function (err, coll) {
        if (err) {
            response.send({ "message": "error accessing \'patient\' collection"});
            return;
        } else {
            db.collection('patients').findOne(patientQuery, function(err, pat) {
                if (!err && pat) {
                    response.send("error: patient already exists!");
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
            
        }
    });

    var doctorQuery = { username: request.body['username'] };
    var superuserQuery = { username: 'superuser'};

    db.collection('patients').findOne(patientQuery, function(err, pat) {
        db.collection('doctors').update({$or: [doctorQuery, superuserQuery]}, { $push: { patients: JSON.stringify(pat.valueOf()._id)}}, {multi: true}, function(err1, result1) {
            if (err1) {
                response.send({ "message": "error updating patient list" });
            } else {
                response.send(200);
            }
        });
    });
});

//THIS WORKS
app.post('/updatePatient', function(request,response) {
	var d = new Date();
	var date_string = JSON.stringify(d.getMonth() + 1) + '-'
                      + JSON.stringify(d.getDate()) + '-'
                      + JSON.stringify(d.getFullYear());
    
    var query = {
        firstName: request.body['firstName'],
        lastName: request.body['lastName'],
        dateOfBirth: request.body['dateOfBirth']
    };

    var visit = request.body['visit'];
    visit['visitDate'] = date_string;

    db.collection('patients').updateOne(query, {$push: {visits: visit}}, function(err, patient) {
        if (err) {
            reponse.send({ "message": "error: patient does not exist"});
            return;
        }
        if(patient)
            response.send(200);
        else {
            response.send("error: no patient found");
        }
    });
});

//THIS WORKS
app.get('/getPatient', function(request, response){
    var patientQuery = {
        firstName: request.query.firstName,
        lastName: request.query.lastName,
        dateOfBirth: request.query.dateOfBirth
    };

    var doctorQuery = {
        username: request.query.username
    };

    db.collection('patients').findOne(patientQuery, function(err, patient) {
    	if(err){
    		response.send("error: failed to retrieve patient");	
            return;
    	} 
    	if(patient){
            console.log("doctorQuery ", doctorQuery);
            var id = '\"' + patient['_id'].toString() + '\"';
            db.collection('doctors').findOne(doctorQuery, function(err,user){
                if(err){
                    response.send("error");
                    return;
                }

                if(user){
                    var pats = user.patients;
                    console.log('Patient List ', pats , typeof(pats[3]));
                    console.log('ID ', id, typeof(id));

                    var valid = (pats.includes(id));
                    console.log('Valid ', valid);
                    if(valid){
                        response.send(patient);
                    } else {
                        response.send("error: patient not in doctor list");
                    }

                 } else {
                        response.send("error");
                }
            });
        } else {
                response.send("error: no patient found")
        }
    });
});


/****************************************************************
*					DOCTOR FUNCTIONS							*
****************************************************************/


//THIS WORKS
app.post('/login', function(request, response) {
    var user = request.body['username'];
    var password = request.body['password'];
    var query = {
        username: user
    };

    var doc = db.collection('doctors').findOne(query, function(err, doc) {
        if (err || !doc) {
            response.send(false);
        } else {
            response.send(true);
        }
    });
});

// THIS WORKS
app.get('/getPatientsOfDoctor', function(request, response) {
    db.collection('doctors').findOne({username:request.query.username}, function(err, doctor) {
        if(err){
            response.send("error: cannot query doctor ");
        }

        if(doctor) {
            var patients = doctor.patients;
            var query_array = new Array();

            for(i = 0; i < patients.length; i++) {
                var id = patients[i].replace(/"/g, "");
                var o_id = mongoose.Types.ObjectId(id);
                query_array.push({_id: o_id});
            }

            db.collection('patients').find({$or : query_array}).toArray(function(err, documents){
                    response.send(documents);
            });
        }
    });
});

//THIS WORKS
app.post('/addDoctor', function(request,response){
    var newDoctor = {
        username: request.body['username'],
        firstName: request.body['firstName'],
        lastName: request.body['lastName'],
        patients: []
    }

    var doctorQuery = {
        username: request.body['username'],
        firstName: request.body['firstName'],
        lastName: request.body['lastName']
    };

    db.collection('doctors').findOne(doctorQuery, function (err1, doc) {
        db.collection('doctors').insert(newDoctor, function(err2, idk) {
            if (!err1 && doc) {
                response.send("error: doctor already exists!");
            } else if (err2) {
                response.send({ "message": "failed to add doctor" });
            } else {
                response.send(200);
            }
        });
    });
});


//THIS WORKS
app.post('/addPatientToDoctor', function(request,response){
       var patientQuery = {
            firstName: request.body['firstName'],
            lastName: request.body['lastName'],
            dateOfBirth: request.body['dateOfBirth']
        };

        var doctorQuery = {
            username: request.body['username']
        };

        db.collection('patients').findOne(patientQuery, function(err, patient){

            if(err){
                response.send("error: unable to query patient");
                return;
            }

            var get_id = JSON.stringify(patient.valueOf()._id);
            var id = get_id.replace(/"/g, "");
            console.log('ID ', id);

            console.log("Doctor Query ", doctorQuery);

            db.collection('doctors').updateOne(doctorQuery,{$push: {patients:id}},function(err,success){

                if(err){
                    response.send("error: unable to query doctor");
                    return;
                }

                if(success){
                    console.log("SUCCESS");
                    response.send(200);
                }
                else{
                    response.send("error: unable to add patient to doctor");
                }
            });
        }); 
});

app.listen(process.env.PORT || 3000);
