exports.lexer = function () {

    var isOperator = function (c) { return /[+\-*\/\%=(),]/.test(c); },
        isConditional = function(c){ return /^([<\>\!]|&&||||==||!=)$/.test(c)},
        isDigit = function (c) { return /[0-9]/.test(c); },
        isWhiteSpace = function (c) { return /\s/.test(c); },
        isCharacter = function (c) {return /^[a-zA-Z]+$/.test(c)},
        isSpecialCharacter = function (c) {return /^[!@#\$%\^\&*\)\(+=._-]+$/.test(c)};

    var fs = require('fs');

    var keyWords = JSON.parse(fs.readFileSync("./keyWords.json", "utf8"));
    
    var identifiers = [], errorStackTrace = {};
    var MAIN;

    this.analyse = analyseMain;

    function analyseMain (main) {
        identifiers = [];
        MAIN = main;
        var keys = Object.keys(main), kLength = keys.length, kWordIndex = -1;
        for (var i = 0; i < kLength; i++) {
            kWordIndex = keyWords.general.indexOf(keys[i]);
            if (kWordIndex > -1) {
                if (keys[i] === 'scope') {
                    analyseScope(main.scope);
                } else if (keys[i] === 'coment') {
                    analyseComent(main.coment);
                }
            } else {
                errorHandler(keys[i], 'Main');
            }
        }
        var obj = {
            identifiers:identifiers 
        }
        fs.writeFile( "identifiers.json", JSON.stringify(obj, null, 2), "utf8");
        return true;
    }

    function analyseScope (currentScope, functionName) {
        var keys = Object.keys(currentScope), kLength = keys.length,
            kWordIndex = -1;
        for (var i = 0; i < kLength; i++) {
            kWordIndex = keyWords.scope.indexOf(keys[i]);
            if (kWordIndex > -1) {
                if (keys[i] === 'var') {
                    resolveIdentifiers(currentScope.var);
                } else if (keys[i] === 'if') {
                    analyseIf(currentScope.if);
                } else if (keys[i] === 'for') {
                    analyseFor(currentScope.for);
                } else if (keys[i] === 'coment') {
                    analyseComent(currentScope.coment);
                } else if (keys[i] === 'write') {
                    analyseWrite(currentScope.write);
                } else if (keys[i] === 'functions') {
                    analyseFunctions(currentScope.functions);
                } else if (keys[i] === 'return') {
                    analyseAssignment(currentScope.return, functionName);
                }
            } else {
                if(identifiers.indexOf(keys[i]) > -1) {
                    analyseAssignment(currentScope[keys[i]]);
                } else if (identifiers.indexOf(keys[i] + "_func") > -1) {
                    analyseFunctionCall(currentScope[keys[i]], keys[i]);
                } else {
                    errorHandler(keys[i], 'Scope');
                } 
            }
        }
    }

    function analyseFunctionCall (call, functionName) {
        for(var i = 0; i < call.length; i++) {
            if (identifiers.indexOf(call[i].to) === -1) {
                throw('identifier ' + call[i].to + ' not defined')
            }
        }
    }

    function analyseAssignment (varObj, functionName) {
        var expression = varObj.split(' ');
        var expression = expression.map(function (a) {
            return isOperator(a) ? a : a + "_" + functionName;
        });

        var len = expression.length,
            firstItem = expression.splice(0,1);
        checkParentheses(varObj);

        if (isDigit(firstItem[0])) {
            expressionAnalyseDigit(expression);
        } else if (isCharacter(firstItem[0]) || firstItem[0].indexOf("_") > -1) {
            if (identifiers.indexOf(firstItem[0]) === -1) {
                if (firstItem[0].indexOf("_") > -1) {
                    var functionLog = firstItem[0].split("_");
                    throw('Identifier ' + functionLog[0] + ' is not defined in function ' + functionLog[1]);
                } else {
                   throw('Identifier ' + firstItem[0] + ' is not defined');
                }
            }
            expressionAnalyseCharacter(expression);
        } else if (isOperator(firstItem[0])) {
            expressionAnalyseOperator(expression, firstItem[0]);
        }  else {
            throw('invalid expression');
        }
    }

    function checkParentheses (varObj) {
        var len = varObj.length,
            expression = varObj.split(' '),
            countRight = 0,
            countLeft = 0;

        for (var i = 0; i < expression.length; i++) {
            if (expression[i] === '(') {
                expression.splice(i, 1);
                countRight++;
                for (var j = 0; j < expression.length; j++) {
                    if (expression[j] === ')') {
                        expression.splice(j, 1);
                        countLeft++;
                        break;
                    }
                }
            }
        }

        if (expression.indexOf('(') > -1 || expression.indexOf(')') > -1 || countRight !== countLeft) {
            throw('Error in Parentheses')
        }
    }

    function expressionAnalyseDigit (expression) {
        var len = expression.length,
            firstItem = expression.splice(0,1);
        if (len > 0 && firstItem[0]) {
            if (isOperator(firstItem[0])) {
                expressionAnalyseOperator(expression, firstItem[0]);
            } else {
                throw('invalid expression');
            }
        }
    }

    function expressionAnalyseCharacter (expression) {
        var len = expression.length,
            firstItem = expression.splice(0,1);
        if (len > 0 && firstItem[0]) {
            if (isOperator(firstItem[0]) || firstItem[0].indexOf("_") > -1) {
                expressionAnalyseOperator(expression, firstItem[0]);
            } else {
                throw('invalid expression');
            }
        }
    }

    function expressionAnalyseOperator (expression, actualOperator) {
        var len = expression.length,
            firstItem = expression.splice(0,1);
        if (len > 0 && firstItem[0]) {
            if (isDigit(firstItem[0])) {
                expressionAnalyseDigit(expression);
        } else if (isCharacter(firstItem[0]) || firstItem[0].indexOf("_") > -1) {
                if (identifiers.indexOf(firstItem[0]) === -1) {
                    if (firstItem[0].indexOf("_") > -1) {
                        var functionLog = firstItem[0].split("_");
                        throw('Identifier ' + functionLog[0] + ' is not defined in function ' + functionLog[1]);
                    } else {
                       throw('Identifier ' + firstItem[0] + ' is not defined');
                    }
                }
                expressionAnalyseCharacter(expression);
            } else if (isOperator(firstItem[0])) {
                expressionAnalyseOperator(expression, firstItem[0]);
            } else {
                throw('invalid expression');
            }
        } else if (actualOperator != ')'){
            throw('invalid expression');
        }
    }

    function resolveIdentifiers (vars) {
        var len = vars.length;
        for (var i = 0; i < len ; i++) {
            analyseIdentifier(vars[i]);
            identifiers[identifiers.length] = vars[i];
        }
    }

    function analyseIdentifier (identifier) {
        if (identifier.indexOf(" ") > -1 || isDigit(identifier[0])|| isSpecialCharacter(identifier)) {
            throw ("Invalid identifier name");
        }
        if (identifiers.indexOf(identifier) > -1) {
            throw ("Identifier already defined");
        }
    }

    function analyseIf (ifObj) {
        var keys = Object.keys(ifObj), kLength = keys.length,
            kWordIndex = -1;
        for (var i = 0; i < kLength; i++) {
            kWordIndex = keyWords.if.indexOf(keys[i]);
            if (kWordIndex > -1) {
                if (keys[i] === 'scope') {
                    analyseScope(ifObj.scope);
                } else if (keys[i] === 'condition') {
                    analyseCondition(ifObj.condition);
                } else if (keys[i] === 'else') {
                    analyseElse(ifObj.else);
                } else if (keys[i] === 'coment') {
                    analyseComent(currentScope.coment);
                }
            } else {
                errorHandler(keys[i], 'If');
            }
        }
    }

    function analyseElse(elseObj) {
        var keys = Object.keys(elseObj), kLength = keys.length,
            kWordIndex = -1;
        for (var i = 0; i < kLength; i++) {
            kWordIndex = keyWords.else.indexOf(keys[i]);
            if (kWordIndex > -1) {
                if (keys[i] === 'scope') {
                    analyseScope(elseObj.scope);
                } else if (keys[i] === 'condition') {
                    analyseCondition(elseObj.condition);
                } else if (keys[i] === 'coment') {
                    analyseComent(currentScope.coment);
                }
            } else {
                errorHandler(keys[i], 'Else');
            }
        }
    }

    function analyseCondition (condObj) {
        var len = condObj.length;
        condObj = condObj.split('==').join('').split('!=').join('').split('||').join('').split('&&').join('');
        for (var i = 0; i < len; i++) {
            if (!isConditional(condObj[i]) && !isCharacter(condObj[i]) && !isDigit(condObj[i]) && !isWhiteSpace(condObj[i])) {
                throw('Condition Invalid');
            }
        }
    }

    function analyseFor (forObj) {
        var keys = Object.keys(forObj), kLength = keys.length,
            kWordIndex = -1;
        for (var i = 0; i < kLength; i++) {
            kWordIndex = keyWords.for.indexOf(keys[i]);
            if (kWordIndex > -1) {
                if (keys[i] === 'scope') {
                    analyseScope(forObj.scope);
                } else if (keys[i] === 'var') {
                    resolveIdentifiers(forObj.var)
                } else if (keys[i] === 'condition') {
                    analyseCondition(forObj.condition);
                } else if (keys[i] === 'do') {
                    analyseDo(forObj.do);
                } else if (keys[i] === 'coment') {
                    analyseComent(currentScope.coment);
                }
            } else {
                errorHandler(keys[i], 'For');
            }
        }
    }

    function analyseDo (doObj) {
        var len = doObj.length;
        for (var i = 0; i < len; i++) {
            if (!isCharacter(doObj[i]) && !isDigit(doObj[i]) && !isOperator(doObj[i]) && !isWhiteSpace(doObj[i])) {
                throw('Invalid loop');
            }
        }
    }

    function analyseComent (comentObj) {
    }

    function analyseWrite (writeObj) {
        if(identifiers.indexOf(writeObj) === -1) {
            throw("invalid identifier");
        }
        console.log(writeObj);
    }

    function analyseFunctions (functions) {
        for (var i = 0; i < functions.length; i++) {
            analyseFunction(functions[i]);
        }
    }

    function analyseFunction (functionObj) {
        var keys = Object.keys(functionObj), kLength = keys.length,
            kWordIndex = -1;
        for (var i = 0; i < kLength; i++) {
            kWordIndex = keyWords.function.indexOf(keys[i]);
            if (kWordIndex > -1) {
                if (keys[i] === 'scope') {
                    analyseScope(functionObj.scope, functionObj.name);
                } else if (keys[i] === 'parameters') {
                    analyseParameters(functionObj.parameters,functionObj.name);
                } else if (keys[i] === 'name') {
                    resolveIdentifiers([functionObj.name + "_func"]);
                } else if (keys[i] === 'coment') {
                    analyseComent(functionObj.coment);
                }
            } else {
                errorHandler(keys[i], 'Function');
            }
        }
    }

    function analyseParameters (parametersObj, functionName) {
        for (var i = 0; i < parametersObj.length ; i++) {
            analyseIdentifier(parametersObj[i] + "_" + functionName);
            resolveIdentifiers([parametersObj[i] + "_" + functionName]);
        }
    }

    function errorHandler (key, scope) {
        console.log("ERROR STACK TRACE: " + JSON.stringify(errorStackTrace));
        if (keyWords.all.indexOf(key) > -1) {
            throw('Invalid property ' + key + ' in scope : ' + scope);
        } else if (identifiers.indexOf(key) === -1) {
            throw('Identifier ' + key + ' is not defined');
        } else {
            throw('Assignment out of Scope');
        }
    }
}