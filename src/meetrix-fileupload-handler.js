// version 0.4.11.1

// Commonly used utilities and variables can be found under the "env"
// namespace of the "converse" global.
import converse from "@converse/headless/converse-core";

const { Strophe, _, u, sizzle, Backbone, $iq, $msg, $pres, $build, b64_sha1 } = converse.env;

var _converse = null, baseUrl = null, messageCount = 0, h5pViews = {}, pasteInputs = {}, videoRecorder = null, userProfiles = {};
var PreviewDialog = null, previewDialog = null, GeoLocationDialog = null, geoLocationDialog = null;
var FileUpladModal, fileuploadModal;
// The following line registers your plugin.
converse.plugins.add("meetrix-fileupload-handler", {

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
    'dependencies': ['converse-chatview', 'converse-muc-views'],

    /* Converse.js's plugin mechanism will call the initialize
     * method on any plugin (if it exists) as soon as the plugin has
     * been loaded.
     */
    'initialize': function () {
        /* Inside this method, you have access to the private
         * `_converse` object.
         */
        _converse = this._converse;
        console.log("file upload is ready");

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
        FileUpladModal = _converse.BootstrapModal.extend({
            initialize() {
                _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
            },
            toHTML() {
                return '<div class="modal" id="myModal">' +
                    '<div class="modal-dialog"> ' +
                    '<div class="modal-content file-upload-modal">' +
                    '<div class="modal-header">' +
                    '<h1 class="modal-title">Upload a file</h1>' +
                    '<button type="button" class="close" data-dismiss="modal"><i class="fas fa-times"></i></button>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '<form>' +
                    '<div class="form-group">' +
                    '<textarea class="form-control" id="fileAttachMessage" name="fileAttachMessage" rows="3"placeholder="Add message about a file"></textarea>' +
                    '</div>' +
                    '<div class="form-group upload-and-preview">' +
                    '<span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span>' +
                    '<input type="file" class="form-control" id="fileAttach" name="fileAttach" aria-describedby="emailHelp" style="display:none"></input>' +
                    '<input type="button" class="btn custom-white-btn" id="dummyFileAttach" value="Browse"/>' +
                    '<video width="400" width="600" controls style="display:none" ><source id="preview-video"/>Your browser does not support HTML5 video.</video>' +
                    '<img id="preview-img" style="display:none" src="#"/>' +
                    '</div>' +
                    '<div id="filename-labels" class="form-group">' +
                    '<label for="filename">Filename</label>' +
                    '<input type="text" class="form-control" id="filename" name="filename" placeholder="Please Browse the File"></input>' +
                    '</div>' +

                    '<div class="form-group button-div">' +
                    '<input type="button" class="btn custom-white-btn mr-2 btn-close" aria-label="Close" data-dismiss="modal" value="Cancel"/>' +
                    '<input type="submit" class="btn custom-green-btn" value="Upload"/>' +
                    '</div>' +
                    '</form>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>'
            },
            events: {
                "submit form": "uploadFile",
                "click #dummyFileAttach": "fileLoad",
                "click .btn-close": "closeModal",
                "change #fileAttach": "filechange"
            },
            validationRegistationForm(form) {
                const fileAttachMEssage = form.querySelector('input[name=fileAttach]').value;
                if (!fileAttachMEssage) {
                    return false
                }
                return true
            },
            uploadFile(ev) {

                ev.preventDefault();
                if (!this.validationRegistationForm(ev.target)) {
                    return;
                }
                var view = this.model.get("view");
                const data = new FormData(ev.target);
                const msg = data.get('fileAttachMessage')
                let file = data.get('fileAttach');
                const filename = data.get('filename');
                // this.el.querySelector('filename').value = filename
                if (filename) {
                    var formData = new FormData();
                    formData.append('file', file, filename);
                    file = formData.get('file');
                }

                // isFileUploadAvailable(view, function()
                //   {
                if (!file) {
                    alert("Nothing to upload!!");
                    return;
                }
                console.log(ev)
                view.model.sendFiles([file]);

                if (msg) {
                    // setTimeout(function(){
                    view.model.sendMessage(msg);
                    // },1000);
                }
                // setTimeout(function(){
                fileuploadModal.modal.hide()
                // },2000);
                // });
            },
            fileLoad() {
                this.el.querySelector('#fileAttach').click();
            },
            closeModal() {
                this.el.querySelector('form').reset()
                fileuploadModal.modal.hide()
            },
            filechange(ev) {

                this.readURL(ev.target);
            },
            readURL(input) {
                if (input.files && input.files[0]) {
                    this.el.querySelector('#filename').value = input.files[0].name
                    const reader = new FileReader();
                    const fileType = input.files[0].name.split('.')[1]
                    const that = this
                    reader.onload = function (e) {
                        if ((/(gif|jpg|jpeg|tiff|png)$/i).test(fileType)) {
                            setTimeout(function () {
                                console.log()
                                that.el.querySelector('#preview-img').src = e.target.result;
                                that.el.querySelector('#preview-img').style.display = "block";
                                that.el.querySelector('#filename-labels').style.position = "relative";
                                that.el.querySelector('#filename-labels').style.top = "-43px";
                            }, 1000);

                        }
                        else if ((/(mp4|3gp)$/i).test(fileType)) {

                            const $source = that.el.querySelector('#preview-video');
                            setTimeout(function () {
                                $source[0].src = URL.createObjectURL(input.files[0]);
                                $source.parent()[0].load();
                                $source.parent().css({ display: "block" });
                                $source.parent().attr('controls', true)
                            }, 1000);
                        }


                    }

                    reader.readAsDataURL(input.files[0]);
                }
            },

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


            _converse.__super__.onConnected.apply(this, arguments);
        },
        ChatRoomView: {
            events: {
                'click .add-message': 'openFileUploadModel',
            },
            openFileUploadModel(ev) {
                ev.preventDefault();
                fileuploadModal = new FileUpladModal({ 'model': new converse.env.Backbone.Model({ view: this }) });
                fileuploadModal.show();
                return true
            }
        },
        ChatBoxView: {
            events: {
                'click .add-message': 'openFileUploadModel',
            },
            openFileUploadModel(ev) {
                ev.preventDefault();
                console.log('openfire upload1')
                fileuploadModal = new FileUpladModal({ 'model': new converse.env.Backbone.Model({ view: this }) });
                fileuploadModal.show();
                return true
            }
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
var isFileUploadAvailable = async function (view, callback) {
    const result = await _converse.api.disco.supports('urn:xmpp:http:upload:0', _converse.domain);
    console.log(result.length > 0)
    if (result.length > 0) callback();
}
