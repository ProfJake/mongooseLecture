const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    studentID: {
	type: String,
	required: true
    }
});
mongoose.connect('mongodb://localhost:27017/studentDB', {useNewUrlParser: true, useUnifiedTopology: true});

const Student = mongoose.model('Student', studentSchema);

const newStudent = new Student();

newStudent.save((error)=>{
    error = newStudent.validateSync();
    
    console.log(error.message)
    process.exit(1);
});
