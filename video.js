(() => {
    'use strict';

    const TWILIO_DOMAIN = location.host;
    const ROOM_NAME = 'VideoRoom';
    const Video = Twilio.Video;
    let videoRoom, localStream;

    // プレビュー画面の表示
    navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then(stream => {
        document.getElementById("myStream").srcObject = stream;
        localStream = stream;
    });    
    
    // ボタンの準備
    const btnJoinRoom = document.getElementById("button-join");
    const btnLeaveRoom = document.getElementById("button-leave");

    btnJoinRoom.onclick = (() => {
        // アクセストークンを取得
        axios.get(`https://${TWILIO_DOMAIN}/video-token`)
        .then(async body => {
            const token = body.data.token;
            console.log(token);

            Video.connect(token, { name: ROOM_NAME })
            .then(room => {
                console.log(`Connected to Room ${room.name}`);
                videoRoom = room;

                room.participants.forEach(participantConnected);
                room.on('participantConnected', participantConnected);

                room.on('participantDisconnected', participantDisconnected);
                room.once('disconnected', error => room.participants.forEach(participantDisconnected));
            
                btnJoinRoom.disabled = true;
                btnLeaveRoom.disabled = false;
            });
        });
    });

    btnLeaveRoom.onclick = (() => {
        videoRoom.disconnect();
        console.log(`Disconnected to Room ${videoRoom.name}`);
        btnJoinRoom.disabled = false;
        btnLeaveRoom.disabled = true;
    });
})();

const participantConnected = (participant) => {
    console.log(`Participant ${participant.identity} connected'`);

    const div = document.createElement('div');
    div.id = participant.sid;
    // div.innerText = participant.identity;

    participant.on('trackSubscribed', track => trackSubscribed(div, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);
  
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        trackSubscribed(div, publication.track);
      }
    });
  
    document.body.appendChild(div);
}

const participantDisconnected = (participant) => {
    console.log(`Participant ${participant.identity} disconnected.`);
    document.getElementById(participant.sid).remove();
}

const trackSubscribed = (div, track) => {
    div.appendChild(track.attach());
}

const trackUnsubscribed = (track) => {
    track.detach().forEach(element => element.remove());
}
