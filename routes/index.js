
/*
 * GET home page.
 */
var fs = require('fs');
var gm   = require('gm');
var sys = require('sys')
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }

exports.index = function(req, res){
	res.render('index', { title: 'Portfolio Site' });
};

exports.admin = function(req, res){
	var folder = "";
	if (req.query.folder) folder = req.query.folder;
	var renderVars = {
		title: 'Portfolio Site',
		subtitle: 'Admin Page',
		folder: folder
	};
	var ls = fs.readdirSync(__dirname + "/../data/raw/" + folder + "/");
	for (var i in ls) {
		var t = fs.statSync(__dirname + "/../data/raw/" + folder + "/" + ls[i]);
		ls[i] = {name: ls[i], isFile: t.isFile(), isDirectory: t.isDirectory()};
		ls[i].thumbExists = false;
	}
	renderVars.files = ls;
	res.render('admin', renderVars);
};

exports.generate = function(req, res){
	var folder, file;
	folder = req.query.folder.toLowerCase();
	file = req.query.file;
	var rootPath = fs.realpathSync(__dirname + "/../data/");
	var targetFolder = rootPath + "/thumbs/" + folder;
	var inputFile = rootPath + "/raw/" + folder + "/" + file;
	var dataFile = targetFolder + "/" + "index.json";
	var target = targetFolder + "/" + file.toLowerCase();
	var largeName = target.replace(/(\.[\w\d_-]+)$/i, '_large$1');
	var watermark = rootPath + "/watermark.png"

	if (!fs.existsSync(targetFolder)){
		fs.mkdirSync(targetFolder);
	}

	if (!fs.existsSync(targetFolder)){
		res.json({failure: "Invalid folder layout"});
		throw new Error ("Invalid folder layout");
		return;
	}

	if (!fs.existsSync(inputFile)){
		res.json({failure: "No input file!!!!"});
		return;
	}


	var currentData = {};
	if (fs.existsSync(dataFile)){
		currentData = require(dataFile);
	}

	currentData[file.toLowerCase()]={};

	gm(inputFile).autoOrient()
	.resize(1536,1152)
	.noProfile()
	.size(function (err, size) {

		this.fill("rgba(255,255,255,0.5)", 1)
		.compose("Plus")
		.drawLine(0, 0, size.width, size.height)
		.drawLine(0, size.height, size.width, 0)
		.fontSize(56)
		//.drawText(20, 30, "GMagick!", "Center")
		.write(largeName, function (err) {
			if (!err) {
				console.log('done: '+ inputFile);
				fs.readFile(target, function(err, original_data){
					var data = original_data.toString('base64');
				    currentData[file.toLowerCase()].large=data;
				});
				exec("composite -dissolve 40% -gravity center " + watermark + "  " + largeName + "  " + largeName, puts);
			} else {
				console.log({failure: err, vars: {inputFile: inputFile, target: target}});
			}
		});
	});		

	gm(inputFile).autoOrient()
	.noProfile()
	.resize(240,240)
	.write(target, function (err) {
		if (!err) {
			console.log('done: '+ inputFile);
			fs.readFile(target, function(err, original_data){
				var data = original_data.toString('base64');
			    currentData[file.toLowerCase()].thumb=data;
				fs.writeFile(dataFile, JSON.stringify(currentData, null, "\t"), function(err) {
					if(err) {
						console.log("Could not save JSON: " + dataFile);
						console.log(err);
					}
				}); 
			    res.json({success: data});
			});
		} else {
			console.log({failure: err, vars: {inputFile: inputFile, target: target}});
		}
	});
};
