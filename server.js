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
        db.collection('doctors').updateOne(doctorQuery, { $push: { patients: JSON.stringify(pat.valueOf()._id)}}, function(err, result) {
            if (err) {
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
    };



    db.collection('patients').findOne(patientQuery, function(err, patient) {
    	if(err){
    		response.send("error: failed to retrieve patient");	
    	} 
    	if(patient){
            

            var id = JSON.stringify(patient.valueOf()._id);
            db.collection('doctors').findOne({username:request.query.username}, function(err,user){

                if(err){
                    response.send("error");
                }

                if(user){
                    var pats = user.patients;
                    var valid = (pats.includes(id));
                    console.log("VALID" + valid);
                        if(valid){
                            response.send(patient);
                        } else {
                            response.send("error: patient not in doctor list");
                        }

                 } else {
                        response.send("error");
                }
            });

        }else{
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

// TODO
app.get('/getPatientsOfDoctor', function(request, response) {


    db.collection('doctors').findOne({username:request.query.username}, function(err,doctor){

        if(err){
            response.send("error: cannot query doctor ");
        }

        if(doctor){

            var patients = doctor.patients;
            var patient_array = new Array();


            for(i = 0; i < patients.length; i++){

                var id = patients[i].replace(/"/g, "'");
                console.log("id " + id);
                var o_id = mongoose.Types.ObjectId('591338e9de3c45000401ffa3');

                // var found_patient = 
                db.collection('patients').find({ _id : o_id}).toArray(function(err,documents){

                    console.log("length " + documents.length)
                    for(var x in documents){
                        patient_array.push(documents[x]);
                    }
                });

                // if(!found_patient){
                //     console.log("NO PATIENT");
                // }

                // if(found_patient == {}){
                //     console.log("EMPTY PATIENT");
                // }

                // for(var key in found_patient){
                //     console.log("YOOOOO " + key);
                // }

                // var patient_query = {

                //         "firstName": found_patient.firstName,
                //         "lastName": found_patient.lastName,
                //         "dateOfBirth": found_patient.dateOfBirth,
                //         "visits": found_patient.visits
                // };

                // console.log(JSON.stringify(found_patient));


                // patient_array.push(patient_query);
                
                // console.log("PATIENT ARRAY  " + patient_array);

            }

            console.log("PATIENT ARRAY TO SEND " + patient_array);
            response.send(patient_array);
        }

        else{
            response.send("error: cannot find doctor");
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

	db.collection('doctors').insert(newDoctor, function(err, idk) {
        if (err) {
            response.send({ "message": "failed to add doctor" });
        } else {
            response.send(200);
        }
    });
});


// app.post('/addPatientToDoctor', function(request,response){

//     response.send(200);
// });

//TEST
app.post('/addPatientToDoctor', function(request,response){

       var patientQuery = {
        firstName: request.query.firstName,
        lastName: request.query.lastName,
        dateOfBirth: request.query.dateOfBirth
        };

        console.log("patient query " + patientQuery);

db.collection('patients').findOne(patientQuery, function(err,pat){

        if(err){
            response.send("error:unable to add patient")
        }

        if(pat){

            console.log("PAT " + pat);
            db.collection('doctors').updateOne(request.body['username'], {$push: {patients: JSON.stringify(pat.valueOf()._id)}}, function(err, doctor) {
                if (err) {
                    response.send({ "message": "error: unable to add patient"});
                } 
                if(doctor) {

                    console.log("DOCTOR " + doctor);
                    response.send(200);
                }
                else {
                    response.send("error:unable to add patient to doctor");
                }                
            });

        } else {
            response.send("error:unable to find patient");

        }

    });
    
});




app.listen(process.env.PORT || 3000);
