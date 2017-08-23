function SetupEME(video, keySystem, name, options, contentTag)
{
	function e(id) {
	  return document.getElementById(id);
	}

	// TODO: mVid should be a param
	function log(msg) {
		mVid.Log.info("EME: " + msg);
	}

	function logerr(msg) {
		mVid.Log.error("EME: " + msg);
	}

	function bail(message)
	{
	  return function(err) {
		logerr(message + (err ? " " + err : ""));
	  }
	}

	function ArrayBufferToString(arr)
	{
	  var str = '';
	  var view = new Uint8Array(arr);
	  for (var i = 0; i < view.length; i++) {
		str += String.fromCharCode(view[i]);
	  }
	  return str;
	}

	function StringToArrayBuffer(str)
	{
	  var arr = new ArrayBuffer(str.length);
	  var view = new Uint8Array(arr);
	  for (var i = 0; i < str.length; i++) {
		view[i] = str.charCodeAt(i);
	  }
	  return arr;
	}

	function Base64ToHex(str)
	{
	  var bin = window.atob(str.replace(/-/g, "+").replace(/_/g, "/"));
	  var res = "";
	  for (var i = 0; i < bin.length; i++) {
		res += ("0" + bin.charCodeAt(i).toString(16)).substr(-2);
	  }
	  return res;
	}

	function HexToBase64(hex)
	{
	  var bin = "";
	  for (var i = 0; i < hex.length; i += 2) {
		bin += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	  }
	  return window.btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
	}

	// TODO: Add content id - and add to clearkeyGetLicence call
	function UpdateSessionFunc(name, contentTag) {
	  return function(ev) {
		clearkeyGetLicence(ev.target, ev.message, contentTag, video);
	  }
	}

	function KeysChange(event) {
	  var session = event.target;
	  log("keystatuseschange event on session" + session.sessionId);
	  var map = session.keyStatuses;
	  for (var entry of map.entries()) {
		var keyId = entry[0];
		var status = entry[1];
		var base64KeyId = Base64ToHex(window.btoa(ArrayBufferToString(keyId)));
		log("SessionId=" + session.sessionId + " keyId=" + base64KeyId + " status=" + status);
	  }
	}

	var ensurePromise;

	function EnsureMediaKeysCreated(video, keySystem, options, encryptedEvent) {
	  // We may already have a MediaKeys object if we initialized EME for a
	  // different MSE SourceBuffer's "encrypted" event, or the initialization
	  // may still be in progress.
	  if (ensurePromise) {
		return ensurePromise;
	  }

	  log("navigator.requestMediaKeySystemAccess("+ JSON.stringify(options) + ")");

	  ensurePromise = navigator.requestMediaKeySystemAccess(keySystem, options)
		.then(function(keySystemAccess) {
		  return keySystemAccess.createMediaKeys();
		}, bail(name + " Failed to request key system access."))

		.then(function(mediaKeys) {
		  log(name + " created MediaKeys object ok");
		  return video.setMediaKeys(mediaKeys);
		}, bail(name + " failed to create MediaKeys object"))

	  return ensurePromise;
	}

	function arrayBufferToString(buffer){
		var arr = new Uint8Array(buffer);
		var str = String.fromCharCode.apply(String, arr);
		return str;
	}
	
	video.addEventListener("encrypted", function(ev) {
		log(name + " got encrypted event - (initDataType: " + ev.initDataType + ", initData: " +  arrayBufferToString(ev.initData) + ")");

		if (!video.bProcessingKey) { 
			video.bProcessingKey = true;
			EnsureMediaKeysCreated(video, keySystem, options, ev)
			.then(function() {
				log(name + " ensured MediaKeys available on HTMLMediaElement");
				var session = video.mediaKeys.createSession();
				session.addEventListener("message", UpdateSessionFunc(name, contentTag));
				session.addEventListener("keystatuseschange", KeysChange);
				return session.generateRequest(ev.initDataType, ev.initData);
			  }, bail(name + " failed to ensure MediaKeys on HTMLMediaElement"))

			  .then(function() {
				log(name + " generated request");
			  }, bail(name + " Failed to generate request."));
		} else {
			logerr(name + "Error: multiple encrypted events!");
		}
	});
}
