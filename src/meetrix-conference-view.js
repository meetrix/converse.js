/* eslint-disable prefer-const */
/* eslint-disable no-empty */
/* eslint-disable max-depth */
/* eslint-disable no-undef */
import converse from "@converse/headless/converse-core";
import u from "@converse/headless/utils/emoji";
const { Strophe, _, dayjs, sizzle, Backbone, $iq, $msg, $pres, $build, b64_sha1, utils } = converse.env;
var _converse = null;

var connection = null;
var isJoined = false;
var room = null;

var localTracks = [];
var remoteTracks = {};
var jid;
let conferenceView;
let ConferenceView;
let roomName;
let numberParticipants = 0;
var networkConnection;
var newtowkdType;
const AUDIO_CALL = 1;
const VIDEO_CALL = 2;
let callType = 0;
let affiliation = 'member';
const affiliations = ['member', 'owner', 'admin', 'visitor']
let conferenceStartStamp;
let counter;
let isCall = false;
let RemoteAudioView;
let RemoteVideoView
let remoteVideoSource;
let currentChatBoxView;
let webinarMode = false;
let groupcall = 0;
let userFrom;
let userTo;
let whoHangUp = 0;
const IAM_HANGUP = 1;
const THEM_HANGUP = 2;
const CONFERENCE_START_COMMAND = 'start'
const CONFERENCE_END_COMMAND = 'ended'
let isConferenceMaximized = false;
let conference;

// conference data
let conferenceType = 0;
let whoIsCaller = 0;
// constant
const ONE_TO_ONE_CALL = 1;
const GROUP_CALL = 2;
const IAM_CALLER = 1;
const THEM_CALLER = 2;
const CALL_NOT_ANSWRED = 'Call Not Answer';
const CALL_REJECT = 'Call Reject';
const CALL_END = 'Call End'

