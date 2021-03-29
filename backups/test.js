
const dbManager = require('./dbManager.js');

//I THINK THIS WORKED
//call the get method 
async function main(){
    try{

	let ourDB = await dbManager.get(); //after this line we are connected.  Notice that the async connect function can be awaited
	//if we put the call in another async function
    }catch(err){
        console.log(err.message)
    }
    
}

main();
//dbManager.get().;