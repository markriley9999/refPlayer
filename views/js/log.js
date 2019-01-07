// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// Logging Module                                                                          //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

/*eslint no-console: "error"*/

window.InitLog = function(srvComms) { 

    var lastLogTime = Date.now();
    var logStr 		= "";

    function write(message, cssClass) {
        var logText, elapsedTime;
		
        elapsedTime = ("000000" + (Date.now() - lastLogTime)).slice(-6);
        lastLogTime = Date.now();
		
        logText = elapsedTime + "ms:" + message;
        logStr += logText + "\r\n";
		
        var out = "cssClass=" + cssClass + "&";
        out += "logText=" + logText;
		
        if (srvComms) {
            srvComms.Log(out);
        }
    }

    return {
        error 	: function (message) {
            write("ERROR: " + message, "error");
            // eslint-disable-next-line no-console
            console.error(message);
        },

        warn 	: function (message) {
            write("WARN: " + message, "warn");
            // eslint-disable-next-line no-console
            console.warn(message);
        },

        info 	: function (message) {
            write("INFO: " + message, "info");
            // eslint-disable-next-line no-console
            console.info(message);
        },

        debug 	: function (message) {
            write("DEBUG: " + message, "debug");
            // eslint-disable-next-line no-console
            console.trace(message);
        },
		
        SaveLog	: function (f) {
            if (srvComms) {
                srvComms.SaveLog(f, logStr);
            }
        }
    };
};
