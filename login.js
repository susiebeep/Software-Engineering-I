var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var router = express.Router();

var connection = mysql.createConnection({
    host     : 'database-1.ce1rwynpowon.us-east-2.rds.amazonaws.com',
    user     : 'csStudentsOsu',
    password : 'cs-test-osu-1959',
    database : 'nodelogin'
});

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('views/images'));

app.use(session({
    secret: 'secrets',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.set('port', process.argv[2]);

// Set the assumed folder for static documents to /public.
app.use('/static', express.static('./public'));

// Include express-handlebars, set it as the default engine for interpreting
// .handlebars files, and set the assumed file type to .handlebars.
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


app.get('/', function(request, response) {
    response.render('login');
});


app.post('/auth', function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM Users WHERE userName = ? AND pword = ?', [username, password], function(error, results, fields) {
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                request.session.userId = results[0].id;
                response.redirect('/home');
            } else {
                response.send('Incorrect Username and/or Password!');
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.get('/home', function(request, response) {
    if (request.session.loggedin) {
        var context = request.session.username;
        response.render('home', {name: context});
    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.get('/submit-job', function(request, response) {
  if (request.session.loggedin) {
      var username = request.session.username;
      var userId = request.session.userId;

      // Get list of job categories.
      connection.query('SELECT * FROM JobsCategories', [], function(error, results, fields) {
        if (results.length > 0) {
          var categories = results;
          response.render('submit-job', {name: username, userId: userId, categories: categories});
        } else {
            response.send('Failed to load page.');
        }
      });

  } else {
      response.send('Please login to view this page!');
      response.end();
  }
});

app.post('/submit-job', function(req,res){
	var ownerId = req.body.ownerId
	var jobPostedDate = req.body.jobPostedDate
	var jobTitle = req.body.jobTitle
	var jobCategory = req.body.categoryId
	var completionDate = req.body.jobExpectedCompletionDate
	var genLocation = req.body.location
	var jobDetail = req.body.jobDetails

	var mysql = req.app.get('mysql');
	var sql = "INSERT INTO Jobs (ownerID, jobPostedDate, jobTitle, categoryId, jobExpectedCompletionDate, location, jobDetails) VALUES (?,?,?,?,?,?,?)";
	
	var inserts = [ownerId, jobPostedDate, jobTitle, jobCategory, completionDate, genLocation, jobdetail];

	connection.query(sql,inserts,function(error,res,field){
		if(error){
			console.log(JSON.stringify(error));
			res.write(JSON.stringify(error));
			res.end();
		}
		else{
			res.redirect('/?success=true');
		}
	});
});

app.post('/createAccount', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var mysql = req.app.get('mysql');
    var sql = "INSERT INTO Users (userName, pword, email) VALUES (?,?,?)";
    var inserts = [req.body.username, req.body.password, req.body.email];
    connection.query(sql,inserts,function(error, results, fields){
        if(error){
            console.log(JSON.stringify(error))
            res.write(JSON.stringify(error));
            res.end();
        }else{

            res.redirect('/?success=true');
        }
    });
});


app.get('/view-jobs', function(request, response) {
    var context = {};
    var sql = "SELECT * from Jobs"
    connection.query(sql, function(error, results){
        if(error){
            response.write(JSON.stringify(error));
            response.end();
        }
        context.jobs = results;
        response.render('view-jobs', context);
        }) 
});


app.get('/view-jobs/:jobId', function(req, res, next){
    var context = {};
    var sql = "SELECT * from Jobs WHERE jobId = ?";
    var inserts = [req.params.jobId];
    connection.query(sql, inserts, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        context.job = results[0];
        res.render('submit-bid', context);
    });
});


app.post('/view-jobs', function(req, res){
    var sql = "INSERT into Bids (price, comments, completionEst, vendorId, jobId) VALUES (?,?,?,?,?)";
    var inserts = [req.body.bidPrice, req.body.bidComments, req.body.bidCompletionDate, req.body.bidVendorId, req.body.bidJobId];
    connection.query(sql, inserts, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        else{
            res.render('bid-success');
        }
    });
});

app.get('/review', function(request, response) {
    if (request.session.loggedin) {
		var context = {};
		var sql = "SELECT * from Users"
		connection.query(sql, function(error, results){
        if(error){
            response.write(JSON.stringify(error));
            response.end();
        }
        context.user = results;
        response.render('review', context);
        }) 

    } else {
        response.send('Please login to view this page!');
        response.end();
    }
});

app.post('/review', function(req,res){
	var UserID = req.body.UserID;
	var Rating = req.body.Rating;
	var RatingDetails = req.body.RatingDetails;
	
	var mysql = req.app.get('mysql');
	var sql = "INSERT into UserRatings (UserID, Rating, RatingDetails) VALUES (?,?,?);
	var inserts = [req.body.UserID, req.body.Rating, req.body.RatingDetails];
	
	connection.query(sql,inserts, function(error,result,field){
		if(error){
			console.log(JSON.stringify(error));
			res.write(JSON.stringify(error));
			res.end();
		}
		else{
			res.redirect('/home');
		}
	});
});


//boilerplate 404 code
app.use(function(req,res){
    res.status(404);
    res.send('Error 404 - Page Is Nowhere to be Found');
});

//boilerplate 500 code
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.send('Error 500 - Server cannot process request');
});


app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
