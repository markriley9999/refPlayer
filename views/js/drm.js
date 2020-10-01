// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// DRM (oipf)                                                                               //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

/*global oipfObjectFactory */

window.SetupDRM = function(logObj)
{

    var drm = {

        drmAgent            : null,
        playReadyId         : "urn:dvb:casystemid:19219",
        playReadyMsgType    : "application/vnd.ms-playready.initiator+xml",        
        proactiveMessageId  : -1
        
    };

    drm.messageResults = [
    
        "Successful",
        "Unknown error",
        "Cannot process request",
        "Unknown MIME type",
        "User consent needed",
        "Unknown DRM system",
        "Wrong format"
      
    ];




    function info(m) {
        logObj.info("DRM: " + m);
    }
    
    function warn(m) {
        logObj.warn("DRM: " + m);
    }
    
    function error(m) { // eslint-disable-line no-unused-vars
        logObj.error("DRM: " + m);
    }
    

    function createDrmAgent() {

        drm.drmAgent = document.getElementById("drm-agent");

        if (drm.drmAgent) { 
            info("Using embedded application/oipfDrmAgent");
        } else {
            
            try {
                if (oipfObjectFactory.isObjectSupported("application/oipfDrmAgent")) {
                    
                    info("application/oipfDrmAgent is supported");

                    drm.drmAgent = oipfObjectFactory.createDrmAgentObject();
                    info("drm agent created");
                    
                } else {
                    warn("application/oipfDrmAgent is NOT supported");
                }
            } catch (err) {
                warn("DRM: application/oipfDrmAgent is NOT supported");
            }
        }

    }

    
	
    function sendProactiveDrmMessage(laURL, resolve, reject) {

        function onDRMMessageResult(msgId, resultMsg, resultCode) {
            
            info("received drm message result");
            info("msgId: " + msgId);
            info("resultMsg: " + decodeURIComponent(resultMsg));
            info("resultCode: " + resultCode + " (" + drm.messageResults[resultCode] + ")");

            if ((msgId === drm.proactiveMessageId) && (resultCode === 0)) {
                resolve("DRM: init OK");
            } else {
                reject("DRM: init fail");
            }
        
        }

        function onDrmSystemStatusChange(drmSystemId) {
        
            info("drm system status change for " + drmSystemId);

        }

        function onDRMSystemMessage(msg, drmSystemId) {
        
            info("drm system message for " + drmSystemId + " : " + msg);
        
        }

        function onDRMRightsError(errorState, contentId, drmSystemId, rightsIssuerUrl ) {
            
            warn("drm rights error received");
            warn("error state: " + errorState);
            warn("content id: " + contentId);
            warn("drmSystemId: " + drmSystemId);
            warn("rights issuer url: " + rightsIssuerUrl);
        }
	

        function getProactiveMessage() {

            info("Override LA_URL");
            
            return  "<?xml version='1.0' encoding='utf-8'?>" +
                    "<PlayReadyInitiator xmlns='http://schemas.microsoft.com/DRM/2007/03/protocols/'>" +
                        "<LicenseServerUriOverride>" +
                            "<LA_URL>" + laURL + "</LA_URL>" +
                        "</LicenseServerUriOverride>" +
                    "</PlayReadyInitiator>";
        }
        
        function sendDRMMessage(msg) {
            
            info("LA_URL: " + decodeURIComponent(msg));
            return drm.drmAgent.sendDRMMessage(drm.playReadyMsgType, msg, drm.playReadyId);

        }

        drm.drmAgent.onDRMRightsError 			= onDRMRightsError;
        drm.drmAgent.onDRMSystemStatusChange 	= onDrmSystemStatusChange;
        drm.drmAgent.onDRMMessageResult 		= onDRMMessageResult;
        drm.drmAgent.onDRMSystemMessage			= onDRMSystemMessage;

        
        var msg = getProactiveMessage();
        info("--- sending proactive message");
        drm.proactiveMessageId = sendDRMMessage(msg);
        info("--- proactive message sent!");

    }
        

    createDrmAgent(); 

        
    return {
    
        disable : function() {

            info("Disabled DRM Client (oipf)");
            try {
                drm.drmAgent.setActiveDRM("urn:hbbtv:oipfdrm:inactive");
            } catch(e) {
                warn("setActiveDRM: not supported");
            }
        
        },
        
        sendLicence : function(laURL) {

            var promise = new Promise(function(resolve, reject) {
                sendProactiveDrmMessage(laURL, resolve, reject);        
            });
            
            return promise;
        }
    
    };
    
};
