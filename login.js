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
        connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
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
        response.send('Welcome back, ' + request.session.username + '!');
    } else {
        response.send('Please login to view this page!');
    }
    response.end();
});



app.post('/createAccount', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var mysql = req.app.get('mysql');
    var sql = "INSERT INTO accounts (username, password, email) VALUES (?,?,?)";
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

//FIXME
//Commented out query until jobs table is added to mySQL
app.get('/view-jobs', function(request, response) {
/*  var callbackCount = 0;
    var context = {};
    var mysql = req.app.get('mysql');
    var sql = "SELECT * from Jobs"
    connection.query(sql, function(error, results, fields){
        if(error){
            res.write(JSON.stringify(error));
            res.end();
        }
        context.jobs = results[0];
        }) */
	response.render('view-jobs'/*, context*/);
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