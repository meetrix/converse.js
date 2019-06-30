/* eslint-disable radix */
/* eslint-disable no-undef */
// version 0.4.11.1


// Commonly used utilities and variables can be found under the "env"
// namespace of the "converse" global.
import DetectRTC from 'detectrtc';
import converse from "@converse/headless/converse-core";

const { Backbone } = converse.env;    
var _converse = null, videoRecorder = null, recorder = null, videoBitsPerSecond;
var recordingPlayer = null;
var recordingMedia = null;
var mediaContainerFormat = null;
var mimeType = 'video/webm';
var fileExtension = 'webm';
var type = 'video';
var recorderType = null;
var defaultWidth = null;
var defaultHeight = null;
var recordOb = {};
var params = {}
var timeSlice = false;
var video = null;
var RecordingDialog = null;
var recordingDialog = null
var ExtensionDialog = null
var extensionDialog = null
var TopToolBar = null;
var ScreenRecorderPreview = null;
var screenRecorderPreview = null;
var desktopRecordingFile;
var recordAudiVideofile;

// The following line registers your plugin.
converse.plugins.add("meetrix-chat-tool", {

    /* Optional dependencies are other plugins which might be
       * overridden or relied upon, and therefore need to be loaded before
       * this plugin. They are called "optional" because they might not be
       * available, in which case any overrides applicable to them will be
       * ignored.
       *
       * NB: These plugins need to have already been loaded via require.js.
       *
       * It's possible to make optional dependencies non-optional.
       * If the setting "strict_plugin_dependencies" is set to true,
       * an error will be raised if the plugin is not found.
       */
    'dependencies': ['converse-muc-views', 'converse-chatview'],

    /* Converse.js's plugin mechanism will call the initialize
     * method on any plugin (if it exists) as soon as the plugin has
     * been loaded.
     */
    'initialize': function () {
        /* Inside this method, you have access to the private
         * `_converse` object.
         */
        _converse = this._converse;
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
        TopToolBar = Backbone.NativeView.extend({
            el: '.top-toolbar-menu',
            events: {
                "keyup .chatapp-filter-all": "chatappFilter"
            },
            initialize() {
                this.render()
            },
            render() {
                var topToolBar = '<div>top toooo bar</div>'
                this.el.innerHTML = topToolBar;
                return this;
            },

        });
        _converse.recorder_model = new converse.env.Backbone.Model()
        ExtensionDialog = _converse.BootstrapModal.extend({
            initialize() {
                _converse.BootstrapModal.prototype.initialize.apply(this, arguments);

            },
            toHTML() {
                var url = this.model.get("url");
                return '<div class="modal" id="myModal"> <div class="modal-dialog"> <div class="modal-content">' +
                    '<div class="modal-header">' +
                    '  <h1 class="modal-title">Extension Installation Link</h1>' +
                    '  <button type="button" class="close" data-dismiss="modal"><i class="fas fa-times"></i></button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '<div class="container-fluid">' +
                    '<div class="row">' +
                    '<div ><a href="' + url + '" target="_blank">Install Extenison</a></div>' +
                    '</div>' +
                    '<div class="row">' +
                    '<p>Please reaload the app after install extenison</p>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +


                    '</div> </div> </div>';
            },
            events: {
                "click .close": "close",
            }
        });
        ScreenRecorderPreview = _converse.BootstrapModal.extend({
            initialize() {
                _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
            },
            toHTML() {
                var file = this.model.get("file");
                var url = URL.createObjectURL(file);
                return '<div class="modal screen-share-send-modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                    '<div class="modal-header">' +
                    '  <h1 class="modal-title">Desktop Recording Preview</h1>' +
                    '  <button type="button" class="close" data-dismiss="modal"><i class="fas fa-times"></i></button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '<div class="container-fluid">' +
                    '<div class="row justify-content-center">' +
                    '<div ><video src="' + url + '" class="desktop-preview" style="width:100%; height:auto"/></div>' +
                    '</div>' +
                    '<div class="row">' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="screen-share-buttons">' +
                    '<button type="button" class="btn custom-green-btn btn-record-upload">Upload</button>' +
                    '<button type="button" class="btn custom-white-btn close" data-dismiss="modal">Cancel</button>' +
                    '</div>' +
                    '</div> </div> </div>';
            },
            afterRender() {
                this.el.querySelector('.desktop-preview').setAttribute('controls', true);
                console.log('rendered');
            },
            events: {
                "click .close": "close",
                "click .btn-record-upload": "uploadFile",
            },
            uploadFile() {
                var view = this.model.get("view");
                var file = this.model.get("file");
                view.model.sendFiles([file]);
                this.closeModal();

            },
            closeModal() {

                screenRecorderPreview.modal.hide()
            },
        });
        RecordingDialog = _converse.BootstrapModal.extend({
            initialize() {
                _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
            },
            toHTML() {
                console.log('recordingDialog:toHTML', recordingMedia);
                var view = this.model.get("view");
                var id = view.model.get("id").split("@")[0];
                var state = this.model.get("state");
                var videoButton = DetectRTC.browser.name !== 'Safari' ? '<button class="btn btn-sm toggle-voice-message-video"><i class="fas fa-microphone-alt"></i>Video Message</button>' : ''
                return '<div class="modal record-modal" id="myModal">' +
                    '<div class="modal-dialog modal-mdx">' +
                    '<div class="modal-content">' +
                    '<div class="modal-header">' +
                    '<h1 class="modal-title">Audio Message</h1>' +
                    '<button type="button" class="close" data-dismiss="modal"><i class="fas fa-times"></i></button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '<div class="audio-or-video">' +
                    videoButton +
                    '<button class="btn btn-sm toggle-voice-message-audio"  disabled="true"><i class="fas fa-video"></i>Audio Message</button>' +
                    '</div>' +
                    '<div style="margin-top: 10px;" id="recording-player"></div>' +
                    '<div id="media-preview-element" class="previewer"></div>' +
                    '</div>' +
                    '<div class="modal-footer record-buttons">' +
                    '<button type="button" class="btn btn-sm btn-record-cancel" data-dismiss="modal"> Cancel </button>' +
                    '<button type="button" class="btn btn-sm btn-record-start"><i class="fas fa-microphone-alt"></i><span class="btn-record-start-text">Start Recording</span></button>' +
                    // '<button type="button" class="btn btn-sm btn-record-stop" disabled="true">record-stop</button>'+
                    '<button type="button" class="btn btn-sm btn-record-upload" disabled="true"><i class="far fa-paper-plane"></i> Send Recorded Media</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
            },
            events: {
                "click .btn-record-start": "startOrStop",
                //   "click .btn-record-stop": "stop",
                "click .close": "close",
                "click .btn-record-upload": "uploadRecordFile",
                "click .toggle-voice-message": "toggleVoiceMessage",
                "click .toggle-voice-message-audio": "toggleVoiceAudioMessage",
                "click .toggle-voice-message-video": "toggleVoiceVideoMessage",
            },
            toggleVoiceAudioMessage(ev) {
                this.el.querySelector('.modal-title').innerHTML = 'Audio Message';
                this.el.querySelector('.toggle-voice-message-audio').disabled = true;
                this.el.querySelector('.toggle-voice-message-audio').style.borderBottom = '2px solid #ec407a';
                this.el.querySelector('.toggle-voice-message-audio').style.opacity = '1';
                this.el.querySelector('.toggle-voice-message-video').disabled = false;
                this.el.querySelector('.toggle-voice-message-video').style.borderBottom = '1px solid grey';
                this.el.querySelector('.toggle-voice-message-video').style.opacity = '0.6';

                // eslint-disable-next-line no-undef
                recordingMedia = config.recordingMedia.audio
            },
            toggleVoiceVideoMessage(ev) {
                this.el.querySelector('.modal-title').innerHTML = 'Video Message';
                this.el.querySelector('.toggle-voice-message-video').disabled = true;
                this.el.querySelector('.toggle-voice-message-video').style.borderBottom = '2px solid #ec407a';
                this.el.querySelector('.toggle-voice-message-video').style.opacity = '1';
                this.el.querySelector('.toggle-voice-message-audio').disabled = false;
                this.el.querySelector('.toggle-voice-message-audio').style.borderBottom = '1px solid grey';
                this.el.querySelector('.toggle-voice-message-audio').style.opacity = '0.6';

                // eslint-disable-next-line no-undef
                recordingMedia = config.recordingMedia.video
            },
            hide() {
                this.model.set({ 'state': 'audio' })
                this.modal.hide();
            },
            close() {
                function stopStream() {
                    if (recordOb.stream && recordOb.stream.stop) {
                        recordOb.stream.stop();
                        recordOb.stream = null;
                    }

                    if (recordOb.stream instanceof Array) {
                        recordOb.stream.forEach(function (stream) {
                            stream.stop();
                        });
                        recordOb.stream = null;
                    }

                    videoBitsPerSecond = null;
                    video = null;
                    document.getElementById('recording-player').innerHTML = ''

                }

                if (recordOb.recordRTC) {
                    if (recordOb.recordRTC.length) {
                        console.log(recordOb.recordRTC);
                        recordOb.recordRTC.stopRecording(function (url) {
                            if (recordOb.recordRTC) {
                                stopStream();
                                return;
                            }

                            recordOb.recordRTC[1].stopRecording(function (url) {
                                recordOb.recordingEndedCallback(url);
                                stopStream();
                            });
                        });
                    }
                    else {
                        recordOb.recordRTC.stopRecording(function (url) {

                            stopStream();
                        });
                    }
                }
                //   this.showStartButton()
                this.model.set({ 'state': 'audio' })
                this.modal.hide();


            },
            toggleVoiceMessage(ev) {
                if (this.el.querySelector('.toggle-voice-message').innerHTML === 'Video') {
                    this.el.querySelector('.toggle-voice-message').innerHTML = 'Audio'
                    this.el.querySelector('.modal-title').innerHTML = 'Video Recording'
                    // eslint-disable-next-line no-undef
                    recordingMedia = config.recordingMedia.video

                } else {
                    this.el.querySelector('.toggle-voice-message').innerHTML = 'Video'
                    this.el.querySelector('.modal-title').innerHTML = 'Audio Message'
                    // eslint-disable-next-line no-undef
                    recordingMedia = config.recordingMedia.audio
                }
            },
            previweRecording(recordRTC) {
                var view = this.model.get("view");
                var id = view.model.get("id").split("@")[0];
                if (!recordRTC) return alert('No recording found.');
                var fileName = getFileName(fileExtension);
                recordAudiVideofile = new File([recordRTC.getBlob()], fileName, {
                    type: mimeType
                });
                // eslint-disable-next-line no-undef
                if (recordingMedia === config.recordingMedia.audio) {
                    var audio = document.createElement('audio')
                    audio.src = URL.createObjectURL(recordAudiVideofile)
                    audio.setAttribute('controls', true)
                    this.el.querySelector('.previewer').insertAdjacentElement('beforeend', audio)
                    this.hideMediaElement();
                } else {
                    var video = document.createElement('video')
                    video.src = URL.createObjectURL(recordAudiVideofile)
                    video.setAttribute('controls', true)
                    video.style.width = '100%'
                    video.style.height = 'auto'
                    this.el.querySelector('.previewer').insertAdjacentElement('beforeend', video)
                    this.hideMediaElement();
                }


            },
            toggleStartButton() {
                if (document.getElementsByClassName('btn-record-start-text')[0].innerHTML === 'Start Recording') {
                    document.getElementsByClassName('btn-record-start-text')[0].innerHTML = 'Stop Recording';
                } else {
                    document.getElementsByClassName('btn-record-start-text')[0].innerHTML = 'Start Recording';
                }
            },
            //   showStartButton(){
            //     document.getElementsByClassName('btn-record-start')[0].disabled= false
            //   },
            hideUploadButton() {
                document.getElementsByClassName('btn-record-upload')[0].disabled = true
            },
            showUploadButton() {
                document.getElementsByClassName('btn-record-upload')[0].disabled = false
            },
            //   hideStopButton(){
            //     document.getElementsByClassName('btn-record-stop')[0].disabled= true
            //   },
            //   showStopButton(){
            //     document.getElementsByClassName('btn-record-stop')[0].disabled= false
            //   },
            hideMediaElement() {
                this.el.querySelector('#recording-player').style.display = "none"
            },
            showMediaElement() {
                this.el.querySelector('.previewer').innerHTML = ''
                this.el.querySelector('#recording-player').style.display = "block"
            },
            uploadRecordFile(ev) {
                if (recordAudiVideofile) {
                    var view = this.model.get("view");
                    view.model.sendFiles([recordAudiVideofile]);
                    this.hideUploadButton()
                    //    this.showStartButton();

                    const previewEle = document.getElementById('media-preview-element');
                    // eslint-disable-next-line no-unmodified-loop-condition
                    while (previewEle && previewEle.firstChild) {
                        previewEle.removeChild(previewEle.firstChild);
                    }
                }
            },
            afterRender() {
                this.toggleVoiceAudioMessage();
                console.log('recordingDialog:afterRender', recordingMedia);
            },

            beforeRender: function () {
                console.log("Before render");
            },

            startOrStop() {
                if (document.getElementsByClassName('btn-record-start-text')[0].innerHTML === 'Start Recording') {
                    this.start();
                } else {
                    this.stop();
                }
            },

            start() {
                console.log('** recording typ:', recordingMedia);
                this.toggleStartButton();
                this.hideUploadButton();
                // this.showStopButton();
                if (video === null) {
                    video = document.createElement('video');
                    video.controls = false;
                    // eslint-disable-next-line no-undef
                    var mediaElement = getHTMLMediaElement(video, {
                        title: 'Recording status: inactive',
                        buttons: [recordingMedia === 'record-audio-plus-video' ? 'full-screen' : null /*, 'take-snapshot'*/],
                        showOnMouseEnter: false,
                        width: '100%',
                        onTakeSnapshot: function () {
                            var canvas = document.createElement('canvas');
                            canvas.width = mediaElement.clientWidth;
                            canvas.height = mediaElement.clientHeight;

                            var context = canvas.getContext('2d');
                            context.drawImage(recordingPlayer, 0, 0, canvas.width, canvas.height);

                            window.open(canvas.toDataURL('image/png'));
                        }
                    });
                    document.getElementById('recording-player').appendChild(mediaElement);

                    var div = document.createElement('section');
                    mediaElement.media.parentNode.appendChild(div);
                    div.appendChild(mediaElement.media);
                    recordingPlayer = mediaElement.media;
                }
                this.showMediaElement()
                recordingPlayer.parentNode.parentNode.querySelector('h2').innerHTML = 'Recording status: Recording';
                mediaContainerFormat = config.media_container_formats[config.media_container_format];
                if (recordingMedia === config.recordingMedia.video) {
                    mimeType = 'video/webm';
                    fileExtension = 'webm';
                    type = 'video';
                } else {
                    mediaContainerFormat = 'pcm'
                }

                var commonConfig = {
                    onMediaCaptured: function (stream) {
                        recordOb.stream = stream;
                        //    document.getElementsByClassName('btn-record-start')[0].disabled = true
                        if (recordOb.mediaCapturedCallback) {
                            recordOb.mediaCapturedCallback();
                        }

                    },
                    onMediaStopped: function () {

                        // eslint-disable-next-line no-empty
                        if (!recordOb.disableStateWaiting) {
                        }
                    },
                    onMediaCapturingFailed: function (error) {
                        console.error('onMediaCapturingFailed:', error);

                        if (error.toString().indexOf('no audio or video tracks available') !== -1) {
                            alert('RecordRTC failed to start because there are no audio or video tracks available.');
                        }

                        if (error.name === 'PermissionDeniedError' && DetectRTC.browser.name === 'Firefox') {
                            alert('Firefox requires version >= 52. Firefox also requires HTTPs.');
                        }

                        commonConfig.onMediaStopped();
                    }
                };

                if (mediaContainerFormat === 'h264') {
                    mimeType = 'video/webm\;codecs=h264';
                    fileExtension = 'mp4';

                    // video/mp4;codecs=avc1    
                    if (isMimeTypeSupported('video/mpeg')) {
                        mimeType = 'video/mpeg';
                    }
                }

                if (mediaContainerFormat === 'mkv' && isMimeTypeSupported('video/x-matroska;codecs=avc1')) {
                    mimeType = 'video/x-matroska;codecs=avc1';
                    fileExtension = 'mkv';
                }

                if (mediaContainerFormat === 'vp8' && isMimeTypeSupported('video/webm\;codecs=vp8')) {
                    mimeType = 'video/webm\;codecs=vp8';
                    fileExtension = 'webm';
                    recorderType = null;
                    type = 'video';
                }

                if (mediaContainerFormat === 'vp9' && isMimeTypeSupported('video/webm\;codecs=vp9')) {
                    mimeType = 'video/webm\;codecs=vp9';
                    fileExtension = 'webm';
                    recorderType = null;
                    type = 'video';
                }

                if (mediaContainerFormat === 'pcm') {
                    mimeType = 'audio/wav';
                    fileExtension = 'wav';
                    recorderType = StereoAudioRecorder;
                    type = 'audio';
                }

                if (mediaContainerFormat === 'opus' || mediaContainerFormat === 'ogg') {
                    if (isMimeTypeSupported('audio/webm')) {
                        mimeType = 'audio/webm';
                        fileExtension = 'webm'; // webm
                    }

                    if (isMimeTypeSupported('audio/ogg')) {
                        mimeType = 'audio/ogg; codecs=opus';
                        fileExtension = 'ogg'; // ogg
                    }
                    recorderType = null;
                    type = 'audio';
                }

                if (mediaContainerFormat === 'whammy') {
                    mimeType = 'video/webm';
                    fileExtension = 'webm';
                    recorderType = WhammyRecorder;
                    type = 'video';
                }

                if (mediaContainerFormat === 'gif') {
                    mimeType = 'image/gif';
                    fileExtension = 'gif';
                    recorderType = GifRecorder;
                    type = 'gif';
                }

                if (mediaContainerFormat === 'default') {
                    mimeType = 'video/webm';
                    fileExtension = 'webm';
                    recorderType = null;
                    type = 'video';
                }
                if (recordingMedia === 'record-audio') {
                    captureAudio(commonConfig);

                    recordOb.mediaCapturedCallback = function () {
                        var options = {
                            type: type,
                            mimeType: mimeType,
                            leftChannel: params.leftChannel || false,
                            disableLogs: params.disableLogs || false
                        };

                        if (params.sampleRate) {
                            // eslint-disable-next-line radix
                            options.sampleRate = parseInt(params.sampleRate);
                        }

                        if (params.bufferSize) {
                            // eslint-disable-next-line radix
                            options.bufferSize = parseInt(params.bufferSize);
                        }

                        if (recorderType) {
                            options.recorderType = recorderType;
                        }

                        if (videoBitsPerSecond) {
                            options.videoBitsPerSecond = videoBitsPerSecond;
                        }

                        if (DetectRTC.browser.name === 'Edge') {
                            options.numberOfAudioChannels = 1;
                        }

                        options.ignoreMutedMedia = false;
                        recordOb.recordRTC = RecordRTC(recordOb.stream, options);

                        recordOb.recordingEndedCallback = function (url) {
                            setVideoURL(url);
                        };
                        //   document.getElementsByClassName('btn-record-start')[0].disabled = true
                        recordOb.recordRTC.startRecording();
                        //recordingPlayer.parentNode.parentNode.querySelector('h2').innerHTML = '<img src="https://cdn.webrtc-experiment.com/images/progress.gif">';
                        //btnPauseRecording.style.display = '';
                    };
                }
                if (recordingMedia === 'record-audio-plus-video') {
                    captureAudioPlusVideo(commonConfig);

                    recordOb.mediaCapturedCallback = function () {
                        if (typeof MediaRecorder === 'undefined') { // opera or chrome etc.
                            recordOb.recordRTC = [];

                            if (!params.bufferSize) {
                                // it fixes audio issues whilst recording 720p
                                params.bufferSize = 16384;
                            }

                            const options = {
                                type: 'audio', // hard-code to set "audio"
                                leftChannel: params.leftChannel || false,
                                disableLogs: params.disableLogs || false,
                                video: recordingPlayer
                            };

                            if (params.sampleRate) {
                                options.sampleRate = parseInt(params.sampleRate);
                            }

                            if (params.bufferSize) {
                                options.bufferSize = parseInt(params.bufferSize);
                            }

                            if (params.frameInterval) {
                                options.frameInterval = parseInt(params.frameInterval);
                            }

                            if (recorderType) {
                                options.recorderType = recorderType;
                            }

                            if (videoBitsPerSecond) {
                                options.videoBitsPerSecond = videoBitsPerSecond;
                            }

                            options.ignoreMutedMedia = false;
                            var audioRecorder = RecordRTC(button.stream, options);

                            options.type = type;
                            var videoRecorder = RecordRTC(button.stream, options);

                            // to sync audio/video playbacks in browser!
                            videoRecorder.initRecorder(function () {
                                audioRecorder.initRecorder(function () {
                                    audioRecorder.startRecording();
                                    videoRecorder.startRecording();
                                    //btnPauseRecording.style.display = '';
                                    recordingPlayer.parentNode.parentNode.querySelector('h2').innerHTML = '<img src="chatapp/icons/progress.gif">';
                                });
                            });

                            recordOb.recordRTC.push(audioRecorder, videoRecorder);

                            recordOb.recordingEndedCallback = function () {
                                var audio = new Audio();
                                audio.src = audioRecorder.toURL();
                                audio.controls = true;
                                audio.autoplay = true;

                                recordingPlayer.parentNode.appendChild(document.createElement('hr'));
                                recordingPlayer.parentNode.appendChild(audio);

                                if (audio.paused) audio.play();
                            };
                            return;
                        }

                        const options = {
                            type: type,
                            mimeType: mimeType,
                            disableLogs: params.disableLogs || false,
                            getNativeBlob: false, // enable it for longer recordings
                            video: recordingPlayer
                        };

                        if (recorderType) {
                            options.recorderType = recorderType;

                            if (recorderType == WhammyRecorder || recorderType == GifRecorder) {
                                options.canvas = options.video = {
                                    width: defaultWidth || 320,
                                    height: defaultHeight || 240
                                };
                            }
                        }

                        if (videoBitsPerSecond) {
                            options.videoBitsPerSecond = videoBitsPerSecond;
                        }

                        if (timeSlice && typeof MediaRecorder !== 'undefined') {
                            options.timeSlice = timeSlice;
                            button.blobs = [];
                            options.ondataavailable = function (blob) {
                                button.blobs.push(blob);
                            };
                        }

                        options.ignoreMutedMedia = false;
                        recordOb.recordRTC = RecordRTC(recordOb.stream, options);

                        recordOb.recordingEndedCallback = function (url) {
                            setVideoURL(url);
                        };

                        recordOb.recordRTC.startRecording();
                        //btnPauseRecording.style.display = '';
                        //   document.getElementsByClassName('btn-record-start')[0].disabled = true
                        recordingPlayer.parentNode.parentNode.querySelector('h2').innerHTML = '<img src="chatapp/icons/progress.gif">';
                    };
                }


            },
            stop() {
                this.showUploadButton()
                this.toggleStartButton();
                //   this.hideStopButton();

                const that = this
                function stopStream() {
                    if (recordOb.stream && recordOb.stream.stop) {
                        recordOb.stream.stop();
                        recordOb.stream = null;
                    }

                    if (recordOb.stream instanceof Array) {
                        recordOb.stream.forEach(function (stream) {
                            stream.stop();
                        });
                        recordOb.stream = null;
                    }

                    videoBitsPerSecond = null;
                    var html = 'Recording status: stopped';
                    html += '<br>Size: ' + bytesToSize(recordOb.recordRTC.getBlob().size);
                    document.getElementsByClassName('btn-record-start')[0].disabled = false
                    recordingPlayer.parentNode.parentNode.querySelector('h2').innerHTML = html;
                }

                if (recordOb.recordRTC) {
                    if (recordOb.recordRTC.length > 0) {
                        console.log('**** recordRTC object ***');
                        if (!recordOb.recordRTC[0].stopRecording) {
                            // that.showStartButton();
                        }
                        recordOb.recordRTC[0].stopRecording(function (url) {
                            if (!recordOb.recordRTC[1]) {
                                recordOb.recordingEndedCallback(url);
                                stopStream();

                                //saveToDiskOrOpenNewTab(recordOb.recordRTC[0]);
                                that.previweRecording(recordOb.recordRTC[0])
                                //   that.uploadRecordFile(recordOb.recordRTC[0])
                                return;
                            }

                            recordOb.recordRTC[1].stopRecording(function (url) {
                                recordOb.recordingEndedCallback(url);
                                stopStream();
                            });
                        });
                    }
                    else {
                        if (!recordOb.recordRTC.stopRecording) {
                            // that.showStartButton();
                            return;
                        }
                        recordOb.recordRTC.stopRecording(function (url) {
                            if (recordOb.blobs && recordOb.blobs.length) {
                                var blob = new File(recordOb.blobs, getFileName(fileExtension), {
                                    type: mimeType
                                });

                                recordOb.recordRTC.getBlob = function () {
                                    return blob;
                                };

                                url = URL.createObjectURL(blob);
                            }

                            recordOb.recordingEndedCallback(url);
                            //saveToDiskOrOpenNewTab(recordOb.recordRTC);
                            that.previweRecording(recordOb.recordRTC)
                            //   that.uploadRecordFile(recordOb.recordRTC)
                            stopStream();
                        });
                    }
                }
            }
        });
        _converse.api.listen.on('renderToolbar', function (view) {
            var id = view.model.get("box_id");
            var html = '';
            //   html = '<a class="far fa-trash-alt" title="Trash local storage of chat history"></a>';
            //   addToolbarItem(view, id, "webmeet-trash-" + id, html);
            //   setTimeout(function(){
            //       var trash = document.getElementById("webmeet-trash-" + id);
            //       if (trash) {
            //           trash.addEventListener('click', function(evt)
            //           {

            //               evt.stopPropagation();
            //               view.clearMessages();
            //               if(view.model.get('type')==='chatroom'){
            //                 let roomname = view.model.get("jid")
            //                 roomname = roomname.split('@')[0]
            //                 const xhr = new window.XMLHttpRequest();
            //                 xhr.open("DELETE", `${config.xhr_restapi}chatrooms/${roomname}/chathistory`, true);
            //                 xhr.setRequestHeader('Authorization',"Basic " + btoa(_converse.connection.jid.split('/')[0] + ":" + _converse.connection.pass));
            //                 xhr.setRequestHeader( 'Content-Type',   'application/json' );
            //                 xhr.send()
            //               } else{
            //                   const toJID = view.model.get('jid');
            //                   const fromJID = _converse.connection.jid.split('/')[0]
            //                   const xhr = new window.XMLHttpRequest();
            //                   xhr.open("DELETE", `${config.xhr_restapi}messages/chathistory/${fromJID}/${toJID}`, true);
            //                   xhr.setRequestHeader('Authorization',"Basic " + btoa(_converse.connection.jid.split('/')[0] + ":" + _converse.connection.pass));
            //                   xhr.setRequestHeader( 'Content-Type',   'application/json' );
            //                   xhr.send()
            //                   console.log(fromJID,toJID);
            //               }


            //           }, false);
            //       }
            //   },3000)

            html = '<a class="fas fa-microphone" title="Recording"></a>';
            addToolbarItem(view, id, "webmeet-recording-" + id, html);
            setTimeout(function () {
                var recording = document.getElementById("webmeet-recording-" + id);
                if (recording) {
                    recording.addEventListener('click', function (evt) {
                        console.log('** recordOb **');
                        console.log(recordOb);
                        if (recordOb.recordRTC) recordOb.recordRTC.destroy();
                        recordAudiVideofile = null;
                        console.log('** recordOb **');
                        const previewEle = document.getElementById('media-preview-element');
                        // eslint-disable-next-line no-unmodified-loop-condition
                        while (previewEle && previewEle.firstChild) {
                            previewEle.removeChild(previewEle.firstChild);
                        }

                        evt.stopPropagation();
                        _converse.recorder_model.set({ view: view, state: 'audio' })
                        if (recordingDialog === null) {
                            recordingDialog = new RecordingDialog({ 'model': _converse.recorder_model });
                        }
                        recordingDialog.render();
                        recordingDialog.show();
                        recordingMedia = config.recordingMedia.audio
                        // audioRecording(view)

                    }, false);
                }
            }, 3000)

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
            },

        },
        ChatRoomView: {
            events: {
                //   'click .top-toolbar-file-attach': 'toggleFileUpload',
                'click .top-toolbar-desktop-record': 'desktopRecording',
                'click .top-toolbar-recording-video': 'videoCall',
                'click .top-toolbar-recording-audio': 'audioCall',
                'click .top-toolbar-setting': 'getAndRenderConfigurationForm',
                'click .top-toolbar-info': 'toggleOccupants'
            },
            renderHeading: function () {
                this.__super__.renderHeading.apply(this, arguments);
                this.renderTopToolMenuBar();
            },
            renderTopToolMenuBar() {

                this.el.querySelector('.top-toolbar-menu').insertAdjacentHTML('beforeend', getTopToolBarChatRoomHtml(this.model.get('affiliation')))
            },
            desktopRecording() {
                desktopRecording(this)
            },
            videoRecording() {
                videoRecording(this)
            },
            //   audioRecording(){
            //       audioRecording(this)
            //   },

        },
        ChatBoxView: {
            events: {
                //   'click .top-toolbar-file-attach': 'toggleFileUpload',
                'click .top-toolbar-desktop-record': 'desktopRecording',
                'click .top-toolbar-recording-video': 'videoCall',
                'click .top-toolbar-recording-audio': 'audioCall',
            },
            //   render:function () {
            //       this.__super__.render.apply(this, arguments);
            //       this.renderTopToolMenuBar();
            //   },
            insertHeading: function () {
                this.__super__.insertHeading.apply(this, arguments);
                this.renderTopToolMenuBar();
                return this;
            },
            renderTopToolMenuBar() {
                var that = this;
                setTimeout(function () {
                    that.el.querySelector('.top-toolbar-menu').innerHTML = getTopToolBarChatBoxHtml()
                }, 2000)

            },
            desktopRecording() {
                desktopRecording(this)
            },
            videoRecording() {

                videoRecording(this)
            },
            //   audioRecording(){
            //       audioRecording(this)
            //   },
        },
        ChatBoxHeading: {
            render: function () {
                this.__super__.render.apply(this, arguments);
                this.renderTopToolMenuBar();
                return this;
            },
            renderTopToolMenuBar() {
                var that = this;
                // setTimeout(function(){
                that.el.querySelector('.top-toolbar-menu').innerHTML = getTopToolBarChatBoxHtml()
                // },2000)           

            },
        }
    }
});
function getTopToolBarChatRoomHtml(affiliation) {
    var settingButton = affiliation === "owner" ?
        '<li class="top-toolbar-setting" title="Setting">' +
        '<i class="fas fa-cog"></i>' +
        '</li>' : ''
    var videoButton = affiliation === "owner" ?
        '<li class="top-toolbar-video-call" title="Video Call">' +
        '<i class="fa fa-video"></i>' +
        '</li>' : ''
    var audioButton = affiliation === "owner" ?
        '<li class="top-toolbar-audio-call" title="Audio Call">' +
        '<i class="fas fa-phone"></i>' +
        '</li>' : ''
    var topToolBarMenu =
        videoButton +
        audioButton +

        //   '<li class="top-toolbar-switch-call hidden" title="switch call">'+
        //   '<i class="fas fa-sync"></i>'+
        //   '</li>'+
        '<li class="top-toolbar-file-attach" title="List Content">' +
        '<i class="fa fa-paperclip"></i>' +
        '</li>'
    //   '<li class="top-toolbar-join-call hidden" title="Join Call">'+
    //       '<i class="fas fa-phone-volume"></i>'+
    //   '</li>'

    //   '<li class="top-toolbar-recording-audio" title="Audio Recording">'+
    //       '<i class="fas fa-microphone"></i>'+
    //   '</li>'+
    //   '<li class="top-toolbar-info" title="Information">'+
    //       '<i class="fa fa-info-circle"></i>'+
    //   '</li>'+
    //   settingButton+
    //   '<li class="top-toolbar-searchbox form-group form-group-feedback form-group-feedback-left" title="Search Box">'+
    //       '<input type="text" class="form-control chatapp-filter-all" placeholder="Search Channel">'+
    //       '<div class="form-control-feedback">'+
    //           '<i class="fa fa-search"></i>'+
    //       '</div>'+
    //   '</li>'+
    //   '<li class="top-toolbar-at favorite-at" title="AT">'+
    //       '<i class="fas fa-at"></i>'+
    //   '</li>'+
    //   '<li class="top-toolbar-star favorite-star" title="Star">'+
    //       '<i class="fas fa-star"></i>'+
    //   '</li>'+
    //   '<li class="top-toolbar-dots favorite-dots" title="More">'+
    //       '<i class="fas fa-ellipsis-v"></i>'+
    //   '</li>'
    return topToolBarMenu;
}
function getTopToolBarChatBoxHtml() {
    var topToolBarMenu =
        '<li class="top-toolbar-video-call" title="Video Call">' +
        '<i class="fa fa-video"></i>' +
        '</li>' +
        '<li class="top-toolbar-audio-call" title="Audio Call">' +
        '<i class="fas fa-phone"></i>' +
        '</li>' +
        //   '<li class="top-toolbar-switch-call hidden" title="switch call">'+
        //   '<i class="fas fa-sync"></i>'+
        //   '</li>'+
        '<li class="top-toolbar-file-attach" title="List Content">' +
        '<i class="fa fa-paperclip"></i>' +
        '</li>'
    //   '<li class="top-toolbar-join-call hidden" title="Join Call">'+
    //       '<i class="fas fa-phone-volume"></i>'+
    //   '</li>'
    //   '<li class="top-toolbar-searchbox form-group form-group-feedback form-group-feedback-left" title="Search Box">'+
    //       '<input type="text" class="form-control chatapp-filter-all" placeholder="Search Channel">'+
    //       '<div class="form-control-feedback">'+
    //           '<i class="fa fa-search"></i>'+
    //       '</div>'+
    //   '</li>'+
    //   '<li class="top-toolbar-at favorite-at" title="AT">'+
    //       '<i class="fas fa-at"></i>'+
    //   '</li>'+
    //   '<li class="top-toolbar-star favorite-star" title="Star">'+
    //       '<i class="fas fa-star"></i>'+
    //   '</li>'+
    //   '<li class="top-toolbar-dots favorite-dots" title="More">'+
    //       '<i class="fas fa-ellipsis-v"></i>'+
    //   '</li>'
    return topToolBarMenu;
}
function desktopRecording(view) {
    toggleScreenCast(view);
}
function videoRecording(view) {
    if (recordingDialog === null) {
        recordingDialog = new RecordingDialog({ 'model': new converse.env.Backbone.Model({ view: view, state: 'video' }) });
    }

    recordingDialog.show();
    recordingMedia = config.recordingMedia.video
    recordingDialog.start();
}
function audioRecording(view) {
    if (recordingDialog === null) {
        recordingDialog = new RecordingDialog({ 'model': new converse.env.Backbone.Model({ view: view, state: 'audio' }) });
    }
    recordingDialog.show();
    recordingMedia = config.recordingMedia.audio
    recordingDialog.start();
}

