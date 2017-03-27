var Lexer = require('./lexer.js').lexer,
    lexerAnalyser = new Lexer(),
    fs = require('fs');


exports.lexicalAnalysis = function (code) {
    return lexerAnalyser.analyse(code.main);
};
code = fs.readFileSync("./main.json", "utf8");
this.lexicalAnalysis(JSON.parse(code));
