/**
 * This code implements an integration of SAP Business by Design with Amazon Echo
 * It is a fork from the B1 Assistant - A SAP Business One Integration with Amazon Echo 
 * See at: (https://github.com/B1SA/b1Assistant/)
 * 
 */

// Environment Variables with Backend Credentials
var g_hdbServer = process.env.SMB_SERVER;
var g_hdbPort = process.env.SMB_PORT;
var g_hdbService = process.env.SMB_PATH;

exports.handler = function (event, context) {
    try {
        console.log("Request Received")
    } catch (e) {
        //context.fail("Exception: " + e);
        console.log('exception: ' + e.message);
    }
};

/**
 * Called when the session starts.
 */