// command regex filter
const commonCommandMessage = /^\\(\bcall\b):([a-zA-Z]+):([a-z0-9-#]+):((\baudio\b|\bvideo\b))\\$/;
const commandConnecting = /^\\(\bconnecting\b):([a-zA-Z]+):([a-z0-9-#]+):((\baudio\b|\bvideo\b))\\$/;
const commandConnected = /^\\(\bconnected\b):([a-zA-Z]+):([a-z0-9-#]+):((\baudio\b|\bvideo\b))\\$/;
const commandCallStart = /^\\(\bcall\b):((\bstart\b)):([a-z0-9-#]+):((\baudio\b|\bvideo\b))\\$/;
const commandCallEnd = /^\\(\bcall\b):((\bended\b)):([a-z0-9-#]+):((\baudio\b|\bvideo\b))\\$/;
const commandCallReject = /^\\(\bcall\b):((\breject\b)):([a-z0-9-#]+):((\baudio\b|\bvideo\b))\\$/;
const commandCallAccepted = /^\\(\bcall\b):((\baccepted\b)):([a-z0-9-#]+):((\baudio\b|\bvideo\b))\\$/;
const commandCallNotAnswered = /^\\(\bcall\b):((\bnotAnswered\b)):([a-z0-9-#]+):((\baudio\b|\bvideo\b))\\$/;
const filterStartEndMessageCommand = /^\\(\bcall\b):((\bstart\b|\bended\b)):([a-z0-9-#]+):((\baudio\b|\bvideo\b))\\$/;

// The following line registers your plugin.
converse.plugins.add("meetrix-conference-view", {

    /* Dependencies are other plugins which might be
     * overridden or relied upon, and therefore need to be loaded before
     * this plugin. They are "optional" because they might not be
     * available, in which case any overrides applicable to them will be
     * ignored.
     *
     * NB: These plugins need to have already been loaded via require.js.
     *
     * It's possible to make these dependencies "non-optional".
     * If the setting "strict_plugin_dependencies" is set to true,
     * an error will be raised if the plugin is not found.
     */
    'dependencies': ['converse-muc-views', 'converse-chatview', 'converse-roomslist', 'converse-muc-views', 'meetrix-chat-tool', "converse-notification"],

    /* Converse.js's plugin mechanism will call the initialize
     * method on any plugin (if it exists) as soon as the plugin has
     * been loaded.
     */
    'initialize': function () {
        /* Inside this method, you have access to the private
         * `_converse` object.
         */
        _converse = this._converse;
        _converse.api.settings.update({
            jitsimeet_confirm: "Meeting?",
            jitsimeet_invitation: 'Please join meeting in room at'
        });
        // userPassword = _converse.connection.pass
        // _converse.log("The \"myplugin\" plugin is being initialized");

        /* From the `_converse` object you can get any configuration
         * options that the user might have passed in via
         * `converse.initialize`.
         *
         * You can also specify new configuration settings for this
         * plugin, or override the default values of existing
         * configuration settings. This is done like so:
        */
        _converse.api.settings.update({
            'initialize_message': 'Initializing myplugin!'
        });
        _converse.api.promises.add([
            'localTrackAdd',
        ]);
        /* The user can then pass in values for the configuration
         * settings when `converse.initialize` gets called.
         * For example:
         *
         *      converse.initialize({
         *           "initialize_message": "My plugin has been initialized"
         *      });
         */
        // alert(this._converse.initialize_message);

        /* Besides `_converse.api.settings.update`, there is also a
         * `_converse.api.promises.add` method, which allows you to
         * add new promises that your plugin is obligated to fulfill.
         *
         * This method takes a string or a list of strings which
         * represent the promise names:
         *
         *      _converse.api.promises.add('myPromise');
         *
         * Your plugin should then, when appropriate, resolve the
         * promise by calling `_converse.api.emit`, which will also
         * emit an event with the same name as the promise.
         * For example:
         *
         *      _converse.api.emit('operationCompleted');
         *
         * Other plugins can then either listen for the event
         * `operationCompleted` like so:
         *
         *      _converse.api.listen.on('operationCompleted', function { ... });
         *
         * or they can wait for the promise to be fulfilled like so:
         *
         *      _converse.api.waitUntil('operationCompleted', function { ... });
         */

        _converse.ConferenceView = Backbone.NativeView.extend({
            tagName: 'div',
            className: 'conference col',
            events: {
                'click .close-conference': 'closeConference',
                'click .hangup': 'closeConference',
                'click #conf-maximize': 'maximizeConf',
                'click .local-audio-mute': 'toggleAudioMute',
                'click .local-audio-unmute': 'toggleAudioMute',
                'click .local-video-mute': 'toggleVideoMute',
                'click .local-video-unmute': 'toggleVideoMute'
            },
            initialize() {
                this.model.on('change:localTracks', this.onLocalTracksChange, this)
                this.model.on('change:affiliation', this.localVideoView, this)
                this.model.on('change:affiliation', this.localToolBarView, this)
                this.render();
                this.localToolBarView()
                this.localVideoView();
            },

            render() {
                this.el.innerHTML =
                    `<div class="video-title-bar">
                        <div class="time-div">
                            <i class="fa fa-video"></i>
                            <span class="video-status">Call is in progress</span>
                            <span class="video-time">00:00</span>
                        </div>
                        <div class="settings-div">
                            <i id="conf-maximize" class="fas fa-expand hidden"></i>
                        </div>
                    </div>
                    <i class="fas fa-expand-alt"></i>
                    <div id="remote" >
                        <div id="local"></div>
                        <div id="localtool" class="">
                            <span> <i class="fas fa-phone hangup" id="hangup"></i> </span>
                            <span > <i class="fas fa-microphone-alt local-audio-mute" id="localAudio-audio-mute"></i> </span>
                            <span ><i class="fas fa-microphone-slash local-audio-unmute hidden" id="localAudio-audio-unmute"></i></span>
                            <span> <i class="local-video-mute fa fa-video" id="localVideo-video-mute"></i> </span>
                            <span ><i class="local-video-unmute fas fa-video-slash hidden" id="localVideo-video-unmute"></i></span>
                        </div>
                    </div>`
                return this;
            },
            localToolBarView() {
                console.log(this.model.get('affiliation'),'-----------------')
                if (this.model.get('affiliation') === 'member' && this.model.get('webinarMode')) {
                    u.addClass('hidden', this.el.querySelector('.local-audio-mute'));
                    u.addClass('hidden', this.el.querySelector('.local-video-mute'));


                } else {
                    u.removeClass('hidden', this.el.querySelector('.local-audio-mute'));
                    if (this.model.get('callType') !== VIDEO_CALL) {
                        u.addClass('hidden', this.el.querySelector('.local-video-mute'));
                    } else {
                        u.removeClass('hidden', this.el.querySelector('.local-video-mute'));
                    }
                }


            },
            localVideoView() {
                if (this.model.get('affiliation') === 'visitor') {
                    u.addClass('hidden', this.el.querySelector('#local'));
                } else {
                    u.removeClass('hidden', this.el.querySelector('#local'));
                }

            },
            closeConference() {
                whoHangUp = IAM_HANGUP;
                hangup();
            },
            toggleVideoMute() {
                const localTracks = this.model.get('localTracks')
                if (localTracks) {
                    for (let i = 0; i < localTracks.length; i++) {
                        if (localTracks[i].getType() === 'video') {
                            if (!this.model.get('videoMute')) {
                                localTracks[i].mute()
                                u.addClass('hidden', this.el.querySelector('.local-video-mute'));
                                u.removeClass('hidden', this.el.querySelector('.local-video-unmute'));
                            } else {
                                localTracks[i].unmute()

                                u.addClass('hidden', this.el.querySelector('.local-video-unmute'));
                                u.removeClass('hidden', this.el.querySelector('.local-video-mute'));
                            }
                            this.model.set({ videoMute: !this.model.get('videoMute') })
                        }

                    }
                }

            },
            toggleAudioMute() {
                const localTracks = this.model.get('localTracks')
                if (localTracks) {
                    for (let i = 0; i < localTracks.length; i++) {
                        if (localTracks[i].getType() === 'audio') {
                            if (!this.model.get('audioMute')) {
                                localTracks[i].mute()
                                u.addClass('hidden', this.el.querySelector('.local-audio-mute'));
                                u.removeClass('hidden', this.el.querySelector('.local-audio-unmute'));
                            } else {
                                localTracks[i].unmute()

                                u.addClass('hidden', this.el.querySelector('.local-audio-unmute'));
                                u.removeClass('hidden', this.el.querySelector('.local-audio-mute'));
                            }
                            this.model.set({ audioMute: !this.model.get('audioMute') })
                        }

                    }
                }

            },
            onLocalTracksChange() {
                const localTracks = this.model.get('localTracks')
                for (let i = 0; i < localTracks.length; i++) {
                    if (localTracks[i].getType() === 'video') {
                        if (this.model.get('callType') === AUDIO_CALL) {
                            localTracks[i].mute();
                            this.model.set({ videoMute: true })
                        }
                        this.addLocalVideoElement(localTracks[i])


                    }

                }
            },
            addLocalVideoElement(track) {
                const filmstrip =
                    '<div class="local-outer-div">' +
                    '<div class="local-video-container">' +
                    `<video class="local-video" autoplay='1' id='localVideo' />` +
                    '</div>' +
                    '</div>'
                this.el.querySelector('#local').insertAdjacentHTML('beforeend', filmstrip)
                track.attach(this.el.querySelector(`#localVideo`));
            },
            maximizeConf() {
                const chatArea = currentChatBoxView.el.querySelector('.chat-area');
                if (numberParticipants > 0) {
                    const remoteVideoWidth = currentChatBoxView.el.querySelector('.remote-video').offsetWidth;
                    const remoteVideoHeight = currentChatBoxView.el.querySelector('.remote-video').offsetHeight;
                    const videoAvailableWidth = currentChatBoxView.el.querySelector('.chat-body').offsetWidth - 30;
                    const videoAvailableHeight = window.innerHeight - 80 - 23 - 10; //10 to give 5px each padding top and bottom
                    const availableSpaceRatio = videoAvailableWidth / videoAvailableHeight;
                    const remoteVideoRatio = remoteVideoWidth / remoteVideoHeight;
                    if (chatArea.style.display === 'none') {
                        isConferenceMaximized = false;
                        currentChatBoxView.el.querySelector('.chat-area').style.display = 'block';
                        // currentChatBoxView.el.querySelector('.conference').classList.replace('col', 'col-auto');
                        currentChatBoxView.el.querySelector('#remote').style.top = '50%';
                        currentChatBoxView.el.querySelector('#remote').style.transform = 'translateY(-50%)';
                        currentChatBoxView.el.querySelector('.remote-video').style.height = 'unset';
                        currentChatBoxView.el.querySelector('.remote-video').style.width = '100%';
                        currentChatBoxView.el.querySelector('.remote-video').style.left = '25px';
                        currentChatBoxView.el.querySelector('.film-strip').style.left = '25px';
                        currentChatBoxView.el.querySelector('.local-video').style.right = '21px';
                        currentChatBoxView.el.querySelector('#localtool').style.left = 'unset';
                        currentChatBoxView.el.querySelector('#localtool').style.width = '100%';
                        currentChatBoxView.el.querySelector('.fa-paperclip').style.display = 'block';
                    } else if (availableSpaceRatio > remoteVideoRatio) {
                        isConferenceMaximized = true;
                        currentChatBoxView.el.querySelector('.chat-area').style.display = 'none';
                        // currentChatBoxView.el.querySelector('.conference').classList.replace('col-auto', 'col');
                        currentChatBoxView.el.querySelector('#remote').style.top = '5px';
                        currentChatBoxView.el.querySelector('#remote').style.transform = 'none';
                        currentChatBoxView.el.querySelector('.remote-video').style.height = videoAvailableHeight;
                        currentChatBoxView.el.querySelector('.remote-video').style.width = 'auto';
                        const newVideoWidth = currentChatBoxView.el.querySelector('.remote-video').offsetWidth;
                        const xdx = (videoAvailableWidth - newVideoWidth) / 2;
                        currentChatBoxView.el.querySelector('.film-strip').style.left = xdx + 25;
                        currentChatBoxView.el.querySelector('.local-video').style.right = xdx + 21;
                        currentChatBoxView.el.querySelector('#localtool').style.left = xdx;
                        currentChatBoxView.el.querySelector('#localtool').style.width = videoAvailableWidth - 2 * xdx;
                        currentChatBoxView.el.querySelector('.fa-paperclip').style.display = 'none';
                    }
                    else if (availableSpaceRatio < remoteVideoRatio) {
                        console.log("--------maximixe----33---");
                        isConferenceMaximized = true;
                        currentChatBoxView.el.querySelector('.chat-area').style.display = 'none';
                        // currentChatBoxView.el.querySelector('.conference').classList.replace('col-auto', 'col');
                        currentChatBoxView.el.querySelector('.remote-video').style.width = videoAvailableWidth;
                        currentChatBoxView.el.querySelector('.fa-paperclip').style.display = 'none';
                    }
                } else {
                    isConferenceMaximized = true;
                    currentChatBoxView.el.querySelector('.chat-area').style.display = 'none';
                    const remoteVideoWidth = currentChatBoxView.el.querySelector('.local-video').offsetWidth;
                    const remoteVideoHeight = currentChatBoxView.el.querySelector('.local-video').offsetHeight;
                    const videoAvailableWidth = currentChatBoxView.el.querySelector('.chat-body').offsetWidth - 30;
                    const videoAvailableHeight = window.innerHeight - 80 - 23 - 10; //10 to give 5px each padding top and bottom
                    const availableSpaceRatio = videoAvailableWidth / videoAvailableHeight;
                    const remoteVideoRatio = remoteVideoWidth / remoteVideoHeight;
                    if (currentChatBoxView.el.querySelector('.chat-area').style.display === 'none') {
                        console.log("--------maximixe----0---", currentChatBoxView.el.querySelector('.chat-area').style.display);
                        isConferenceMaximized = false;
                        currentChatBoxView.el.querySelector('.chat-area').style.display = 'block';
                        // document.querySelector('.conference').classList.replace('col', 'col-auto');
                        document.querySelector('#remote').style.top = '50%';
                        document.querySelector('#remote').style.transform = 'translateY(-50%)';
                        document.querySelector('.local-video').style.height = 'unset';
                        document.querySelector('.local-video').style.width = '100%';
                        document.querySelector('#localtool').style.left = 'unset';
                        document.querySelector('#localtool').style.width = '100%';
                    } else if (availableSpaceRatio > remoteVideoRatio) {
                        console.log("--------maximixe----1---");
                        isConferenceMaximized = true;
                        currentChatBoxView.el.querySelector('.chat-area').style.display = 'none';
                        // document.querySelector('.conference').classList.replace('col-auto', 'col');
                        document.querySelector('#remote').style.top = '5px';
                        document.querySelector('#remote').style.transform = 'none';
                        document.querySelector('.local-video').style.height = videoAvailableHeight;
                        document.querySelector('.local-video').style.width = 'auto';
                        const newVideoWidth = document.querySelector('.local-video').offsetWidth;
                        const xdx = (videoAvailableWidth - newVideoWidth) / 2;
                        document.querySelector('#localtool').style.left = xdx;
                        document.querySelector('#localtool').style.width = videoAvailableWidth - 2 * xdx;
                    }
                    else if (availableSpaceRatio < remoteVideoRatio) {
                        isConferenceMaximized = true;
                        currentChatBoxView.el.querySelector('.chat-area').style.display = 'none';
                        // document.querySelector('.conference').classList.replace('col-auto', 'col');
                        document.querySelector('.local-video').style.width = videoAvailableWidth;
                    }
                } CONFERENCE_START_COMMAND
            }

        })


        _converse.RingView = _converse.BootstrapModal.extend({
            events: {
                'click .accept-call': 'acceptCall',
                'click .reject-call': 'rejectCall'
            },
            initialize() {
                _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                //this.model.on('change:ringing',this.show,this)
            },

            toHTML() {

                const me = this.isMe()
                const avatar = this.getAvatar();
                const callType = this.getCallType()
                return (
                    `<div class="modal fade" id="ring-modal" tabindex="-1" role="dialog" aria-labelledby="ring-modal-label" aria-hidden="true">
                        <div class="modal-dialog modal-lg" role="document">
                            <div class="modal-content">
                                <div class="modal-body">
                                    <div id="ring-modal-sublabel">
                                        <div class="caller-info">
                                            <img src="${avatar}"/>
                                            <div class="caller-info-text">
                                                <div class="call-status"> ${me ? 'Ringing' : 'Incoming'}</div>
                                                <div>${callType} Call</div>
                                                <div class="username">${this.model.get('to')}</div>
                                            </div>
                                        </div>
                                        <div class="buttons">
                                            ${me ? '' : '<a href="#" class="fa fa-phone accept-call" ></a>'}
                                            <a href="#" class="fa fa-phone reject-call"></a>
                                        </div>
                                    </div> 
                                </div>
                            </div>
                        </div>
                    </div>`)
            },
            afterRender() {

            },
            getAvatar() {
                if(getConferenceTypeFromView(this.model.get('view')) === ONE_TO_ONE_CALL){
                    const vcard = this.model.get('vcard')
                    console.log(vcard);
                    return `data:${vcard.get('image_type')};base64,${vcard.get('image')}`
                }else {
                    return `data:${_converse.DEFAULT_IMAGE_TYPE};base64,${_converse.DEFAULT_IMAGE}`
                }
                
            },
            isMe() {
                const who = this.model.get('caller')
                if (who === IAM_CALLER) {
                    return true;
                } else {
                    return false;
                }
            },
            getCallType() {
                const callType = this.model.get('callType')
                if (callType === AUDIO_CALL) {
                    return 'Audio'
                } else {
                    return 'Video'
                }
            },
            acceptCall(ev) {
                var _view = _converse.chatboxviews.get(this.model.get('to'));
                beforeJoinConference(_view, this.model.get('callType'), this.model.get('roomName'), this.model.get('caller'));
                joiningConferenceCall(_view);
                this.stopRinging();
                this.hide();
                callAccepted(this.model.get('to'));
            },
            rejectCall(ev) {
                this.stopRinging();
                this.hide();
                sendCallRejectMessage(this.model.get('to'));
            },
            stopRinging() {
                console.log('----stop-ringing--');
                console.log(this.model);
                const audioMp3 = this.model.get('audioMp3');
                if (audioMp3) {
                    audioMp3.pause();
                    audioMp3.pause();
                    audioMp3.pause();
                    audioMp3.loop = false;
                    audioMp3.preload = false;
                    audioMp3.src = null;
                    console.log(audioMp3);
                    /*eslint no-delete-var: "error"*/
                    //delete audioMp3;
                    console.log(audioMp3);
                } else {
                    console.log('No Audio Component');
                }
                // clearTimeout(this.model.ringingTimeout);
            },
            startRinging() {
                const that = this;
                //let counter = 1;
                if (_converse.play_sounds && !_.isUndefined(window.Audio)) {
                    const audioMp3 = new Audio(_converse.sounds_path + "ringing.mp3");
                    audioMp3.loop = true;
                    // const canPlayMp3 = audioMp3.canPlayType('audio/mp3');
                    const playPromise = audioMp3.play();

                    /** Refe : https://developers.google.com/web/updates/2017/06/play-request-was-interrupted */
                    playPromise.then(_ => {
                        console.log('---start ringing--');
                        _converse.ring_model.set({ audioMp3 });
                        console.log(audioMp3);
                        console.log(_converse.ring_model.get('audioMp3'));
                        const ringingTimeout = setTimeout(function () {
                            audioMp3.pause();
                            that.callNotAnswered();
                            that.stopRinging();
                            that.hide();
                        }, 5000);
                        _converse.ring_model.set({ ringingTimeout });
                    })
                        .catch(error => {
                            // Auto-play was prevented
                            // Show paused UI.
                            console.log(error);
                            setTimeout(() => { this.startRinging }, 500);
                        });
                }
            },
            callNotAnswered() {
                callNotAnswered(this.model.get('to'))
                this.hide();
            },
            show() {
                this.modal.show();
            },
            hide() {
                this.modal.hide();
            }
        });

        _converse.CallStatusModal = _converse.BootstrapModal.extend({
            initialize() {
                _converse.BootstrapModal.prototype.initialize.apply(this, arguments);

            },
            toHTML() {

                return (
                    `<div class="modal fade" id="call-status-modal" tabindex="-1" role="dialog" aria-labelledby="call-status-modal-label" aria-hidden="true">
                        <div class="modal-dialog modal-lg" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                     <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="modal-body">
                                    <div class="modal-title" id="Callstatus-modal-sublabel">
                                    </div>
                                    <div class="modal-title" id="ring-modal-label">
                                    ${this.model.get('status')}
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    </div>`)
            },
            afterRender() {

            },
        })
        _converse.call_status = new converse.env.Backbone.Model();
        _converse.conference_view_model = new converse.env.Backbone.Model({
            'affiliation': 'member',
            'webinarMode': false,
            'conferenceType': ONE_TO_ONE_CALL,
            'videoMute': false,
            'audioMute': false
        }
        );
        _converse.ring_model = new converse.env.Backbone.Model({
            caller: IAM_CALLER
        });

    },

    /* If you want to override some function or a Backbone model or
     * view defined elsewhere in converse.js, then you do that under
     * the "overrides" namespace.
     */
    'overrides': {
        /* For example, the private *_converse* object has a
         * method "onConnected". You can override that method as follows:
         */
        'onConnected': function () {
            // Overrides the onConnected method in converse.js

            // Top-level functions in "overrides" are bound to the
            // inner "_converse" object.
            var _converse = this;

            jid = _converse.connection.jid.split('/')[0]
            // Your custom code can come here ...

            // You can access the original function being overridden
            // via the __super__ attribute.
            // Make sure to pass on the arguments supplied to this
            // function and also to apply the proper "this" object.
            _converse.on('message', function (data) {
                const chatbox = data.chatbox;
                const bodyElement = data.stanza.querySelector('body');

                if (bodyElement && _converse.shouldNotifyOfMessage(data.stanza)) {
                    var body = bodyElement.innerHTML;

                    if (filterStartEndMessageCommand.test(body)) {
                        body = body.replace(/\\/gi, '')
                        const breakConferenceCommand = body.split(':');
                        const label = _converse.api.settings.get("jitsimeet_invitation");
                        const from = chatbox.getDisplayName().trim();
                        let avatar = _converse.DEFAULT_IMAGE;
                        const roomName = breakConferenceCommand[2];
                        const callType = breakConferenceCommand[3];

                        if (data.chatbox.vcard.attributes.image) avatar = data.chatbox.vcard.attributes.image;
                        let prompt;
                        if (breakConferenceCommand[1] === CONFERENCE_START_COMMAND) {
                            prompt = new Notification(from,
                                {
                                    'body': label + " " + roomName,
                                    'lang': _converse.locale,
                                    'icon': avatar,
                                    'requireInteraction': true
                                });
                        } else if (breakConferenceCommand[1] === CONFERENCE_END_COMMAND) {
                            prompt = new Notification(from,
                                {
                                    'body': "conference ended",
                                    'lang': _converse.locale,
                                    'icon': avatar,
                                    'requireInteraction': true
                                });
                        }


                        prompt.onclick = function (event) {
                            event.preventDefault();

                            const box_jid = Strophe.getBareJidFromJid(chatbox.get("from") || chatbox.get("jid"));
                            const view = _converse.chatboxviews.get(box_jid);

                            if (view) {
                                //open chat box
                                openChatbox(view);
                                //before conference join 
                                beforeJoinConference(view, callType, roomName, THEM_CALLER)
                                // join conference
                                joiningConferenceCall(view)
                            }
                        }
                    }
                }
            });
            _converse.__super__.onConnected.apply(this, arguments);

            _converse.connection.addHandler(stanza => {

            })

            // Your custom code can come here ...
        },
        MessageView: {

            renderChatMessage: async function renderChatMessage() {
                let dataJid = Strophe.getBareJidFromJid(this.model.get("from") || this.model.get("jid"));
                if (Strophe.getBareJidFromJid(this.model.get("from")) === jid) {
                    dataJid = Strophe.getBareJidFromJid(this.model.get("to"));
                }
                if (!dataJid) {
                    dataJid = this.model.get("jid")
                }
                let body = this.model.get('message');

                const view = _converse.chatboxviews.get(dataJid);
                // hide join button
                hideJoinButton(view)
                // filter start and end conference message
                if (filterStartEndMessageCommand.test(body)) {
                    body = body.replace(/\\/gi, '')
                    const breakConferenceCommand = body.split(':');
                    if (breakConferenceCommand[1] === CONFERENCE_START_COMMAND) {

                        const link_room = breakConferenceCommand[2];
                        const link_callType = breakConferenceCommand[3]
                        const link_id = link_room + "-" + Math.random().toString(36).substr(2, 9);
                        const link_label = _converse.api.settings.get("jitsimeet_invitation");
                        const link_content = '<a data-jid="' + dataJid + '" id="' + link_id + '" href="#">' + link_label + '</a>';
                        // show join button
                        if(getCaller() === THEM_CALLER){

                            showJoinButton(view, this, link_room,link_callType);
                        }
                        //rewrite conference join message
                        conferenceStartMessageReWrite(this, link_room, link_content, link_id, link_label, link_callType);
                    }
                    else if (breakConferenceCommand[1] === CONFERENCE_END_COMMAND) {
                        conferenceEndMessageReWrite(this, 'Conference ended');
                    }

                }
                else {
                    await this.__super__.renderChatMessage.apply(this, arguments);
                }

            }

        },
        ChatRoomView: {
            events: {
                'click .top-toolbar-video-call': 'videoCall',
                'click .top-toolbar-audio-call': 'audioCall',
                'click .top-toolbar-join-call': 'joinCall',
                // 'click .top-toolbar-switch-call': 'switchCall'
            },
            videoCall() {
                const view = this;
                if (isCall) {
                    return
                }
                isCall = true
                calling(view, VIDEO_CALL)
            },
            audioCall() {
                const view = this;
                if (isCall) {
                    return
                }
                isCall = true;
                calling(view, AUDIO_CALL)
                //audioCallView();
            },
            joinCall(e) {
                console.log('join call')
                const roomName = e.target.getAttribute("data-room");
                const callType = e.target.getAttribute("data-room");
                beforeJoinConference(this, callType, roomName, THEM_CALLER)
                joiningConferenceCall(this)
            },
            // switchCall() {
            //     switchCall()
            // }

        },
        ChatBoxView: {
            events: {
                'click .top-toolbar-video-call': 'videoCall',
                'click .top-toolbar-audio-call': 'audioCall',
                'click .top-toolbar-join-call': 'joinCall',
                // 'click .top-toolbar-switch-call': 'switchCall'
            },
            videoCall() {
                console.log('password', _converse.connection.pass)
                var view = this;
                if (isCall) {
                    return
                }
                isCall = true
                calling(view, VIDEO_CALL)

            },
            audioCall() {
                var view = this;
                if (isCall) {
                    return
                }
                isCall = true
                calling(view, AUDIO_CALL);
                //audioCallView();

            },
            joinCall(e) {

                console.log('join call')
                const roomName = e.target.getAttribute("data-room");
                const callType = e.target.getAttribute("data-room");
                beforeJoinConference(this, callType, roomName, THEM_CALLER)
                joiningConferenceCall(this)
            },
            switchCall() {
                switchCall();
            },
            ringingHandle(stanza) {
                // set current chat view
                const msg_attribute = this.model.getMessageAttributesFromStanza(stanza, null)
                if (commandCallStart.test(msg_attribute.message)) {
                    const commandData = commandSplit(msg_attribute.message)
                    ringingHandler(this, commandData.callType, THEM_CALLER, commandData.roomName)
                } else if (commandCallEnd.test(msg_attribute.message)) {
                    callStatusUpdate(CALL_END)
                    ringingModalHide()

                } else if (commandCallReject.test(msg_attribute.message)) {
                    callStatusUpdate(CALL_REJECT)
                    ringingModalHide()

                } else if (commandCallAccepted.test(msg_attribute.message)) {
                    ringingModalHide();
                    joiningConferenceCall(this)

                } else if (commandCallNotAnswered.test(msg_attribute.message)) {
                    ringingModalHide()

                }

            },
        },


        /* Override converse.js's XMPPStatus Backbone model so that we can override the
         * function that sends out the presence stanza.
         */
        'XMPPStatus': {
            'sendPresence': function (type, status_message, jid) {
                // The "_converse" object is available via the __super__
                // attribute.
                var _converse = this.__super__._converse;

                // Custom code can come here ...

                // You can call the original overridden method, by
                // accessing it via the __super__ attribute.
                // When calling it, you need to apply the proper
                // context as reference by the "this" variable.
                this.__super__.sendPresence.apply(this, arguments);

                // Custom code can come here ...
            }
        }
    }
});

//----------------------------------- calling functionaing---------------------------------------------------------------------;

// calling conference
function calling(view, _callType) {
    // set current chat view
    setCurrentChatView(view)
    // call type decide
    setCallType(_callType);
    // setCaller
    setCaller(IAM_CALLER)
    //set conference type
    setConferenceType(view)
    //get VCard Of User
    getVCardOfUser(view);
    // decide who iam
    setWhoIam(view)
    // decide conference mode;
    setConferenceMode(view)
    // generate room name
    generateRoomName(view)
    // send room name
    sendJoinUrl(view);
    // ringing handler 
    ringingHandler(view, _callType, IAM_CALLER, getConferenceRoomName())
    // join conference
    // set model for converse

    // conference Panel Open
    // conferencePanelOpen(view);
    // // start jitsi
    // startJitsi(view);
    // // top tool bar block
    // hideTopToolBarConferenceTool(view)
}
// joing existing conference
function joiningConferenceCall(view) {
    // //set caller
    // // setCaller
    // setCaller(THEM_CALLER)
    // // set current chat view
    // setCurrentChatView(view)
    // // decide room name
    // // decide call type
    // // decide who iam
    // setWhoIam(view)
    // // decide conference mode;
    // setConferenceMode(view)
    // join conference
    // set model for conference
    // conference panel open
    conferencePanelOpen(view)
    // start jitsi
    startJitsi(view)
    // top tool bar block
    hideTopToolBarConferenceTool(view)
}
function beforeJoinConference(_view, _callType, _roomName, _callerType) {
    // set current chat view
    setCurrentChatView(_view)
    // call type decide
    setCallType(_callType);
    // setCaller
    setCaller(_callerType)
    //set conference type
    setConferenceType(_view)
    //get VCard Of User
    getVCardOfUser(_view);
    // decide who iam
    setWhoIam(_view)
    // decide conference mode;
    setConferenceMode(_view)
    // set room name
    setConferenceRoomName(_roomName)

}
function setCallType(_callType) {
    callType = _callType;
    _converse.conference_view_model.set('callType', callType)
}
function getCallType(_callType) {
    return callType;
}
function setConferenceMode(view) {
    view.model.set({ 'hidden_conference': true });
    if (getConferenceType() === GROUP_CALL) {
        const chatRoom = view.model.get('jid');
        if (chatRoom.includes('#') && chatRoom.split('#')[1].toLowerCase() === 'seminar') {
            webinarMode = true;
            setWebinarMode(true)
        }
        else {
            webinarMode = true;
            setWebinarMode(false)
        }
    }

}
function setWebinarMode(_webinarMode) {
    webinarMode = _webinarMode;
    _converse.conference_view_model.set('webinarMode', _webinarMode)

}

function setWhoIam(view) {
    if (view && view.model) {
        if (getConferenceType() === GROUP_CALL) {
            const occupant = view.model.occupants.findWhere({ jid: jid })
            setAffiliation(occupant.get('affiliation'))
            if (!_.includes(affiliations, getAffiliation())) {
                setAffiliation(occupant.get('role'))
            }

        }
    } else {
        console.log('model is not difine', view)
    }
}

function setAffiliation(_affiliation) {
    affiliation = _affiliation
    _converse.conference_view_model.set('affiliation', _affiliation)
}
function getAffiliation() {
    return affiliation;
}
// current chat view set

function setCurrentChatView(view) {
    currentChatBoxView = view
}
function getCurrentChatView() {
    return currentChatBoxView;
}


function generateRoomName(view) {
    let room_name;
    if (getConferenceType() === GROUP_CALL) {
        room_name = Strophe.getNodeFromJid(view.model.attributes.jid).toLowerCase() + "-" + Math.random().toString(36).substr(2, 9);

    } else if (getConferenceType() === ONE_TO_ONE_CALL) {
        userFrom = jid.split('@')[0];
        userFrom = userFrom.toLowerCase();
        userTo = view.model.attributes.jid.split('@')[0];
        userTo = userTo.toLowerCase();
        const randomNumber = Math.random().toString(36).substr(2, 9)
        if (userFrom > userTo) {

            room_name = `${userTo}${userFrom}-${randomNumber}`
            setConferenceRoomName(room_name)
        } else {
            room_name = `${userFrom}${userTo}-${randomNumber}`
        }
    }
    setConferenceRoomName(room_name)
}
function setConferenceRoomName(room) {
    roomName = room
    _converse.conference_view_model.set('roomName', room)
}
function getConferenceRoomName() {
    return roomName;
}
function setConferenceType(view) {
    if (view.model.get('type') === 'chatroom') {
        conferenceType = GROUP_CALL
    } else {
        conferenceType = ONE_TO_ONE_CALL
    }
    _converse.conference_view_model.set('conferenceType', conferenceType)

}
function getConferenceTypeFromView(_view) {
    if (_view.model.get('type') === 'chatroom') {
        return GROUP_CALL
    } else {
        return ONE_TO_ONE_CALL
    }
}
function getConferenceType() {
    return conferenceType;
}


function sendJoinUrl(view) {
    let roomCommand;
    if (getCallType() === AUDIO_CALL) {
        roomCommand = `\\call:start:${getConferenceRoomName()}:audio\\`
    } else if (getCallType() === VIDEO_CALL) {
        roomCommand = `\\call:start:${getConferenceRoomName()}:video\\`
    }
    view.model.sendMessage(roomCommand);
    callRinging(view.model.get('jid'), roomCommand)
    // startPingMobile();
}

// call command creation 
function sendMeetEnd() {
    let roomCommand;
    if (callType === AUDIO_CALL) {
        roomCommand = `\\call:ended:${roomName}:audio\\`
    } else if (callType === VIDEO_CALL) {
        roomCommand = `\\call:ended:${roomName}:video\\`
    }
    currentChatBoxView.model.sendMessage(roomCommand);
}

function callRinging(calle, startCommand) {
    createHeaderMessageStanza(calle, startCommand)
}
function sendCallRejectMessage(to) {
    let roomCommand;
    if (callType === AUDIO_CALL) {
        roomCommand = `\\call:reject:${roomName}:audio\\`
    } else if (callType === VIDEO_CALL) {
        roomCommand = `\\call:reject:${roomName}:video\\`
    }
    createHeaderMessageStanza(to, roomCommand)
    //sendMeetEnd()

}
function callAccepted(to) {
    let roomCommand;
    if (callType === AUDIO_CALL) {
        roomCommand = `\\call:accepted:${roomName}:audio\\`
    } else if (callType === VIDEO_CALL) {
        roomCommand = `\\call:accepted:${roomName}:video\\`
    }
    console.log(to, roomCommand)
    createHeaderMessageStanza(to, roomCommand)
    //sendMeetEnd()
}
function callNotAnswered(to) {
    if (isMe(getCaller())) {
        callStatusUpdate(CALL_NOT_ANSWRED)
        return;
    }
    let roomCommand;
    if (callType === AUDIO_CALL) {
        roomCommand = `\\call:notAnswered:${roomName}:audio\\`
    } else if (callType === VIDEO_CALL) {
        roomCommand = `\\call:notAnswered:${roomName}:video\\`
    }
    createHeaderMessageStanza(to, roomCommand)
}

function createHeaderMessageStanza(to, body) {
    const stanza = $msg({
        'from': jid,
        'to': to,
        'type': 'headline',
        'id': _converse.connection.getUniqueId(),
    }).c('body').t(body).up()
        .c(_converse.ACTIVE, { 'xmlns': Strophe.NS.CHATSTATES }).root();
    console.log('stanza', to)
    _converse.api.send(stanza);
}

function startPingMobile() {
    // const resources = _converse.connection.jid.split('/')[1]
    var formData = new FormData();
    const params = {
        callType: `${callType}`,
        fromUserName: userFrom,
        fromUserID: userFrom,
        callStatus: 'Create',
        profilePicUrl: "",
        isGroup: `${groupcall}`,
        name: userFrom,
        sessionId: `${roomName}`,
        userId: `${userFrom}`,
    }
    formData.append("message", JSON.stringify(params));
    const xhr = new window.XMLHttpRequest();
    // eslint-disable-next-line no-undef
    xhr.open("POST", `${config.mobile_api.BASE_URL}${config.mobile_api.START_CALL_API}${userFrom}/${userTo}`, false);
    //   xhr.setRequestHeader( 'Content-Type', 'multipart/form-data' );
    xhr.send(formData)
    xhr.onload = function () {
        if (xhr.status != 200) { // analyze HTTP status of the response

        } else { // show the result

            console.log(JSON.parse(xhr.response))
        }
    };

}

function conferencePanelOpen(view) {
    if (!_converse.conferenceView) {
        conferenceViewRender(view)
    }
    else {
        _converse.conferenceView.render()
    }

}

function maybeIEndConference() {
    if (isChatRoom()) {
        if (isIamOwnerOfTheRoom()) {
            sendMeetEnd()
        }
    } else {
        if (whoHangUp === IAM_HANGUP) {
            sendMeetEnd()
        }

    }
}
function isIamOwnerOfTheRoom() {
    if (affiliation === 'owner' || affiliation === 'admin') {
        return true;
    }
    return false;
}
function isChatRoom() {
    if (currentChatBoxView.model.get('type') === 'chatroom') {
        return true;
    } else {
        return false;
    }

}

function isWebinarMode() {
    return webinarMode;
}

function decideCallType(type) {
    if (type === "audio") {
        setCallType(AUDIO_CALL)
    } else {
        setCallType(VIDEO_CALL)
    }
}
function commandSplit(command) {
    if (commonCommandMessage.test(command)) {
        let breakCommand = command.replace(/\\/gi, '')
        breakCommand = breakCommand.split(':');
        return {
            'commandType': breakCommand[1],
            'roomName': breakCommand[2],
            'callType': breakCommand[3]

        }
    }
}
function serRoomName(room) {
    roomName = room;
}


function ringingHandler(_view, _callType, _callerType, _roomName) {
    console.log( _view)
    _converse.ring_model.set({ 'view': _view, 'callType': _callType, 'caller': _callerType, from: getMyJID(), to: getToJid(_view), vcard: getVCardOfUser(_view) })

    if (_.isUndefined(_converse.ringView) || !_converse.ringView) {

        _converse.ringView = new _converse.RingView({ 'model': _converse.ring_model });
    }
    _converse.ringView.show();
    _converse.ringView.startRinging();

}
function ringingHandlerUpdateStatus(view) {
    if (!_converse.ring_model) {
        _converse.ring_model = new converse.env.Backbone.Model({ caller: getCaller(), from: getMyJID(), to: getToJid(view), vcard: getVCardOfUser(view) });
    } else {
        _converse.ring_model.set()
    }

    if (_.isUndefined(_converse.ringView) || !_converse.ringView) {

        _converse.ringView = new _converse.RingView({ 'model': _converse.ring_model });
    }
    _converse.ringView.show(null);

}
function ringingModalHide() {

    _converse.ringView.hide();

}
function getToJid(view) {

    return view.model.get('jid');

}

function setCaller(_whoIsCaller) {
    whoIsCaller = _whoIsCaller;
}
function getCaller() {
    return whoIsCaller;
}
function getMyJID() {
    return Strophe.getBareJidFromJid(_converse.connection.jid)
}
function isMe(who) {
    if (who === IAM_CALLER) {
        return true;
    } else {
        return false;
    }
}
function getVCardOfUser(_view) {
    if (getConferenceTypeFromView(_view) === ONE_TO_ONE_CALL) {
        return _view.model.vcard;
    }
}
function callStatusUpdate(status) {
    _converse.call_status.set("status", status);
    if (!_converse.callStatusModal) {
        _converse.callStatusModal = new _converse.CallStatusModal({ 'model': _converse.call_status });
    }
    _converse.callStatusModal.show();
}

//--------------------------------------------------------------- jitsi functioning---------------------------------------------------//
function startJitsi(view) {
    // if (!view.model.get('hidden_occupants')) {
    //     view.toggleOccupants(null, false);
    // }
    console.log('** Meeting Started **');

    // if (callType === 'audio') audioCallView();

    removeJoinButton();

    //toggleConference(view, view.model)

    jitsiInitalize()
    // networkConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    // if (networkConnection === null) {
    //     // API not supported :(
    //     console.log('netowrk  API not supported ')
    // } else {
    //     // API supported! Let's start the fun :)
    //     console.log('network API supported!')
    // }
    // newtowkdType = networkConnection.effectiveType;
    // // console.lognewtowkdType
    // networkConnection.addEventListener('change', updateConnectionStatus);
}

function jitsiInitalize() {

    // eslint-disable-next-line no-undef
    JitsiMeetJS.init(config.jitsiMeetConfig);
    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.DEBUG);
    connection = new JitsiMeetJS.JitsiConnection(null, null, config.jitsiMeetConfig);
    connection.addEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.addEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.addEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);

    JitsiMeetJS.mediaDevices.addEventListener(
        JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
        onDeviceListChanged);
    connection.connect({ id: jid, password: _converse.connection.pass || sessionStorage.getItem("password") });
    // connection.connect();
    if (affiliation !== 'visitor') {
        JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] })
            .then(onLocalTracks)
            .catch(error => {
                throw error;
            });
    }
    if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
        JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
            const audioOutputDevices
                = devices.filter(d => d.kind === 'audiooutput');

            if (audioOutputDevices.length > 1) {
                $('#audioOutputSelect').html(
                    audioOutputDevices
                        .map(
                            d =>
                                `<option value="${d.deviceId}">${d.label}</option>`)
                        .join('\n'));

                $('#audioOutputSelectWrapper').show();
            }
        });
    }
}
function onConnectionSuccess() {
    console.log('roomName', roomName)
    room = connection.initJitsiConference(roomName, config.jitsiMeetConfig);

    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);
    });
    room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoin);
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, _track => {
        console.log(`${_track.getType()} - muted ${_track.isMuted()}`, _track);
    });
    room.on(
        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, onRemoteDisplayName
    );
    // room.on(
    //     JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
    //     (userID, audioLevel) => console.log(`${userID} - ${audioLevel}`));
    room.on(
        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));

    //-------error handel--------//
    room.on(
        JitsiMeetJS.errors.conference.VIDEOBRIDGE_NOT_AVAILABLE,
        () => console.log(``));
    room.on(
        JitsiMeetJS.errors.conference.JINGLE_FATAL_ERROR,
        () => console.log(`-------Jingle session fail------`));
    room.on(
        JitsiMeetJS.errors.conference.FOCUS_DISCONNECTED,
        () => console.log(`-------- focus disconnect----------`));

    room.on(
        JitsiMeetJS.errors.conference.CONFERENCE_DESTROYED,
        () => console.log(`-------- conference destroyed ----------`));
    room.on(
        JitsiMeetJS.errors.conference.CONNECTION_ERROR,
        () => console.log(`-------- connection error ----------`));


    room.on(
        JitsiMeetJS.errors.connection.OTHER_ERROR,
        () => console.log(`-------- other error ----------`));
    room.on(
        JitsiMeetJS.errors.connection.CONNECTION_DROPPED_ERROR,
        () => console.log(`-------- connection drop error ----------`));
    room.join();

}

function onRemoteTrack(track) {
    if (track.isLocal()) {
        return;
    }
    const participant = track.getParticipantId();
    if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
    }
    const idx = remoteTracks[participant].push(track);
    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
    track.addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, onRemoteTrackMute);
    track.addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('remote track stoped'));
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
            console.log(
                `track audio output device was changed to ${deviceId}`));
    const id = participant + track.getType();

    if (track.getType() === 'video') {

        // const remoteVideoView =  new RemoteVideoView({model:new converse.env.Backbone.Model({id:id})})
        // remoteVideoView.render();
        // $('#remote').append(remoteVideoView.el); 

        addRemoteVideoElement(id)
    } else {
        numberParticipants++;
        console.log('remote pariticpant ', numberParticipants)
        addRemoteAudioElement(participant)
        // const remoteAudioView = new RemoteAudioView({model:new converse.env.Backbone.Model({id:id})})
        // remoteAudioView.render();
        // $('#remote').append(remoteAudioView.el); 
    }
    if (numberParticipants === 1) {


        transferConferenceMode();
    }
    track.attach($(`#${id}`)[0]);
    console.log('** Meeting Started **');
    setTimeout(function () {
        const mRemoteVideoWidth = document.querySelector('.remote-video').offsetWidth;
        const mRemoteVideoHeight = document.querySelector('.remote-video').offsetHeight;
        const mTargetHeight = window.innerHeight - 113;
        console.log("mTargetHeight", mTargetHeight);
        if (mRemoteVideoWidth < mRemoteVideoHeight) {
            document.querySelector('.remote-video').style.height = mTargetHeight;
            document.querySelector('.remote-video').style.width = 'unset';
            document.querySelector('#remote').style.top = '5';
            document.querySelector('#remote').style.transform = 'none';
            document.querySelector('#conf-maximize').style.display = 'none';
        }
    }, 3000)
    const joinCallButton = document.querySelector('.top-toolbar-join-call');
    if (joinCallButton && joinCallButton.parentElement) {
        joinCallButton.parentElement.removeChild(joinCallButton);
    }
    // if (callType === AUDIO_CALL) audioCallView();
}
function onRemoteTrackMute(track) {
    console.log('** Remote track muted ', track);
    const participantId = track.getParticipantId();
    const trackType = track.getType();
    const remoteVid = document.getElementById(`${participantId}${trackType}`);
    if (remoteVid) {
        const remoteVidHeight = remoteVid.offsetHeight;
        if (trackType === 'video') {
            if (track.isMuted()) {
                hideElement(remoteVid);
                document.querySelector('.remote-video-container').style.backgroundColor = 'black';
                document.querySelector('.remote-video-container').style.height = remoteVidHeight;
            } else {
                showElement(document.getElementById(`${participantId}${trackType}`));
                document.querySelector('.remote-video-container').style.backgroundColor = 'unset';
                document.querySelector('.remote-video-container').style.height = 'unset';
            }
        }
    }

}

