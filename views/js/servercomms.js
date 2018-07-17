// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// Server Comms Module                                                                     //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

function InitServerComms() { 

	socket = io();


	post = function (url, out) {
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
		
		EmitBufferEvent	: function (id, v, vb, hb, tm, annot) {
			var pObj = "\"playerBufferObj\": {";
			pObj += "\"id\":" + JSON.stringify(id) + ",";
			if (v)	{
				pObj += "\"class\":" + JSON.stringify(vb.getAttribute("class")) + ",";
				pObj += "\"value\":" + JSON.stringify('' + vb.value) + ","; 
				pObj += "\"max\":" + JSON.stringify('' + vb.max) + ",";
				pObj += "\"currentTime\":" + JSON.stringify('' + v.currentTime) + ",";
				pObj += "\"resumeFrom\":" + JSON.stringify('' + v.resumeFrom) + ",";
				pObj += "\"duration\":" + JSON.stringify('' + v.duration) + ",";
			} else {
				pObj += "\"class\":\"bufferBar\",";
				pObj += "\"value\":\"0\","; 
				pObj += "\"max\":\"0\",";
				pObj += "\"currentTime\":\"0\",";
				pObj += "\"resumeFrom\":\"0\",";
				pObj += "\"duration\":\"0\",";	
			}
			pObj += "\"time\":" + JSON.stringify('' + tm) + ",";
			pObj += "\"annotation\":" + JSON.stringify(annot);
			pObj += "}";
			
			var hObj = "\"headroomBufferObj\": {";
			hObj += "\"id\":" + JSON.stringify(id) + ",";
			if (v)	{
				hObj += "\"class\":" + JSON.stringify(hb.getAttribute("class")) + ",";
				hObj += "\"value\":" + JSON.stringify('' + hb.value) + ",";
				hObj += "\"max\":" + JSON.stringify('' + hb.max);
			} else {
				hObj += "\"class\":\"bufferBar\",";
				hObj += "\"value\":\"0\","; 
				hObj += "\"max\":\"0\"";
			}
			hObj += "}";
			
			var out = "{" + pObj + "," + hObj + "}";

			socket.emit('bufferEvent', out);
		},
		
		EmitPlaybackOffset	: function (v, m) {
			var out = "{";
			out += "\"value\":" + JSON.stringify('' + v) + ",";
			out += "\"max\":" + JSON.stringify('' + m);
			out += "}";
			
			socket.emit('playbackOffset', out);
		},
		
		StatusUpdate 	: function (id, text) {
			var out = "id=" + id + "&" + "text=" + text;
			post("/status", out);
		},

		AdTrans 	: function (id, time) {
			var out = "id=" + id + "&" + "time=" + time;
			post("/adtrans", out);
		},

		Log				: function (m) {
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

	}
	
}
