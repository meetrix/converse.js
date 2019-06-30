var config = {
  domain: 'link-im.com',
  http:'7070',
  https:'7443',
  chromeExtensionId: "pankicchcgcfhognbgfaijcfagcefdde",
  chromeExtensionUrl:'https://chrome.google.com/webstore/detail/link-desktop-streamer/pankicchcgcfhognbgfaijcfagcefdde',
  media_container_formats:['default',"vp9","h264",'mkv','opus','pcm','ogg','gif','whammy'],
  media_container_format:0,
  media_resolutions:['default','1920x1080','1280x720','640x480','3840x2160'],
  media_resolution:0,
  media_framerates:['default','5','15','24','30','60'],
  media_framerate:0,
  media_bitrates:['default','8000000000','800000000','8000000','800000','8000','800'],
  media_bitrate:0,
  recordingMedia:{
    video:'record-audio-plus-video',
    audio:'record-audio'
  },
  images:{
    login_bottom_image:'https://i.imgur.com/omxuqo5.png'
  },
  password_regex:{
    // strongRegex:'^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})',
    // mediumRegex:'^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})'
    strongRegex:'^(.*)',
    mediumRegex:'^(.*)'
  },
  username_regex:'^[a-zA-Z0-9]+$',
  fullname_regex: '^[a-zA-Z\\s]+$',
  xhr_user_search_url: 'https://link-im.com:9091/plugins/restapi/v1/users?',
  xhr_restapi: 'https://link-im.com:9091/plugins/restapi/v1/',
  roomDefaultConfiguration:{
    'roomname':'',
    'roomdesc': 'Comfy room for hanging out',
    'changesubject': false,
    'maxusers':'40',
    'presencebroadcast':['moderator','participant','visitor'],
    'publicroom': false,
    'persistentroom': true,
    'moderatedroom':false,
    'membersonly': true,
    'allowinvites':false,
    'passwordprotectedroom':false,
    'roomsecret':'scret',
    'whois': 'anyone',
    'allowpm':'anyone',
    'enablelogging':true,
    'reservednick':false,
    'canchangenick':true,
    'registration':false,
    'roomadmins':[],
    'roomowners':[],
  },
  'room_auto_configure': true,
  jitsiMeetConfig: {
    hosts: {
        domain: 'meet.jit.si',

        muc: 'conference.meet.jit.si', // FIXME: use XEP-0030
        focus: 'focus.meet.jit.si',
    },
    disableSimulcast: false,
    enableRemb: false,
    enableTcc: true,
    resolution: 720,
    constraints: {
        video: {
            aspectRatio: 16 / 9,
            height: {
                ideal: 720,
                max: 720,
                min: 180
            },
            width: {
                ideal: 1280,
                max: 1280,
                min: 320
            }
        }
    },
    externalConnectUrl: '//meet.jit.si/http-pre-bind',
    p2pStunServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
    ],
    enableP2P: true, // flag to control P2P connections
    // New P2P options
    p2p: {
        enabled: true,
        preferH264: true,
        disableH264: true,
        useStunTurn: true, // use XEP-0215 to fetch STUN and TURN server for the P2P connection
        stunServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
        ]
    },
    useStunTurn: true, // use XEP-0215 to fetch STUN and TURN server for the JVB connection
    useIPv6: false, // ipv6 support. use at your own risk
    useNicks: false,
    bosh: '//meet.jit.si/http-bind', // FIXME: use xep-0156 for that

  },
  mobile_api:{
    BASE_URL:'https://web.pareza.io/mewaapp/index.php/',
    START_CALL_API:'User/notify_start_call/',
    UPDATE_DEVICE_TOKEN:'User/registration',
    UPDATE_VOIP_TOKEN:'User/update_voip_device_token'

  }

}