var addToolbarItem = function (view, id, label, html) {
    //   var placeHolder = view.el.querySelector('#place-holder');

    //   if (!placeHolder)
    //   {
    //       var smiley = view.el.querySelector('.toggle-smiley.dropup');
    //       smiley.insertAdjacentElement('afterEnd', newElement('li', 'place-holder'))
    //       placeHolder = view.el.querySelector('#place-holder');
    //   }
    view.el.querySelector('.chat-toolbar').insertAdjacentElement('beforeend', newElement('li', label, html));
}
var newElement = function (el, id, html, className) {
    var ele = document.createElement(el);
    if (id) ele.id = id;
    if (html) ele.innerHTML = html;
    if (className) ele.classList.add(className);
    document.body.appendChild(ele);
    return ele;
}
var toggleScreenCast = function (view) {

    if (videoRecorder === null) {
        chrome.runtime.sendMessage(
            config.chromeExtensionId,
            {
                getStream: true,
                sources: ['screen']
            },
            response => {
                if (!response) {
                    // possibly re-wraping error message to make code consistent
                    console.log('reponse', response)
                    extensionDialog = new ExtensionDialog({ 'model': new converse.env.Backbone.Model({ url: config.chromeExtensionUrl }) });
                    extensionDialog.show();
                    return;
                }

                navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: response.streamId
                        }
                    }
                }).then((stream) => handleStream(stream, view)).catch((e) => handleError(e))

            }
        );

    } else {
        videoRecorder.stop();
    }

    return true;
}
var handleStream = function handleStream(stream, view) {
    stream.getVideoTracks()[0].onended = function () {
        // doWhatYouNeedToDo();
        videoStreapStop();
    };
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((audioStream) => handleAudioStream(stream, audioStream, view)).catch((e) => handleError(e))
}

