//Variables to set - process.env.SMB_AUTH

var g_host = process.env.SMB_HOST;
var g_port = process.env.SMB_PORT;
var g_reportAPI = process.env.SMB_REPORTAPI;
var g_dataAPI = process.env.SMB_DATAAPI;

exports.handler = function (event, context) {
    try {
        //console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * prevent someone else from configuring a skill that sends requests to this function.
         * To be uncommented when SKill is ready
        
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.c014e6d6-a7a4-44ee-8b2f-9b10c7969743") {
             context.fail("Invalid Application ID");
        }p
         */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,event.session, function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") { 
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        //context.fail("Exception: " + e);
        console.log('exception: ' + e.message);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);
     // Dispatch to skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    console.log(intentRequest);
    var intent = intentRequest.intent;
    intentName = extractValue('PreviousIntent', intent, session);

    console.log('CURRENT Intent is ' + intent.name);
    console.log('PREVIOUS intent was ' + intentName);

    if ("AMAZON.StopIntent" === intent.name ||
        "AMAZON.CancelIntent" === intent.name) {
        handleSessionEndRequest(callback);
    }

    if (intentName === null) {
        intentName = intent.name;
    }

    // Dispatch to your skill's intent handlers
    switch (intentName) {
        case "SayHello":
            sayHello(intent, session, callback);
            break;

        case "SalesInfo":
            getSalesInfo(intent, session, callback);
            break;

        // case "MakePurchase":
        //     postPurchase(intent, session, callback);
        //     break;

        case "AMAZON.HelpIntent":
            getWelcomeResponse(callback);
            break;

        default:
            throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +", sessionId=" + session.sessionId);
}

// --------------- Functions that control the skill's behavior -----------------------
function getWelcomeResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = getWelcomeMessage();

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = 'What is my command, master?';
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    //var speechOutput = "Thank you for using B1 Assistant. Have a nice day!";
    var speechOutput = "Okay.";

    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}


/**
 * B1 Interactions
 */
