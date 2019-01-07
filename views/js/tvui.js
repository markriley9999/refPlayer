// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //
//                                                                                         //
// TV UI                                                                                   //
//                                                                                         //
// *************************************************************************************** //
// *************************************************************************************** //
// *************************************************************************************** //

window.InitTVUI = function() {

    var prevMSyncTm = "";
    
    
    // Icon table
    var playIconTable = {};
    
    playIconTable.stop      = "player-stop";
    playIconTable.play      = "player-play";
    playIconTable.pause     = "player-pause";
    playIconTable.rewind    = "player-rew";
    playIconTable.ffwd      = "player-fwd";

    function e(id) {
        return document.getElementById(id);
    }

    return {
        ShowPlayrange   : function (r, d, pt) {
            var c = e("playbackBar").getBoundingClientRect();
            var offset = e("ad-start-point").getBoundingClientRect().width / 2;

            var x1, x2;
            
            if (r >= d) {
                x1 = c.left;
                x2 = c.right;           
            } else {
                var coef = (c.width / d);
                var t = pt;
                x1 =  (coef * r) + c.left;
                var endP = (r + t > d) ? d : r + t;
                
                x2 =  (coef * endP) + c.left;
            }
            
            e("ad-start-point").style.left  = (x1 - offset) + "px";
            e("ad-resume-point").style.left = (x2 - offset) + "px";         
        },
        
        ShowBuffering   : function (b) {
            var bufferingIcon = e("player-buffering");
        
            if (b) {
                bufferingIcon.setAttribute("class", "playerBufferingIcon rotate");
            } else {
                bufferingIcon.setAttribute("class", "playerBufferingIcon");         
            }           
        },
        
        ShowPlayingState : function (state) {
            for (var s in playIconTable) {
                var playEl = e(playIconTable[s]);
                if (playEl) {
                    if (s === state) {
                        playEl.setAttribute("class", "playerIcon hilite");
                    } else {
                        playEl.setAttribute("class", "playerIcon");
                    }
                }
            }
        },
        
        ShowEncrypted   : function (m) {
            e("encrypted").setAttribute("class", "playerIcon " + m);
        },
        
        ShowCurrentChannel  : function (c, s) {
            e("currentChannel") && (e("currentChannel").innerHTML = "Test " + c + " - " + s);
        },
        
        ShowSubs    : function (m) {
            e("subs").setAttribute("class", "playerIcon " + m);
        },
        
        ShowSecure  : function (b) {
            if (b) {
                e("padlock").setAttribute("class", "playerIcon showsecure");
            } else {
                e("padlock").setAttribute("class", "playerIcon");
            }
        },
        
        ShowMSyncIcon   : function (m) {
            e("clock").setAttribute("class", "playerIcon " + m);
        },
        
        ShowTransportIcons  : function (b) {
            var c = b ? "playerIcon" : "playerIcon hidden";
            
            e("player-rew").setAttribute("class", c);
            e("player-play").setAttribute("class", c);
            e("player-fwd").setAttribute("class", c);
            e("player-pause").setAttribute("class", c);
            e("player-stop").setAttribute("class", c);
        },
        
        ShowMsyncTime : function (b) {
            var t = e("msync-time"); 
            if (t) {
                if (b) {
                    t.setAttribute("class", "msync-text msync-show");
                } else {
                    t.setAttribute("class", "msync-text msync-hide");
                }
            }
        },
        
        UpdateMSyncTime : function (tm, fps) {
            
            var timeMS = tm * 1000;
            
            /* Not used */
            /*
            var milliseconds = parseInt((timeMS%1000))
            milliseconds = ("000" + milliseconds).slice(-3);
            */
            
            var seconds = parseInt((timeMS/1000)%60);
            var minutes = parseInt((timeMS/(1000*60))%60);
            
            var frame = ("00" + parseInt(((timeMS * fps) / 1000) % fps)).slice(-2);
            
            minutes = ("00" + minutes).slice(-2);
            seconds = ("00" + seconds).slice(-2);
            
            var txt = minutes + ":" + seconds + "-" + frame;
                        
            var t = e("msync-time"); 
            if (t) {
                t.innerHTML = txt;
    
                if (txt !== prevMSyncTm) {
                    t.setAttribute("class", "msync-text msync-show");
                } else 
                {
                    t.setAttribute("class", "msync-text msync-warn");
                }
            }
            
            prevMSyncTm = txt;
        }
    };  
};