var videoStreapStop = function () {
    videoRecorder.stop();
}
// eslint-disable-next-line func-name-matching
var handleAudioStream = function handleStream(stream, audioStream, view) {
    console.debug("handleAudioStream - seperate", stream, audioStream);

    stream.addTrack(audioStream.getAudioTracks()[0]);
    audioStream.removeTrack(audioStream.getAudioTracks()[0]);

    console.debug("handleAudioStream - merged", stream);

    var video = document.createElement('video');
    video.playsinline = true;
    video.autoplay = true;
    video.muted = true;
    video.srcObject = stream;
    video.style.display = "none";

    setTimeout(function () {
        videoRecorder = new MediaRecorder(stream);
        videoChunks = [];

        videoRecorder.ondataavailable = function (e) {
            console.debug("handleStream - start", e);

            if (e.data.size > 0) {
                console.debug("startRecorder push video ", e.data);
                videoChunks.push(e.data);
            }
        }

        videoRecorder.onstop = function (e) {
            console.debug("handleStream - stop", e);

            stream.getTracks().forEach(track => track.stop());

            var blob = new Blob(videoChunks, { type: 'video/webm;codecs=h264' });
            var file = new File([blob], "screencast-" + Math.random().toString(36).substr(2, 9) + ".webm", { type: 'video/webm;codecs=h264' });
            previewDesktopRecord(view, file);
            videoRecorder = null;
        }

        videoRecorder.start();
        console.debug("handleStream", video, videoRecorder);

    }, 1000);
}
var previewDesktopRecord = function (view, file) {
    screenRecorderPreview = new ScreenRecorderPreview({ 'model': new converse.env.Backbone.Model({ view: view, file: file }) })
    screenRecorderPreview.show();
    // view.model.sendFiles([file]);
}
var handleError = function handleError(e) {
    console.error("ScreenCast", e)
}
function getVideoResolutions(mediaConstraints) {
    if (!mediaConstraints.video) {
        return mediaConstraints;
    }

    var value = config.media_resolutions[config.media_resolution];

    if (value == 'default') {
        return mediaConstraints;
    }

    value = value.split('x');

    if (value.length != 2) {
        return mediaConstraints;
    }

    defaultWidth = parseInt(value[0]);
    defaultHeight = parseInt(value[1]);

    if (DetectRTC.browser.name === 'Firefox') {
        mediaConstraints.video.width = defaultWidth;
        mediaConstraints.video.height = defaultHeight;
        return mediaConstraints;
    }

    if (!mediaConstraints.video.mandatory) {
        mediaConstraints.video.mandatory = {};
        mediaConstraints.video.optional = [];
    }

    // var isScreen = recordingMedia.value.toString().toLowerCase().indexOf('screen') != -1;

    // if(isScreen) {
    //     mediaConstraints.video.mandatory.maxWidth = defaultWidth;
    //     mediaConstraints.video.mandatory.maxHeight = defaultHeight;
    // }
    // else {
    //     mediaConstraints.video.mandatory.minWidth = defaultWidth;
    //     mediaConstraints.video.mandatory.minHeight = defaultHeight;
    // }
    mediaConstraints.video.mandatory.minWidth = defaultWidth;
    mediaConstraints.video.mandatory.minHeight = defaultHeight;

    return mediaConstraints;
}
function setVideoBitrates() {
    //var select = document.querySelector('.media-bitrates');
    var value = config.media_bitrates[config.media_bitrate];

    if (value == 'default') {
        videoBitsPerSecond = null;
        return;
    }

    videoBitsPerSecond = parseInt(value);
}