function sayHello(intent, session, callback) {

    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    speechOutput = "Hi there! I am the Be One Assistant. I am here to help you with the Hackathon! Let's whin this shit!"

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


function getSalesInfo(intent, session, callback) {

    //Default
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    var SalesQuarter = extractValue('SalesQuarter', intent, session)
    var SalesYear = extractValue('SalesYear', intent, session)

    sessionAttributes = handleSessionAttributes(sessionAttributes, 'SalesQuarter', SalesQuarter);
    sessionAttributes = handleSessionAttributes(sessionAttributes, 'SalesYear', SalesYear);

    if (SalesQuarter == null) {
        speechOutput = "For What quarter?";
        repromptText = "Tell me the quarter and the year.";
    } else if (SalesYear == null) {
        speechOutput = "What year do you need?";
        repromptText = "You can do it, tell me a year.";
    } else {

        var oDataEndpoint = "/SalesAnalysisByDocumentQuery"
        var odataFilter =   "$apply=groupby((PostingYear, PostingQuarter, BusinessPartnerCurrency),"+
                            "aggregate($count as ItemCode_COUNT, NetSalesAmountLC with sum as NetSalesAmountLC_SUM))"+
                            "&$filter=PostingYear eq "+quotes(SalesYear)+
                            " and PostingQuarter eq "+quotes(SalesQuarter);
        
        //Replace Blank spaces
        odataFilter = odataFilter.replace(/ /g, "%20");

        getCall(true, oDataEndpoint, odataFilter, function (response) {
                console.log("response is " + response);
                response = response.value

                if (response.length == 0) {
                    speechOutput = "I am sorry, but there are no" +
                        " sales in the " + SalesQuarter + " quarter of " + SalesYear;
                } else {
                    speechOutput = "The sales for the " + stringQuarter(SalesQuarter) + " quarter of " +
                    SalesYear + " are " + response[0].NetSalesAmountLC_SUM + " " +
                    response[0].BusinessPartnerCurrency+".";

                    for (var i = 1; i < response.length; i++) {
                        speechOutput+="And also "+response[i].NetSalesAmountLC_SUM + " " +
                        response[i].BusinessPartnerCurrency+".";
                    }
                   
                }
                shouldEndSession = true;

                // call back with result
                callback(sessionAttributes,
                    buildSpeechletResponse(
                        intent.name, speechOutput,
                        repromptText, shouldEndSession
                    )
                );
            }
        );
        return;
    }

    sessionAttributes = handleSessionAttributes(sessionAttributes, 'PreviousIntent', intent.name);


    // Call back while there still questions to ask
    callback(sessionAttributes,
        buildSpeechletResponse(
            intent.name, speechOutput,
            repromptText, shouldEndSession
        )
    );
}


// function postPurchase(intent, session, callback) {

//     //Default
//     var repromptText = null;
//     var sessionAttributes = {};
//     var shouldEndSession = false;
//     var speechOutput = "";

//     var ItemName = extractValue('ItemName', intent, session)
//     var Quantity = extractValue('Quantity', intent, session)

//     sessionAttributes = handleSessionAttributes(sessionAttributes, 'ItemName', ItemName);
//     sessionAttributes = handleSessionAttributes(sessionAttributes, 'Quantity', Quantity);
//     sessionAttributes = handleSessionAttributes(sessionAttributes, 'PreviousIntent', intent.name);


//     if (ItemName == null) {
//         speechOutput = "Should I get you a compressor, a gas boiler or maybe a stove?.";
//         repromptText = "You can say. I need a gas boiler. Or Buy me a stove";
//     } else if (Quantity == null) {
//         speechOutput = "Ok, how many do you need?";
//         repromptText = "Tell me the quantity you need.";
//     } else {

//         /* ByD Requires a CSRF Token in every POST Request.
//         This token is provided by a GET with Authentication */
//         getCall("/", "", function (body, response) { //Callback Function

//             console.log("response is " + response);
//             if (response.statusCode != 200) {
//                 speechOutput = "I am sorry, but there was an error processing this request";
//             } else {

//                 var http = require('request');

//                 var body = {
//                     "ExternalReference": "From Alexa",
//                     "DataOriginTypeCode": "1",
//                     "Name": "Order created via Alexa on " + getDateTime(true),
//                     "SalesOrderBuyerParty": {
//                         "PartyID": process.env.SMB_DEFAULT_BP
//                     },
//                     "SalesOrderItem": [
//                         {
//                             "ID": "10",
//                             "SalesOrderItemProduct": {
//                                 "ProductID": getByDProduct(ItemName)
//                             },
//                             "SalesOrderItemScheduleLine": [
//                                 {
//                                     "Quantity": Quantity
//                                 }
//                             ]
//                         }
//                     ]
//                 }

//                 var options = {
//                     uri: g_host + g_port + g_reportAPI + "/SalesOrderCollection",
//                     headers: {
//                         "Accept": "application/json",
//                         "Content-Type": "application/json",
//                         "x-csrf-token": response.headers["x-csrf-token"], //Damm Token
//                         "cookie": response.headers["set-cookie"]
//                     },
//                     body: JSON.stringify(body)
//                 };

//                 console.log('start request to ' + options.uri)

//                 http.post(options, function (error, res, body) {
//                     console.log("Response: " + res.statusCode);
//                     if (!error && res.statusCode == 201) {

//                         body = JSON.parse(body);
//                         body = body.d.results;
//                         console.log("Order " + body.ID + " created!")

//                         speechOutput = "Your order number " + body.ID + " was placed successfully! " +
//                             "The total amount of your purchase is " + body.NetAmount +
//                             " " + body.currencyCode;

//                         shouldEndSession = true;
//                     }
//                     else {
//                         speechOutput = "I am sorry, but there was an error creating your order.";
//                     }

//                     // call back with result
//                     callback(sessionAttributes,
//                         buildSpeechletResponse(
//                             intent.name, speechOutput,
//                             repromptText, shouldEndSession)
//                     );
//                 });

//             }
//         })
//         return
//     }
//     // Call back while there still questions to ask
//     callback(sessionAttributes,
//         buildSpeechletResponse(
//             intent.name, speechOutput,
//             repromptText, shouldEndSession
//         )
//     );
// }

function getCall(isReport, endPoint, filter, callback) {
    endPoint +=  "?$format=json&" 
    var http = require('request');

    var options = {
        uri: g_host +":"+ g_port + (isReport?g_reportAPI:g_dataAPI)+ endPoint + filter,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Basic " + process.env.SMB_AUTH,
            "x-csrf-token": "fetch"
        }
    };

    console.log('start request to ' + options.uri)

    http.get(options, function (error, res, body) {
        console.log("Response: " + res.statusCode);
        if (!error && res.statusCode == 200 || res.statusCode == 201) {
            var parsed = JSON.parse(body);
            callback(parsed, res);
        }
        else {
            console.log("Error message: " + error);
            callback(false)

        }
    });
}

