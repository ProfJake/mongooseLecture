var mongoose = require('mongoose');
/*A simple schema demonstration.
Jake Levy
*/

//Schema provide more rigid definitions for models in the DB
//they are analgous to class definitions
const blogScheme = new mongoose.Schema({
    title: String,
    author: String,
    date: Date,
    body: String,
    likes: Number
})

//This line "compiles" the schema.  In other words this connects the blog's
//schema to the blogs collections in the DB.  It auto connects to the lower-
//cased plural of the first argument ('Blog' here)
const Blog = mongoose.model('Blog', blogScheme);

//Unlike the native mongodb module, mongoose buffers our connection to the db,
//so in certain situations like connecting, we don't have to await

//This can be turned off (see actServer+DB from this folder) but then you will
//have to await
mongoose.connect('mongodb://localhost:27017/blogDB', {useNewUrlParser: true, useUnifiedTopology: true});


//async to allow easier promise resolutions
async function run(){
    //this creates a new instance of the schema (a Document) with the correct
    //datatypes
    var newPost = new Blog({title: "Your first mongoose example", author: "Jake Levy", date: new Date(), body: "This is an example", likes: 0});

    //this saves the instance document to the database collection it belongs to
    await newPost.save();
    //We await for queries in the same we await for promises
    //the difference is subtle (*see the slides)
        
    //this is one of the many Mongoose transaction methods
    var res = await Blog.find({});
    //returns an array of Blog documents
    //accepts doc like the MongoDB api queries
    
    console.log(res)

}


run().then(
    ()=>{
//When given one argument, path returns the SchemaType for the named property
	//prints the SchemaType Configuration Object
	console.log(blogScheme.path('likes'))

	//prints undefined because this path does not exist
	console.log(blogScheme.path('dislikes'))
	
//When given two arguments it will set the Schema path
	blogScheme.path('views', Number)

	console.log(blogScheme.path('views'))
    })
