// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// Logging Module                                                                          //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

function InitLog(srvComms) { 

    var lastLogTime = Date.now();
    var logStr 		= "";

    function write(message, cssClass) {
        var log, nextLog, logText, elapsedTime;
		
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
            console.error(message);
        },

        warn 	: function (message) {
            write("WARN: " + message, "warn");
            console.warn(message);
        },

        info 	: function (message) {
            write("INFO: " + message, "info");
            console.info(message);
        },

        debug 	: function (message) {
            write("DEBUG: " + message, "debug");
            console.trace(message);
        },
		
        SaveLog	: function (f) {
            if (srvComms) {
                srvComms.SaveLog(f, logStr);
            }
        }
    };
}
