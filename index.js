/* eslint-disable no-undef */
// eslint-disable-next-line no-undef
var domain = config.domain;

var port = location.protocol === 'https:' ?config.https:config.http;
var socketProtocol = location.protocol === 'https:'? 'wss' :'ws';
var avatars = {};
var nickColors = {};
var configConverse =
        {
            auto_away: 300,

        view_mode: 'fullscreen',
            bosh_service_url:location.protocol +"//"+domain+":"+port+"/http-bind/",
            message_archiving: "always",
          muc_domain: "conference." + domain,
          allow_bookmarks: true,
          allow_chat_pending_contacts: false,
          allow_public_bookmarks: true,
          allow_logout: true,
          allow_muc_invitations: true,
        // registration_domain: domain,
          default_domain: domain,
          domain_placeholder: domain,
          hide_open_bookmarks: true,
          locked_domain: domain,
          notify_all_room_messages: true,
          notification_icon: 'chatapp/image.png',
          play_sounds: true,
          priority: 1,
          show_controlbox_by_default: true,
          show_message_load_animation: true,
          show_desktop_notifications: true,
          show_chatstate_notifications: true,
          sounds_path: 'sounds/',
          visible_toolbar_buttons: {'emoji': true, 'call': false, 'clear': true, spoiler:false },
          locales_url: "chatapp/locale/{{{locale}}}/LC_MESSAGES/converse.json",
          strict_plugin_dependencies: true,
          chromeExtensionId: config.chromeExtensionId,
          auto_list_rooms: true,
          locked_muc_domain: true,
          locked_muc_nickname: true,
          muc_nickname_from_jid:true,
          auto_register_muc_nickname:true,
          muc_instant_rooms: false,
          jitsimeet_invitation: 'Please join meeting',
          jitsimeet_confirm: 'Meeting?',
          xhr_user_search_url:config.xhr_user_search_url,
          debug: true,
          images:config.images,
          password_regex:config.password_regex,
          username_regex:config.username_regex,
          fullname_regex: config.fullname_regex,
          roomDefaultConfiguration:config.roomDefaultConfiguration,
          room_auto_configure:config.room_auto_configure,
          blacklisted_plugins:['converse-omemo'],
          auto_reconnect:true,
          allow_dragresiz:true,
          xhr_restapi:config.xhr_restapi,
          show_send_button:true,
          trusted: true,
          i18n:'en'
        };
converse.initialize(configConverse).then(function () {
});

function createAvatar(nickname, width, height, font)
{
   
    if(!nickname){
        nickname= 'no-name' 
    }
    nickname = nickname.toLowerCase();

    if (avatars[nickname])
    {
        return avatars[nickname];
    }

    if (!width) width = 32;
    if (!height) height = 32;
    if (!font) font = "16px Arial";

    var canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    canvas.width = width;
    canvas.height = height;
    document.body.appendChild(canvas);
    var context = canvas.getContext('2d');
    context.fillStyle = getRandomColor(nickname);
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = font;
    context.fillStyle = "#fff";

    var first, last;
    var name = nickname.split(" ");
    var l = name.length - 1;

    if (name && name[0] && name.first != '')
    {
        first = name[0][0];
        last = name[l] && name[l] != '' && l > 0 ? name[l][0] : null;

        if (last) {
            var initials = first + last;
            context.fillText(initials.toUpperCase(), 3, 23);
        } else {
            // eslint-disable-next-line no-redeclare
            var initials = first;
            context.fillText(initials.toUpperCase(), 10, 23);
        }
        var data = canvas.toDataURL();
        document.body.removeChild(canvas);
    }

    avatars[nickname] = canvas.toDataURL();
    return avatars[nickname];
}
function getRandomColor(nickname)
{
    if (nickColors[nickname])
    {
        return nickColors[nickname];
    }
    else {
        var letters = '0123456789ABCDEF';
        var color = '#';

        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        nickColors[nickname] = color;
        return color;
    }
}
