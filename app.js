
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , browserify_express = require('browserify-express');

var app = express();

var bundle = browserify_express({
    entry: __dirname + '/lib/javascript/index.js',
    watch: __dirname + '/lib/javascript/',
    mount: '/js/_javascript.js',
    verbose: true,
    minify: true,
    bundle_opts: { debug: true } // enable inline sourcemap on js files 
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bundle);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

app.get('/admin', routes.admin);

app.get('/folder', routes.folder);

app.get('/adminAlbum', routes.adminAlbum);

app.get('/generate', routes.generate);

app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});