function SetupBroadcastObject(id, container, log)
{
	var bo;
	var mSync;
	
	e = function (id) {
	  return document.getElementById(id);
	}

	log.info("SetupBroadcastObject: " + id);

	if (!e(id)) {
		var bo = document.createElement("object");	

		if (!bo) {
			log.error("SetupBroadcastObject: " + id + " Creation failed!");
			return null;
		}
	
		bo.setAttribute("id", id);

		bo.type = "video/broadcast";
		//bo.setAttribute("type", bo.type);
		bo.style.outline = "transparent";
		bo.setAttribute("class", "broadcast");
		e(container).appendChild(bo);
	}
	

	return {
		bind: function () {
			try {
				log.info("SetupBroadcastObject: bindToCurrentChannel");
				bo.bindToCurrentChannel();
			} catch (e) {
				log.error("Starting of broadcast video failed: bindToCurrentChannel");
			}		
		},
		
		initMediaSync: function (s) {
			try {
				if (oipfObjectFactory.isObjectSupported('application/hbbtvMediaSynchroniser')) {
					log.info("SetupBroadcastObject: createMediaSynchroniser");
					mSync = oipfObjectFactory.createMediaSynchroniser();
					log.info("SetupBroadcastObject: initMediaSynchroniser");
					mSync.initMediaSynchroniser(bo,	s);				
				} else {
					log.error("application/hbbtvMediaSynchroniser not supported.");
				}
			} catch (err) {
				log.error("Exception when creating creating hbbtvMediaSynchroniser Object. Error: " + err.message);
			}
		}
	};
}
