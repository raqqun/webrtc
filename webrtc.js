jQuery(document).ready(function() {

var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
});

// set firebase database
var firebase = new Firebase("https://crackling-torch-4324.firebaseIO.com/0c3b0a64-728a-4d79-8f8b-0dbd86881219");

// set fibase signal structure only once
var signalStructure = {
    'candidate': '',
    'sdp': ''
}

// set remote peer audio/video offer
var options = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};


// error handler callback
var errorHandler = function (err) {
    console.error(err);
};


// RTCConfiguration for peer discovery
var configuration = {
    iceServers: [
        {urls: 'stun:stun.services.mozilla.com'},
        {urls: 'stun:stun.l.google.com:19302'}
    ]
}

// peerConnection variable on global scope
var pc;

// control variable indentifying the caller
UserIsCalling = false;

function start(isCaller) {

    // create peerConnection with above config
    pc = new RTCPeerConnection(configuration);

    // if icecandidate
    pc.onicecandidate = function(e) {
        if (!e.candidate) return;
        signalStructure.candidate = JSON.stringify(e.candidate);
        firebase.set(signalStructure);
        // pc.onicecandidate = null;
    };

    // once remote stream arrives, show it in the remote video element
    pc.onaddstream = function (e) {
        var participantMedia = document.getElementById("participantMedia");
        participantMedia.src = URL.createObjectURL(e.stream);
    };

    constraints  = {
        'audio': true,
        'video': true
    }

    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(mediaStream) {
        window.mediaStream = mediaStream;
        var video = document.getElementById('userMedia');
        video.src = window.URL.createObjectURL(mediaStream);

        pc.addStream(window.mediaStream);

        if (isCaller) {
            UserIsCalling = true;
            // send offer if caller
            pc.createOffer(function (offer) {
                pc.setLocalDescription(offer, function() {
                    signalStructure.sdp = JSON.stringify(pc.localDescription);
                    firebase.set(signalStructure);
                }, errorHandler);
            }, errorHandler, options);
        }
        else {
            // send answer if participant
            pc.createAnswer(function (answer) {
                pc.setLocalDescription(answer, function() {
                    signalStructure.sdp = JSON.stringify(pc.localDescription);
                    firebase.set(signalStructure);
                }, errorHandler);
            }, errorHandler);
        }
    })
    .catch(function(mediaStreamError) {
        console.log(mediaStreamError);
    });

}

// listen offer change and send answer
firebase.on("value", function (data) {
    // if user is participant get offer sdp
    // else
    console.log(data.val());
    if (data.val().sdp !== '' && !UserIsCalling && data.val().candidate) {
        if (!pc) {
            start(false);
            // signalStructure.offer = data.val().offer;
            offer = new RTCSessionDescription(JSON.parse(data.val().sdp));
            pc.setRemoteDescription(offer);
            if (data.val().candidate !== '') {
                pc.addIceCandidate(new RTCIceCandidate(JSON.parse(data.val().candidate)));
            }
        }
    }
    else if (data.val().sdp !== '' && UserIsCalling && data.val().candidate) {
        answer = new RTCSessionDescription(JSON.parse(data.val().sdp));
        pc.setRemoteDescription(answer);
        if (data.val().candidate !== '') {
            pc.addIceCandidate(new RTCIceCandidate(JSON.parse(data.val().candidate)));
        }
    }
});


// get call button, initiate a peerConnection and send offer
var startButton = document.getElementById('startButton');
startButton.onclick = function() {

}

var callButton = document.getElementById('call');
callButton.onclick = function() {
    start(true);
}

var hang = document.getElementById('hang');
hang.onclick = function() {
    var localVideo = document.getElementById('userMedia');
    localVideo.pause();
    var signalStructure = {
        'candidate': '',
        'sdp': ''
    }
    firebase.set(signalStructure);
    if (pc) {
        pc.close();
    }
}


var WebRTC = {

}


});
