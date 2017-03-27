var express = require('express'),
    app = express(),
    interpreter = require('./interpreter.js'),
    fs = require('fs');

app.get('/index', function(req, res) {
    res.sendfile('./front_end/index.html');
});

app.get('/code', function(req, res) {
    res.json(JSON.parse(fs.readFileSync("./main.json", "utf8")));
});

app.post('/lexicalAnalysis', function (req, res) {
    var code = decodeURIComponent(req.url.split('code=')[1]).replace(/\\/g, '');
    if (!code) {
        code = fs.readFileSync("./main.json", "utf8");
    }

    if (interpreter.lexicalAnalysis(JSON.parse(code))) {
        fs.writeFile( "main.json", code, "utf8");
    }
});

app.listen(process.env.PORT || 8080);