// --------------- Handle of Session variables -----------------------
function extractValue(attr, intent, session) {

    console.log("Extracting " + attr);

    if (session.attributes) {
        if (attr in session.attributes) {
            console.log("Session attribute " + attr + " is " + session.attributes[attr]);
            return session.attributes[attr];
        }
    }

    console.log("No session attribute for " + attr);

    if (intent.slots) {
        if (attr in intent.slots && 'value' in intent.slots[attr]) {
            var slot = intent.slots[attr]
            try{
                //Try to returns slot ID otherwise returns slot value
                return slot.resolutions.resolutionsPerAuthority[0].values[0].value.id
            }catch (e){
                return intent.slots[attr].value;
            }
        }
    };
    return null;
}


function handleSessionAttributes(sessionAttributes, attr, value) {

    //if Value exists as attribute than returns it
    console.log("Previous " + attr + "is: " + value)
    if (value) {
        sessionAttributes[attr] = value;
    }
    return sessionAttributes;
}

// --------------- Auxiliar Functions Formatting -----------------------

function quotes(val) {
    return "%27" + val + "%27";
}

function op(op) {
    return "%20" + op + "%20";
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function stringQuarter(input) {

    if (input == '01' || input == 'Q1') {
        return 'first';
    }

    if (input == '02' || input == 'Q2') {
        return 'second';
    }

    if (input == '03' || input == 'Q3') {
        return 'third';
    }

    if (input == '04' || input == 'Q4') {
        return 'fourth';
    }

}

// function formatItemGrp(itemGrp) {
//     //Assures the item group name is formatted correctly

//     itemGrp = itemGrp.toLowerCase();

//     if (itemGrp == 'pc') {
//         return 'PC';
//     }
//     return toTitleCase(itemGrp)
// }

// function toTitleCase(str) {
//     //Capitlize the first letter of each word on a given string
//     return str.replace(/\w\S*/g, function (txt) {
//         return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
//     });
// }

// function getDateTime(withHour) {
//     var currentdate = new Date();
//     var datetime = currentdate.getFullYear() + "-"
//         + (currentdate.getMonth() + 1) + "-"
//         + currentdate.getDate();

//     if (withHour) {
//         datetime += " @ "
//             + currentdate.getHours() + ":"
//             + currentdate.getMinutes() + ":"
//             + currentdate.getSeconds();
//     }

//     return datetime;
// }

// function getByDProduct(item) {
//     item = formatItemGrp(item);

//     if (item == "Boiler")
//         return "P100401";

//     if (item == "Stove")
//         return "P110401";

//     if (item == "Compressor")
//         return "P120101";
//     return "";

// }


// -------------------- Speech Functions Formatting -----------------------
function getWelcomeMessage() {
    var message = [];

    message[0] = "Welcome to the SMB Summit Hackathon. How can I help?"
    return message[getRandomInt(0, message.length - 1)];
}

// --------------- Helpers that build all of the responses -----------------------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    console.log("ALEXA: "+output);
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Standard",
            title: title,
            text: output,
            image: {
                smallImageUrl: "https://i.imgur.com/ZJFFyRa.png"
            }
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}