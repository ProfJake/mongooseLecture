/*validation.js
An example of Mongoose's simple "requirement" validation
Jake Levy
Mar 2021
*/
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    studentID: {
	type: String,
	required: true //mandates this field must appear in any Student entry
    }
});
mongoose.connect('mongodb://localhost:27017/studentDB', {useNewUrlParser: true, useUnifiedTopology: true});

const Student = mongoose.model('Student', studentSchema);

//{ studentID: "ABC123" }
const newStudent = new Student();//missing the studentID field 

//you could await a query object but this demos
//passing a callback to handle errors
newStudent.save((error, results)=>{
    //validateSync will check any registered validation rules on a Schema
    if (error){
	//because we did not add the required field, this will trigger the err
	error = newStudent.validateSync();
	
	console.log(error.message)
	process.exit(1);
    } else{
	//add a document like { studentID: "ABC123" } to student constructor
	//call above to successfully save
	console.log(`${newStudent.studentID} has been SAVED`)
	console.log(results)
    }
    
process.exit(1);
});
