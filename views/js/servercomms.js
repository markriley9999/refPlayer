// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// Server Comms Module                                                                     //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

/*global io */

window.InitServerComms = function(bServerGUI) { 

    var socket = io();


    function post(url, out) {
        // send a xhr/ajax POST request with the serialized media events
        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", url, true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
        xhttp.send(out);
    }


    return {

        Connect		: function () {
        },
		
        Disconnect		: function (f) {
            socket.on("disconnect", function() {
                if (f) f();
            });

            socket.disconnect();	
        },
		
        EmitBufferEvent	: function (id, v, vb, buffV, hb, buffD, tm, annot) {
            if (!bServerGUI) return;
			
            var pObj;
            

            if (v) {    
                pObj = {
                    "class"         : vb.getAttribute("class"),
                    "value"         : buffV,
                    "max"           : vb.max,
                    "currentTime"   : v.currentTime,
                    "resumeFrom"    : v.resumeFrom,
                    "duration"      : v.duration 
                }
            } else {
                pObj = {
                    "class"         : "bufferBar",
                    "value"         : 0,
                    "max"           : 0,
                    "currentTime"   : 0,
                    "resumeFrom"    : 0,
                    "duration"      : 0 
                }
            }

            pObj.id = id;
            pObj.time = tm;
            pObj.annotation = annot;

            var mainObj = {};
            
            mainObj.playerBufferObj = pObj;
            
    
            var hObj = {};
            
            if (v)	{
                hObj = {
                    "class" : hb.getAttribute("class"),
                    "value" : buffD,
                    "max"   : hb.max
                }
            } else {
                hObj = {
                    "class" : "bufferBar",
                    "value" : 0,
                    "max"   : 0
                }
            }
            hObj.id = id;
            			
            mainObj.headroomBufferObj = hObj;
            
            var out = JSON.stringify(mainObj);

            socket.emit("bufferEvent", out);
        },
		
        EmitJustCurrentTime	: function (id, t, d, tm, annot) {
            if (!bServerGUI) return;

            var pObj = {
                "id"            : id,
                "class"         : "bufferBar",
                "value"         : 0,
                "max"           : 0,
                "currentTime"   : t,
                "resumeFrom"    : 0,
                "duration"      : d,
                "time"          : tm,
                "annotation"    : annot
            }

            hObj = {
                "id"        : id,
                "class"     : "bufferBar",
                "value"     : 0,
                "max"       : 0
            }
            
            var out = JSON.stringify({
                "playerBufferObj" : pObj,
                "headroomBufferObj" : hObj
            });

            socket.emit("bufferEvent", out);
        },
		
        EmitPlaybackOffset	: function (v, m) {
            if (!bServerGUI) return;

            var out = JSON.stringify({"value": v, "max": m});
			
            socket.emit("playbackOffset", out);
        },
		
        StatusUpdate 	: function (id, text) {
            if (!bServerGUI) return;

            var out = "id=" + id + "&" + "text=" + text;
            post("/status", out);
        },

        AdTrans 	: function (id, time) {
            if (!bServerGUI) return;

            var out = "id=" + id + "&" + "time=" + time;
            post("/adtrans", out);
        },

        Log				: function (m) {
            if (!bServerGUI) return;

            var xhttp = new XMLHttpRequest();

            xhttp.open("POST", "/log", true);
            xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
            xhttp.send(m);
        },
		
        SaveLog 		: function (f, l) {
            var xhttp = new XMLHttpRequest();

            xhttp.open("POST", "/savelog?filename=" + f, true);
            xhttp.setRequestHeader("Content-type", "text/plain"); 
            xhttp.send(l);
        }

    };
	
};