function onLocalTracks(tracks) {
    localTracks = tracks;
    for (let i = 0; i < localTracks.length; i++) {
        // localTracks[i].addEventListener(
        //     JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        //     audioLevel => console.log(`Audio Level local: ${audioLevel}`));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
            () => console.log('local track muted'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
            () => console.log('local track stoped'));
        localTracks[i].addEventListener(
            JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
            deviceId =>
                console.log(
                    `track audio output device was changed to ${deviceId}`));
        // if (localTracks[i].getType() === 'video' ) {
        //     if(callType === AUDIO_CALL){
        //         localTracks[i].mute();
        //         videoMute = true;
        //     }
        //     addLocalVideoElement(localTracks[i])


        // } else {
        //     addLocalAudioElement(localTracks[i])
        // }
        if (isJoined) {
            localTracksAddingToConference()
        }
        _converse.api.trigger('localTrackAdd', localTracks[i]);
    }
    _converse.conference_view_model.set('localTracks', tracks)

}

function onUserJoin(id) {
    console.log('onUserJoin:user joined');
    console.log('remoteTracks: ', remoteTracks);
    remoteTracks[id] = [];
    console.log(remoteTracks, id)
    if (remoteTracks && (!isWebinarMode())) {
        startConferenceTimeCounter();
    }
    if (affiliation !== 'owner') showElement(document.querySelector('#conf-maximize'));
}

