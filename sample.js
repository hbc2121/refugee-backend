 var fs = require('fs');
 var content = fs.readFileSync('questions.json', 'utf8');


var questions = JSON.parse(content);

function print_list(list, dropdown){

	for (var key in list){
		if(list.hasOwnProperty(key)) {
			var val = list[key];

			if(!dropdown && key!= "dropdown")
			console.log(val);

			if(dropdown){
				for(var key_d in val){
					if (val.hasOwnProperty(key_d)){
					var val_d = val[key_d];
					console.log(val_d);
					}
				}
			}
		}
	}
}



function get_list(category){

	var list = questions[category];
	print_list(list,list.dropdown);

}

//This is what front end peeps do
var trauma_events = "trauma_events";
var personal_desc = "personal_desc"
var head_injury = "head_injury"
get_list(trauma_events);





