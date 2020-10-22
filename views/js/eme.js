// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// EME Setup                                                                               //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

window.SetupEME = function(video, keySystem, name, options, licenceName, licenceDelay, logObj)
{
    const DRMSystemID = "0x1077efecc0b24d02ace33c1e52e2fb4b";
    
    var keySession = null;
    
    
    function log(msg) {
        logObj.info("EME: " + msg);
    }

    function logerr(msg) {
        logObj.error("EME: " + msg);
    }

    function bail(reject, message)
    {
        return function(err) {
            logerr(message + (err ? " " + err : ""));
            if (reject) { 
                reject(err);
            }
        };
    }

    function ArrayBufferToString(arr)
    {
        var str = "";
        var view = new Uint8Array(arr);
        for (var i = 0; i < view.length; i++) {
            str += String.fromCharCode(view[i]);
        }
        return str;
    }

    /* Not used */
    /*
    function StringToArrayBuffer(str)
    {
        var arr = new ArrayBuffer(str.length);
        var view = new Uint8Array(arr);
        for (var i = 0; i < str.length; i++) {
            view[i] = str.charCodeAt(i);
        }
        return arr;
    }
    */
    
    function Base64ToHex(str)
    {
        var bin = window.atob(str.replace(/-/g, "+").replace(/_/g, "/"));
        var res = "";
        for (var i = 0; i < bin.length; i++) {
            res += ("0" + bin.charCodeAt(i).toString(16)).substr(-2);
        }
        return res;
    }

    /* Not used */
    /*
    function HexToBase64(hex)
    {
        var bin = "";
        for (var i = 0; i < hex.length; i += 2) {
            bin += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return window.btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    */
    
    function UpdateSessionFunc(name, licenceName) {
        return function(ev) {
            window.clearkeyGetLicence(ev.target, ev.message, licenceName, licenceDelay, video, logObj);
        };
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
    var keySystemAccess;
    
    function EnsureMediaKeysCreated(video, keySystem, options) {
        if (ensurePromise) {
            return ensurePromise;
        }

        log("navigator.requestMediaKeySystemAccess("+ JSON.stringify(options) + ")");

        ensurePromise = navigator.requestMediaKeySystemAccess(keySystem, options).then(function(k) 
        {
            keySystemAccess = k;
        }, 
        bail(null, name + " Failed to request key system access."));

        return ensurePromise;
    }

    function arrayBufferToString(buffer){
        var arr = new Uint8Array(buffer);
        var str = String.fromCharCode.apply(String, arr);
        return str;
    }
    
    function arrayBufferToHexString(buffer){
        var arr = new Uint8Array(buffer);
        var str = "";
        for (var i = 0; i < arr.length; i++) {
            str += "0x" + arr[i].toString(16) + " ";
        }
        return str;
    }

    function arrayBufferExtractHexNumber(buffer, start, size){
        var arr = new Uint8Array(buffer);
        var str = "0x";
        
        if (start + size > arr.length) {
            size = arr.length - start;
        }
        
        for (var i = start; i < start + size; i++) {
            str += ("00" + arr[i].toString(16)).slice(-2);
        }
        return str;
    }

    function checkDRMSystemId(initData) {
        var sysId = arrayBufferExtractHexNumber(initData, 12, 16);
        var bCheckOk;
        log("Extracted DRM System Id: " + sysId);
        
        bCheckOk = (sysId === DRMSystemID);
        if (bCheckOk) {
            log(" - ClearKey DRM requested.");
        } else
        {
            log(" - Unknown DRM requested.");
        }
        
        return bCheckOk;
    }


    function createKeySession() {

        var promise = new Promise(function(resolve, reject) {

            if (!keySession) {
                
                return keySystemAccess.createMediaKeys().then(function(mediaKeys) 
                {
                    
                    log(name + " created MediaKeys object ok");
                    return video.setMediaKeys(mediaKeys);
                        
                }, 
                bail(reject, name + " failed to create MediaKeys object")).then(function() 
                {
                        
                    log(name + " set MediaKeys ok");
                    return video.mediaKeys.createSession();
                        
                }, 
                bail(reject, name + " failed to set MediaKeys object")).then(function(s)
                {
            
                    keySession = s;
                    resolve(s);
                    
                },
                bail(reject, name + " failed to create session"));

            } else {

                reject(name + " Session already created");

            }
              
        });

        return promise;

    }
    
    function onEncrypted(ev) {
        
        log(name + " got encrypted event - initDataType: " + ev.initDataType);
        log(" - initData: " +  arrayBufferToString(ev.initData));
        log(" - initData: " +  arrayBufferToHexString(ev.initData));


        function genReq() {
        
            keySession.addEventListener("message", UpdateSessionFunc(name, licenceName));
            keySession.addEventListener("keystatuseschange", KeysChange);
            
            return keySession.generateRequest(ev.initDataType, ev.initData);

        }
        
        if (checkDRMSystemId(ev.initData))
        {
            if (!video.bProcessingKey) { 
                video.bProcessingKey = true;
                
                if (!keySession) {
        
                    createKeySession().then(function() {return genReq();});
        
                } else {
                    
                    genReq();
                }
                
            } else {
                
                log(name + "Multiple encrypted events!");
                
            }
        }
    }
    
    var promise = new Promise(function(resolve, reject) {

        EnsureMediaKeysCreated(video, keySystem, options).then(function() {
            log(name + " ensured MediaKeys available on HTMLMediaElement");
            video.addEventListener("encrypted", onEncrypted);
            resolve("EME: Clear Key Initialised");
        }, 
        bail(reject, "EME: Clear Key Failed To Initialise!"));
          
    });
    
    return {

        promise : promise,

        createKeySession : function() {
            return createKeySession();
        }
        
    };
};