function disconnect() {
    console.log('disconnect!');
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        onConnectionSuccess);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        onConnectionFailed);
    connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        disconnect);
}
function onDeviceListChanged(devices) {
    console.info('current devices', devices);
}
function onConnectionFailed() {
    console.error('Connection Failed!');
}
function onConferenceJoined() {
    console.log('conference joined!');
    if (isWebinarMode() && affiliation !== 'visitor') startConferenceTimeCounter();
    isJoined = true;
    localTracksAddingToConference()


}
function onUserLeft(id) {
    console.log('** onUserLeft **');
    console.log('** isWebinarMode', isWebinarMode());
    console.log('** affiliation', affiliation);
    console.log('** numberParticipants', numberParticipants);


    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];
    for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].getType() === 'audio') {
            numberParticipants--;
        }
        removeElementById(`${id}${tracks[i].getType()}`)
        tracks[i].detach($(`#${id}${tracks[i].getType()}`));
    }
    delete remoteTracks[id];
    console.log('numberParticipants', numberParticipants)
    console.log('numberParticipants', numberParticipants)
    console.log('Object.keys(remoteTracks).length', Object.keys(remoteTracks).length)
    console.log('affiliation', affiliation)

    if (numberParticipants === 0 && Object.keys(remoteTracks).length === 0 && ((affiliation === 'visitor') || affiliation === 'member' || (affiliation === 'owner' && !isWebinarMode()))) {
        if (callType === VIDEO_CALL) localVideoMaximize();
        console.log("-*** hangup");
        whoHangUp = THEM_HANGUP;
        const chatArea = currentChatBoxView.el.querySelector('.chat-area');
        console.log(' ***Resetting chat area:');
        console.log(chatArea.style.display);
        if (isConferenceMaximized) chatArea.style.display = 'block';
        hangup();
    }

}

