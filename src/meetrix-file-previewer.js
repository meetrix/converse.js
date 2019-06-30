// namespace of the "converse" global.
import converse from "@converse/headless/converse-core";

const { Strophe, _, u, sizzle, Backbone, $iq, $msg, $pres, $build, b64_sha1 } = converse.env;

// Commonly used utilities and variables can be found under the "env"
// namespace of the "converse" global.
var SearchDialog = null;
var __ = null;
var PreviewDialog;
var previewDialog;

// The following line registers your plugin.
converse.plugins.add("previewer", {

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
    'dependencies': ["converse-message-view"],

    /* Converse.js's plugin mechanism will call the initialize
     * method on any plugin (if it exists) as soon as the plugin has
     * been loaded.
     */
    'initialize': function () {
        /* Inside this method, you have access to the private
         * `_converse` object.
         */
        var _converse = this._converse;
        __ = _converse.__
        _converse.log("The \"myplugin\" plugin is being initialized");

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

        /* The user can then pass in values for the configuration
         * settings when `converse.initialize` gets called.
         * For example:
         *
         *      converse.initialize({
         *           "initialize_message": "My plugin has been initialized"
         *      });
         */

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
         *      _converse.api.trigger('operationCompleted');
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
        PreviewDialog = _converse.BootstrapModal.extend({
            initialize() {
                _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
            },
            toHTML() {
                var view = this.model.get("view");
                var id = view.model.get("id").split("@")[0];
                var url = this.model.get("url");
                return '<div class="modal pic-preview" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                    '<div class="modal-header">' +
                    '  <h1 class="modal-title">Image Preview</h1>' +
                    '  <button type="button" class="close" data-dismiss="modal">&times;</button>' +
                    '</div>' +
                    '<div class="modal-body"><img src="' + url + '"/></div>' +
                    '<div class="modal-footer"> <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button> </div>' +
                    '</div> </div> </div>';
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

            // Your custom code can come here ...

            // You can access the original function being overridden
            // via the __super__ attribute.
            // Make sure to pass on the arguments supplied to this
            // function and also to apply the proper "this" object.
            _converse.__super__.onConnected.apply(this, arguments);

            // Your custom code can come here ...
        },
        MessageView: {
            events: {
                'click .chat-image': 'previewer'
            },
            previewer() {
                previewDialog = new PreviewDialog({ 'model': new converse.env.Backbone.Model({ view: this, url: this.el.querySelector('.chat-image').getAttribute('src') }) });
                previewDialog.show();
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
