# JSONLangInterpreter
That is a college work that I did in 2015 that is a compiler which interprets a JSON based language.

The objective of that work was to develop a simple interpreter that should be able to do lexical analysis, syntax analysis and semantic analysis for a language and found errors in the interpreted code.

The language proposed by me in this work was based in JSON.

Example of code in JSONLang:

```{
    "coment":"Prog Principal",
        "main": {
            "scope":{
                "var":["cont"],
                "cont":"soma(cont,5)",
                "coment":"Somar Numeros",
                "function":{
                    "name":"soma",
                    "parameters":["x","y"],
                    "scope":{
                        "var":["saida"],
                        "expression":"saida = x + y",
                        "return":"saida"
                        }
                }
            }
        }
}```

To run that project you just have to do npm install and execute the file app.js via node app.js

The project has a built in code editor, when you execute the file app.js the editor can be accessed in the link http://localhost:8080/index.

The code interpreted can be writed in the editor or in the file main.json.

P.S. This repository it's just to me save my college work. You probably dont want to read this code.