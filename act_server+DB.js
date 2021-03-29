var tracker = require("tracker");
var Exercise = require("tracker/Exercise");
var http = require("http");
var qString = require("querystring");

let dbManager = require('./dbManager'); 
let mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
const exSchema = new mongoose.Schema({
	type: {
		type: String,
		required: true
}
});
exSchema.loadClass(Exercise);
const actSchema= new mongoose.Schema(
{
	activity : {
		type: exSchema
	} ,
	weight: Number,
	distance: Number,
	time: {
		type: Number, 
		validate: {
			validator: function(){
				return (this.time>0)
			}, 
			message: "Time must be greater than 0!"
		},
		required: [true,'You must enter a time for speed']
	},
	user: String
	
});

actSchema.loadClass(tracker);
actSchema.path('activity').required(true, 'You must enter an activity to track');
actSchema.path('weight').required(true, 'You must enter a weight for calculation');
actSchema.path('distance').required(true, 'You must enter a distance for everything');
const actCol=mongoose.model('Activity', actSchema)


//This has been modified to return a Mongoose Model instance (a document)
function docifyActivity(params){
    let doc = new actCol({ activity: { type : params.activity.toString().toLowerCase() }, weight: params.weight,
		distance: params.distance, time: params.time, user: params.user});
    return doc;
}

//The same server response from the activity_server lab
//this time it is specifically used for db inserts
function servResp( calories, res){
var page = '<html><head><title>The Activity Server</title></head>'+
'<body> <form method="post">'+
'<h1>Fill out your Activity</h1>'+
'User Name <input name="user"><br>'+
'Activity Name <select name="activity"><option>Running</option><option>Walking</option><option>Swimming</option></select><br>'+
'Weight (in pounds) <input name="weight"><br>' +
'Distance (in miles) <input name="distance"><br>'+
'Time (in minutes) <input name="time"><br>' +
'<input type="submit" value="Insert!">' +
'<input type="reset" value="Clear">'+
'</form>';
    if (calories){
	if (!isNaN(calories)){
	    page+='<div id="calories"><h3> Calories Burned: ' + calories + '</h3></div>';
	} else{
	    page+='<div id="calories"><h3> Message: ' + calories + '</h3></div>';
	}
    }
page+='<br><br><a href="./search">Search</a></body></html>';

res.end(page);
}
//This function is for searching. Because we want the page to finish
//generating before it is returned, this function is labeled async
//so that we can "await" the results of fulfillment for processing all items
async function searchResp(result, response){
var page = '<html><head><title>The Activity Server</title></head>'+
'<body> <form method="post">'+
'<h1>Search for an Activity</h1>'+
'Property <select name="prop">'+
'<option>user</option>' +
'<option>activity.type</option>' +
'<option>weight</option>' +
'<option>distance</option>' +
'<option>time</option>' +
'</select>'+
'  <input name="value">'+
'<input type="submit" value="Search!">' +
'<input type="reset" value="Clear">'+
'</form>';

    if (result){

	page+=`<h2>Activities for ${result.prop}: ${result[result.prop]}</h2>`
	let count = 0;
//mongoose returns an actual value from the await
	try{
		for (item in result.data){
			
			let curAct = new tracker(result.data[item].activity.type, result.data[item].weight, result.data[item].distance, result.data[item].time);
			page+=`Activity ${++count} ${result.data[item].user}: ${result.data[item].activity.type}, Distance: ${result.data[item].distance} | ${curAct.calculate()} Calories Burned <br>`
		}

	} catch (e){
	    page+=e.message;
	}
    }
page+='<br><br><a href="/insert">home/insert</a></body></html>';
  
response.end(page);
}

http.createServer(
async  (req, res)=>{
    console.log(req.method);
    let baseURL = 'http://' + req.headers.host;
    var urlOBJ = new URL(req.url, baseURL );
    
    if (req.method == "POST"){
	
	var postData = '';
	req.on('data', (data) =>{
		postData+=data;
	    });
	//labeling a  callback as async will allow us to wait for promise
	//fulfillment inside the function
	req.on('end', async ()=>{
		console.log(postData);
		let calories;
		let proceed = true;
		var postParams = qString.parse(postData);
		//handle empty data
			//This has been offloaded to Mongoose
		if (proceed){
//		    let col = dbManager.get().collection("activities");
		    //on the insert page
		    if (urlOBJ.pathname=="/insert"){
			
			try{
			    //convert params to a document for Mongoose
			    //This will allow us to offload the validations to mongoose
			    let curDoc = docifyActivity(postParams);

			    var curTracker = new tracker(postParams.activity,
							postParams.weight,
							postParams.distance,
							postParams.time);

			    //insert the document into the db
			    await curDoc.save() 
				
				
			    //return calories as response (Success)
				   calories = curTracker.calculate();
		
			    servResp(calories, res);
			   // console.log(result); //log result for viewing
			} catch (err){  
			    calories = "ERROR! Please enter appropriate data";
			    console.log(err.message);
			    servResp(err.message, res);
			} 
		    } else if (urlOBJ.pathname == "/search") {
			var prop= postParams.prop;
			var val = postParams.value;
			if (prop != "user" && prop != "activity.type"){
			    val = Number(postParams.value);
			} 
			//simple equality search. using [] allows a variable
			//in the property name 
			let searchDoc = { [prop] : val };
			try{
			    let cursor = await actCol.find(searchDoc,  'activity distance user weight time').exec();
			    let resultOBJ={data: cursor, [prop]  : val, prop: prop};

			    searchResp(resultOBJ, res);//call the searchPage
			} catch (e){
			    console.log(e.message);
			    res.writeHead(404);
		res.write("<html><body><h1> ERROR 404. Page NOT FOUND</h1>");
			    res.end("<br>" + e.message + "<br></body></html>");
			}
		    } else {
			res.writeHead(404);
		res.end("<html><body><h1> ERROR 404. Page NOT FOUND</h1><br>");
		    }
		} else {
		    if (urlOBJ.pathname == "/insert"){
			//calories = Error! All Fields must have Data"
			servResp(calories, res);
		    } else if (urlOBJ.pathname == "/search"){
			//blank page, nothing found
			searchResp(null, res);
		    }
		}  
	    });
    } else { //GET
	
	if (urlOBJ.pathname == "/insert"){
	    //initial GET to insert returns  
	    servResp(null, res);
	}else if (urlOBJ.pathname == "/search"){
	    //Initial GET to search returns a blank page
	    searchResp(null, res);
	} else if (urlOBJ.pathname == "/"){
	    res.end('<html><body><br><br><a href="/insert">home/insert</a>&emsp;&emsp;<a href="/search">search Page</a></body></html>');
	}else {
	    res.writeHead(404);
	    res.end("<h1> ERROR 404. Page NOT FOUND</h1><br><br>");
	}
    }
}).on('end', async ()=>{
	console.log("Closing DB Connection");
	await dbManager.close();
    }).listen(3000, async ()=> {
	    //start and wait for the DB connection
	    try{
		//await dbManager.get("practiceDB");
		await mongoose.connect('mongodb://localhost:27017/practiceDB', {useNewUrlParser: true, useUnifiedTopology: true })
	    } catch (e){
		console.log(e.message);
	    }
	    
	    console.log("Server is running...");
	
	});