var onConnectionDisconnect = function () {
    console.log('XMPP DISCONNECTED')
}

function onRemoteDisplayName(userID, displayName) {
    console.log(`userid-----${userID} - ${displayName}`)
    console.log('userID', userID)
}

//---------------------------------------- conference function -------------------------------------------------------//

function resetConference() {

    connection = null
    room = null
    numberParticipants = 0
    _converse.conferenceView.remove()
    _converse.conferenceView = null
    isCall = false;
    webinarMode = false;
    affiliation = 'member';
        currentChatBoxView = null;
    groupcall = 0
    remoteTracks = {};
        whoHangUp = 0;
    stopConferenceTimeCounter()
}

function resetConferenceView() {

    joinCallButton();
    showTopToolBarConferenceToolV2();
}

function hangup() {


    if (!isJoined) {
        return
    }


    try {
        if (numberParticipants !== 0) {
            // Detach all particpants
            const parts = room.getParticipants()
            for (let i = 0; i < parts.length; i++) {
                for (let t = 0; t < parts[i]._tracks.length; t++) {
                    const id = parts[i]._id + parts[i]._tracks[t].getType();
                    parts[i]._tracks[t].detach($(`#${id}`)[0])
                    removeElementById(`${id}`)
                    if (parts[i]._tracks[t].getType() === 'audio') {
                        numberParticipants--
                    }

                }
            }
        }
        maybeIEndConference()
        room.off(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack)
        room.off(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined)
        room.off(JitsiMeetJS.events.conference.USER_JOINED, id => { remoteTracks[id] = [] })
        room.off(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft)
        room.leave().then(() => {

        // eslint-disable-next-line handle-callback-err
        }).catch(err => {

        })

        connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed)
        connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess)
        connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onConnectionDisconnect)
        connection.disconnect()
        isJoined = false
        // Hide local Video, Display local Avatar
        localVideoStop()
        // reinitializing variables
        stopConference();

    } catch (error) {

    }
    // unload();
}
function localVideoStop() {
    for (let i = 0; i < localTracks.length; i++) {
        if (localTracks[i].getType() === 'video') {
            // isVideo = true;

            removeLocalVideoElement()
        } else {
            removeLocalAudioElement()
        }
        localTracks[i].dispose();

    }
    removeLocalToolBarElement();
}
function stopConference() {
    resetConference()
    resetConferenceView();
}

