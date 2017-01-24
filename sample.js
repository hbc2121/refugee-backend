 var fs = require('fs');
 var content = fs.readFileSync('questions.json', 'utf8');


var questions = JSON.parse(content);

function print_list_nodropdown(list){

	for (var key in list){
		if(list.hasOwnProperty(key)) {
			var val = list[key];
			console.log(val);
		}
	}
}

function get_list(category){
	var list = questions[category];

	if(list.dropdown == false)
	print_list_nodropdown(list);

}

//This is what front end peeps do
var trauma_events = "trauma_events";
var personal_desc = "personal_desc"
get_list(trauma_events);