function getFrameRates(mediaConstraints) {
    if (!mediaConstraints.video) {
        return mediaConstraints;
    }

    // var select = document.querySelector('.media-framerates');
    var value = config.media_framerates[config.media_framerate];

    if (value == 'default') {
        return mediaConstraints;
    }

    value = parseInt(value);

    if (DetectRTC.browser.name === 'Firefox') {
        mediaConstraints.video.frameRate = value;
        return mediaConstraints;
    }

    if (!mediaConstraints.video.mandatory) {
        mediaConstraints.video.mandatory = {};
        mediaConstraints.video.optional = [];
    }
    mediaConstraints.video.mandatory.minFrameRate = value;
    return mediaConstraints;
}
function isMimeTypeSupported(mimeType) {
    if (typeof MediaRecorder === 'undefined') {
        return false;
    }

    if (typeof MediaRecorder.isTypeSupported !== 'function') {
        return true;
    }

    return MediaRecorder.isTypeSupported(mimeType);
}
function captureAudio(config) {
    captureUserMedia({ audio: true }, function (audioStream) {
        config.onMediaCaptured(audioStream);

        addStreamStopListener(audioStream, function () {
            config.onMediaStopped();
        });
    }, function (error) {
        config.onMediaCapturingFailed(error);
    });
}
function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
    if (mediaConstraints.video == true) {
        mediaConstraints.video = {};
    }

    setVideoBitrates();

    mediaConstraints = getVideoResolutions(mediaConstraints);
    mediaConstraints = getFrameRates(mediaConstraints);

    // eslint-disable-next-line wrap-regex
    var isBlackBerry = !!(/BB10|BlackBerry/i.test(navigator.userAgent || ''));
    if (isBlackBerry && !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia)) {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        navigator.getUserMedia(mediaConstraints, successCallback, errorCallback);
        return;
    }

    navigator.mediaDevices.getUserMedia(mediaConstraints).then(function (stream) {
        successCallback(stream);

        setVideoURL(stream, true);
    }).catch(function (error) {
        if (error && (error.name === 'ConstraintNotSatisfiedError' || error.name === 'OverconstrainedError')) {
            alert('Your camera or browser does NOT supports selected resolutions or frame-rates. \n\nPlease select "default" resolutions.');
        }
        else if (error && error.message) {
            alert(error.message);
        }
        else {
            alert('Unable to make getUserMedia request. Please check browser console logs.');
        }

        errorCallback(error);
    });
}
function addStreamStopListener(stream, callback) {
    var streamEndedEvent = 'ended';

    if ('oninactive' in stream) {
        streamEndedEvent = 'inactive';
    }

    stream.addEventListener(streamEndedEvent, function () {
        callback();
        callback = function () { };
    }, false);

    stream.getAudioTracks().forEach(function (track) {
        track.addEventListener(streamEndedEvent, function () {
            callback();
            callback = function () { };
        }, false);
    });

    stream.getVideoTracks().forEach(function (track) {
        track.addEventListener(streamEndedEvent, function () {
            callback();
            callback = function () { };
        }, false);
    });
}
function setVideoURL(arg, forceNonImage) {
    var url = getURL(arg);

    var parentNode = recordingPlayer.parentNode;
    parentNode.removeChild(recordingPlayer);
    parentNode.innerHTML = '';

    var elem = 'video';
    if (type == 'gif' && !forceNonImage) {
        elem = 'img';
    }
    if (type == 'audio') {
        elem = 'audio';
    }

    recordingPlayer = document.createElement(elem);

    if (arg instanceof MediaStream) {
        recordingPlayer.muted = true;
    }

    recordingPlayer.addEventListener('loadedmetadata', function () {
        if (navigator.userAgent.toLowerCase().indexOf('android') == -1) return;

        // android
        setTimeout(function () {
            if (typeof recordingPlayer.play === 'function') {
                recordingPlayer.play();
            }
        }, 2000);
    }, false);

    recordingPlayer.poster = '';

    if (arg instanceof MediaStream) {
        recordingPlayer.srcObject = arg;
    }
    else {
        recordingPlayer.src = url;
    }

    if (typeof recordingPlayer.play === 'function') {
        recordingPlayer.play();
    }

    recordingPlayer.addEventListener('ended', function () {
        url = getURL(arg);

        if (arg instanceof MediaStream) {
            recordingPlayer.srcObject = arg;
        }
        else {
            recordingPlayer.src = url;
        }
    });

    parentNode.appendChild(recordingPlayer);
}
function getURL(arg) {
    var url = arg;

    if (arg instanceof Blob || arg instanceof File) {
        url = URL.createObjectURL(arg);
    }

    if (arg instanceof RecordRTC || arg.getBlob) {
        url = URL.createObjectURL(arg.getBlob());
    }

    if (arg instanceof MediaStream || arg.getTracks || arg.getVideoTracks || arg.getAudioTracks) {
        // url = URL.createObjectURL(arg);
    }

    return url;
}
function captureAudioPlusVideo(config) {
    captureUserMedia({ video: true, audio: true }, function (audioVideoStream) {
        config.onMediaCaptured(audioVideoStream);

        if (audioVideoStream instanceof Array) {
            audioVideoStream.forEach(function (stream) {
                addStreamStopListener(stream, function () {
                    config.onMediaStopped();
                });
            });
            return;
        }

        addStreamStopListener(audioVideoStream, function () {
            config.onMediaStopped();
        });
    }, function (error) {
        config.onMediaCapturingFailed(error);
    });
}
function getFileName(fileExtension) {
    var d = new Date();
    var year = d.getUTCFullYear();
    var month = d.getUTCMonth();
    var date = d.getUTCDate();
    return 'RecordRTC-' + year + month + date + '-' + getRandomString() + '.' + fileExtension;
}
function getRandomString() {
    if (window.crypto && window.crypto.getRandomValues && navigator.userAgent.indexOf('Safari') === -1) {
        var a = window.crypto.getRandomValues(new Uint32Array(3)),
            token = '';
        for (var i = 0, l = a.length; i < l; i++) {
            token += a[i].toString(36);
        }
        return token;
    } else {
        return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
    }
}
function fullscreen() {
    var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);

    var docElm = document.documentElement;
    if (!isInFullScreen) {
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
        } else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
        } else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen();
        } else if (docElm.msRequestFullscreen) {
            docElm.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