function unload() {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].dispose();
    }
    room.leave().then().catch();
    connection.disconnect();
}
function updateConnectionStatus() {
    console.log('connection.bandwidth', networkConnection.bandwidth)
    console.log("Connection type changed from " + newtowkdType + " to " + networkConnection.effectiveType);
}
function isLocalVideoShow() {
    if (affiliation === 'visitor') {
        return false;
    }
    return true;

}
function startConferenceTimeCounter() {
    console.log('** startConferenceTimeCounter:')
    conferenceStartStamp = new Date().getTime();
    counter = setInterval(updateClock, 1000)
}
function stopConferenceTimeCounter() {
    clearTimeout(counter);
}
// function renderCustomConfiguration(stanza) {
//     var roomConfiguration = {};
//     const fields = stanza.querySelectorAll('field')
//     _.each(fields, field => {
//         if (_converse.roomconfig_whitelist.length === 0 ||
//             _.includes(_converse.roomconfig_whitelist, field.getAttribute('var'))) {
//             if (field.getAttribute('var') === 'muc#roomconfig_roomname') {
//                 roomConfiguration.roomname = _.get(field.querySelector('value'), 'textContent')
//             } else if (field.getAttribute('var') === 'muc#roomconfig_roomdesc') {
//                 roomConfiguration.roomdesc = _.get(field.querySelector('value'), 'textContent')
//             } else if (field.getAttribute('var') === 'muc#roomconfig_publicroom') {
//                 roomConfiguration.publicroom = _.get(field.querySelector('value'), 'textContent')
//             } else if (field.getAttribute('var') === 'muc#roomconfig_moderatedroom') {
//                 roomConfiguration.moderatedroom = _.get(field.querySelector('value'), 'textContent')
//             }
//             else if (field.getAttribute('var') === 'muc#roomconfig_membersonly') {
//                 roomConfiguration.membersonly = _.get(field.querySelector('value'), 'textContent')
//             }
//             else if (field.getAttribute('var') === 'muc#roomconfig_allowpm') {
//                 roomConfiguration.allowpm = _.get(field.querySelector('value'), 'textContent')
//             }
//             else if (field.getAttribute('var') === 'muc#roomconfig_roomowners') {
//                 const values = _.map(
//                     u.queryChildren(field, 'value'),
//                     _.partial(_.get, _, 'textContent')
//                 );
//                 roomConfiguration.roomowners = [values]
//             }

