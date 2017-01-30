 var fs = require('fs');
 var content = fs.readFileSync('question_list.json', 'utf8');


var questions = JSON.parse(content);

console.log(questions);



