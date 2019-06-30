import converse from "@converse/headless/converse-core";

const { Strophe, _, u, sizzle, Backbone, $iq, $msg, $pres, $build, b64_sha1,utils } = converse.env;


// Commonly used utilities and variables can be found under the "env"
// namespace of the "converse" global.


// The following line registers your plugin.
converse.plugins.add("meetrix-ringing-handler", {

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
    'dependencies': ['converse-roster', "converse-chatboxviews"],

    /* Converse.js's plugin mechanism will call the initialize
     * method on any plugin (if it exists) as soon as the plugin has
     * been loaded.
     */
    'initialize': function () {
        /* Inside this method, you have access to the private
         * `_converse` object.
         */
        var _converse = this._converse;
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
            'initialize_message': 'Initializing ringing plugin!'
        });
        function ringingHandle(message) {
            let from_jid = message.getAttribute('from');
            from_jid = from_jid.split('/')[0]
            if (_converse.chatboxviews) {
                const chatbox = _converse.chatboxviews.get(from_jid);
                if (chatbox) {

                    chatbox.ringingHandle(message)
                }
            }


        }
        function onRingingMessage(message) {
            /* Handler method for all incoming messages of type "headline". */
            if (utils.isHeadlineMessage(_converse, message)) {
                ringingHandle(message)
            }
        }
        function registerRingingHandler() {
            _converse.connection.addHandler(message => {
                onRingingMessage(message);
                return true
            }, null, 'message');
        }
        _converse.api.listen.on('connected', registerRingingHandler);
        _converse.api.listen.on('reconnected', registerRingingHandler);


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