//         }
//     });
//     return roomConfiguration

// }
function localTracksAddingToConference() {
    for (let i = 0; i < localTracks.length; i++) {
        if (isVideoTrack(localTracks[i]) && isAudioCall()) {
            localTracks[i].mute()
        }
        room.addTrack(localTracks[i]);
    }
}

function isAudioCall() {
    return callType === AUDIO_CALL;
}
function isVideoCall() {
    return callType === VIDEO_CALL;
}
function isAudioTrack(track) {
    return track.getType() === 'audio'
}
function isVideoTrack(track) {
    return track.getType() === 'video'
}
function getLocalVideoTrack() {
    for (let i = 0; i < localTracks.length; i++) {
        if (isVideoTrack(localTracks[i])) {
            return localTracks[i];
        }

    }
}
function localVideoTrackMuteUnMute() {
    const localVideoTrack = getLocalVideoTrack();
    if (localVideoTrack.isMuted()) {
        localVideoTrack.unmute();
    } else {
        localVideoTrack.mute();
    }
}
function switchToVideoCall() {
    console.log('** Switching to Video call');
    callType = VIDEO_CALL;
    document.querySelector('.video-status').innerText = 'Video call is in progress';
    localVideoTrackMuteUnMute()

}
function switchToAudioCall() {
    console.log('** Switching to Audio call');
    callType = AUDIO_CALL;
    document.querySelector('.video-status').innerText = 'Audio call is in progress';
    localVideoTrackMuteUnMute()
}
function switchCall() {
    if (isAudioCall()) {
        switchToVideoCall()
    }
    else if (isVideoCall()) {
        switchToAudioCall()
    }
}

//---------------------------------------- conference ui functioning --------------------------------------------------//


function removeJoinButton() {
    const joinCallButton = document.querySelector('.top-toolbar-join-call');
    if (joinCallButton && joinCallButton.parentElement) {
        joinCallButton.parentElement.removeChild(joinCallButton);
    }
}
function hideJoinButton(view) {
    hideElement(view.el.querySelector('.top-toolbar-join-call'));
}
function showJoinButton(_chtBoxView, _msgView, _roomName,_callType) {
    const joinCallButton = document.createElement('li');
    joinCallButton.className = 'top-toolbar-join-call';
    joinCallButton.insertAdjacentHTML('beforeend', `<a data-room="${_roomName}" data-callType="${_callType}" href="#"><i data-room="${_roomName}" class="fas fa-phone-volume"></i></a>`);
    const messageTime = new Date(_msgView.model.get("time"));
    if ((new Date() - messageTime) < 30 * 1000) {
        let preElement = _chtBoxView.el.querySelector('.top-toolbar-join-call');
        if (preElement) preElement.parentNode.removeChild(preElement);
        _chtBoxView.el.querySelector('.top-toolbar-menu').insertAdjacentElement('beforeend', joinCallButton);
    }
    setTimeout(() => {
        hideElement(_chtBoxView.el.querySelector('.top-toolbar-join-call'));
    }, (1000 * 60 * 5));

}

function localVideoMaximize() {
    const localVideoElement = document.getElementById('localVideo')
    if (localVideoElement) {
        localVideoElement.style.maxWidth = 'unset';
        localVideoElement.style.width = 'var(--videoWidth30)';
        localVideoElement.style.position = 'unset';
        localVideoElement.style.right = 'unset';

    }
}
function transferConferenceMode() {
    var localVideo = document.getElementById("localVideo");
    if (localVideo) {
        localVideo.style.maxWidth = '250';
        localVideo.style.width = '30%';
        localVideo.style.position = 'absolute';
        localVideo.style.right = 21;
        localVideo.style.top = 6;
    }
}

var conferenceViewRender = function (view) {
    _converse.conferenceView = new _converse.ConferenceView({ 'model': _converse.conference_view_model })
    if (view.el.querySelector(".chatroom-body")) {
        view.el.querySelector(".chatroom-body").insertAdjacentElement('beforeend', _converse.conferenceView.el);
    }
    else if (view.el.querySelector(".chat-body")) {
        view.el.querySelector(".chat-body").insertAdjacentElement('beforeend', _converse.conferenceView.el);
    }


}
function toggleConference(view, model) {
    model.set({ 'hidden_conference': !model.get('hidden_conference') });
    if (model.get('hidden_conference')) {
        u.hideElement(view.el.querySelector('.conference'));
    } else {
        u.removeClass('hidden', view.el.querySelector('.conference'));
        u.addClass('col', view.el.querySelector('.conference'));
        hideOtherAllFeature(view)
    }
}
var openChatbox = function openChatbox(view) {
    let jid = view.model.get("jid");
    let type = view.model.get("type");

    if (jid) {
        if (type == "chatbox") _converse.api.chats.open(jid);
        else
            if (type == "chatroom") _converse.api.rooms.open(jid);
    }
}
function conferenceStartMessageReWrite(chat, avRoom, content, linkId, linkLabel, link_callType) {
    var time = dayjs(chat.model.get('time'))
    const is_me_message = chat.isMeCommand()
    const msg_author = is_me_message ? 'me' : 'them'
    const wholeclass = chat.model.get('type') === 'groupchat' ? 'channel' : 'direct'
    var msg_content = document.createElement("div");
    msg_content.setAttribute("class", `message chat-msg groupchat chat-msg-whole__${chat.model.get('sender')} ${wholeclass}`);
    msg_content.setAttribute("data-isodate", time.toISOString());

    if (chat.model.vcard) {
        msg_content.innerHTML =
            `<div class="style-box"> 
                <img class="avatar" src="data:image/png;base64,${chat.model.vcard.attributes.image}" style="width: 36px; height: 36px; margin-right: 10px;"/>
                <div class="chat-msg-content"> 
                    <span class="chat-msg-heading"> 
                        <span class="chat-msg-author">${chat.model.getDisplayName()} </span>
                        <time timestamp class="chat-msg-time">${time.format(_converse.time_format)} </time>
                    </span>
                    <div class="chat-msg__body">
                        <div class="chat-msg__message">
                            <span class="chat-msg-text">${content}</span>
                            <div class="chat-msg-media"></div>
                        </div>
                    </div>
                </div>
            </div>`;
        chat.replaceElement(msg_content);
    }

    if (avRoom && linkId) {
        setTimeout(function () {
            if (document.getElementById(linkId)) document.getElementById(linkId).onclick = function (evt) {

                var dataJid = evt.target.getAttribute("data-jid");
                //get chat view
                var view = _converse.chatboxviews.get(dataJid);
                // set paremeter before join conference
                beforeJoinConference(view, link_callType, avRoom, THEM_CALLER)
                // join conference
                joiningConferenceCall(view)
            }
        }, 1000);
    }
}
function conferenceEndMessageReWrite(chat, content) {
    var time = dayjs(chat.model.get('time'))
    const wholeclass = chat.model.get('type') === 'groupchat' ? 'channel' : 'direct'
    var msg_content = document.createElement("div");
    msg_content.setAttribute("class", `message chat-msg groupchat chat-msg-whole__${chat.model.get('sender')} ${wholeclass}`);
    msg_content.setAttribute("data-isodate", time.toISOString());

    if (chat.model.vcard) {
        msg_content.innerHTML =
            `<div class="style-box">
                <img class="avatar" src="data:image/png;base64,${chat.model.vcard.attributes.image}" style="width: 36px; height: 36px; margin-right: 10px;"/>
                <div class="chat-msg-content"> 
                <span class="chat-msg-heading">
                <span class="chat-msg-author">${chat.model.getDisplayName()}</span>
                <time timestamp class="chat-msg-time">${time.format(_converse.time_format)}</time>
                 </span>
                <div class="chat-msg__body">
                <div class="chat-msg__message">
                <span class="chat-msg-text">${content}</span>
                 <div class="chat-msg-media"></div>
                </div>
                </div>
                </div>
                </div>`;
        chat.replaceElement(msg_content);
    }
}

function removeLocalVideoElement() {
    removeElementById('localVideo')
}
function removeLocalAudioElement() {
    removeElementById('localAudio')
}
function removeLocalToolBarElement() {
    removeElementById('localtool')
}
function audioCallView() {
    console.log('-- :audioCallMuteView:');
    const localTool = document.getElementById('localtool');
    const remote = document.getElementById('remote');

    if (localTool && remote) {
        localTool.style.display = 'block';
        remote.style.backgroundImage = 'url(./chatapp/img/voice-call.jpg)';
        remote.style.minHeight = '40vh';
        remote.style.backgroundSize = 'cover';
        // document.getElementById('localtool').style.display = 'block';
    }
}
function addRemoteVideoElement(id) {
    const filmstrip =
        '<div class="remote-video-container">' +
        `<video class="remote-video" autoplay='1' id='${id}' />` +
        '</div>'
    // $('#remote').css({"height":"unset", "background":"unset"}); 2xx
    $('#remote').append(filmstrip);
}
function addRemoteAudioElement(participant) {
    const participantName = participant.split('-')[0];
    let remoteParticipantToolBar = '';

    let audoTool = callType === AUDIO_CALL ?
        `<span > <i class="fas fa-microphone-alt" id="remoteAudio-audio-mute-${participant}" ></i> </span>` +
        `<span ><i class="fas fa-microphone-slash hidden" id="remoteAudio-audio-unmute-${participant}" ></i></span>` : '';
    let videoTool = callType === VIDEO_CALL ?
        `<span > <i class="fas fa-microphone-alt" id="remoteAudio-audio-mute-${participant}"></i> </span>` +
        `<span ><i class="fas fa-microphone-slash hidden" id="remoteAudio-audio-unmute-${participant}" ></i></span>` +
        `<span> <i class="fa fa-video" id="remoteVideo-video-mute-${participant}" ></i> </span>` +
        `<span ><i class="fas fa-video-slash hidden" id="remoteVideo-video-unmute-${participant}" ></i></span>` : '';
    if (affiliation === 'owner' || affiliation === 'admin') {
        remoteParticipantToolBar =
            `<div id="remotetool-${participant}">` +
            `${audoTool}` +
            `${videoTool}` +
            '</div>'

    }
    const filmstrip =
        '<div class="film-strip">' +
        `<div class="name" id='${participant}-name'>${participantName}</div>` +
        `<i class="fas fa-signal signal"></i>` +
        // `<i id="conf-maximize-in-video" class="fas fa-expand signal"></i>` +
        `<audio class="remote-audio" style="width:100px" autoplay='1' id='${participant}audio' />` +
        // `${remoteParticipantToolBar}`+
        '</div>'
    $('#remote').append(filmstrip);
    // if(callType===AUDIO_CALL){
    //     $('#remote').css({"background":"red"})
    // }
}

function hideTopToolBarConferenceTool(view) {
    const videoTool = view.el.querySelector('.top-toolbar-video-call');
    if (videoTool) {
        hideElement(videoTool);
    }
    const audioTool = view.el.querySelector('.top-toolbar-audio-call')
    if (audioTool) {
        hideElement(audioTool);
    }
    // showElement(document.querySelector('.top-toolbar-switch-call.hidden'));
    // hideElement(document.querySelector('.top-toolbar-file-attach'));

}
function showTopToolBarConferenceToolV2() {
    showElement(document.querySelector('.top-toolbar-video-call.hidden'));
    showElement(document.querySelector('.top-toolbar-audio-call.hidden'));
    showElement(document.querySelector('.top-toolbar-file-attach.hidden'));
    // hideElement(document.querySelector('.top-toolbar-switch-call'));
}
function showTopToolBarConferenceTool(view) {
    const videoTool = view.el.querySelector('.top-toolbar-video-call')
    if (videoTool) {
        showElement(videoTool)
    }
    const audioTool = view.el.querySelector('.top-toolbar-audio-call')
    if (audioTool) {
        showElement(audioTool)
    }
}
function joinCallButton() {
    const joinCallButton = document.querySelector('.top-toolbar-join-call');
    if (joinCallButton && joinCallButton.parentElement) {
        joinCallButton.parentElement.removeChild(joinCallButton);
    }
}
//----------------------------------- helper ui function---------------------------------//
var hideElement = function (el) {
    return addClass("hidden", el);
}

var addClass = function (className, el) {
    if (el instanceof Element) {
        el.classList.add(className);
    }
    return el;
}
function addClassToElById(id, className) {
    document.getElementById(`${id}`).classList.add(`${className}`);
}
function removeClassToElById(id, className) {
    document.getElementById(`${id}`).classList.remove(`${className}`);
}
function hideOtherAllFeature(view) {
    if (view.el.querySelector('.occupants')) {
        view.model.set({ 'hidden_occupants': true })
        hideElement(view.el.querySelector('.occupants'));
    }
    if (view.el.querySelector('.searched-message')) {
        hideElement(view.el.querySelector('.searched-message'));
    }
    // if (view.el.querySelector('.plugin-contentbox')) {
    //     hideElement(view.el.querySelector('.plugin-contentbox'));
    // }
}


function removeElementById(id) {
    if (document.getElementById(`${id}`)) {

        document.getElementById(`${id}`).remove();
    }
}
var showElement = function (el) {
    return removeClass("hidden", el);
}

var removeClass = function (className, el) {
    if (el instanceof Element) {
        el.classList.remove(className);
    }
    return el;
}

//--------------------------- helper function-------------------------------------------------------//


function updateClock() {
    const nowStamp = new Date().getTime();
    var diff = Math.round((nowStamp - conferenceStartStamp) / 1000);

    var d = Math.floor(diff / (24 * 60 * 60)); /* though I hope she won't be working for consecutive days :) */
    diff = diff - (d * 24 * 60 * 60);
    var h = Math.floor(diff / (60 * 60));
    diff = diff - (h * 60 * 60);
    var m = Math.floor(diff / (60));
    diff = diff - (m * 60);
    var s = diff;
    let timeString = ''
    if (h === 0) {

    }
    else if (h < 10) {
        h = `0${h}`
        timeString = h + ":"
    } else {
        timeString = h + ":"
    }
    if (m < 10) {
        m = `0${m}`

    }
    timeString = timeString + `${m}:`
    if (s < 10) {
        s = `0${s}`

    }
    timeString = timeString + `${s}`

    try {
        document.getElementsByClassName("video-time")[0].innerHTML = timeString;
    }
    catch (err) {
        console.log(err.message);
    }

}
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
