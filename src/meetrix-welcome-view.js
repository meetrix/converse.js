import converse from "@converse/headless/converse-core";

const { Strophe, _, u, sizzle, Backbone, $iq, $msg, $pres, $build, b64_sha1, utils } = converse.env;


// Commonly used utilities and variables can be found under the "env"
// namespace of the "converse" global.

let  _converse;
// The following line registers your plugin.
converse.plugins.add("meetrix-welcome-view", {

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
    'dependencies': ["converse-profile"],

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
        ControlBoxView: {
            createBrandHeadingHTML() {

            },

            insertBrandHeading() {

            },

        },
        ChatBoxViews: {
            render() {
                var el = this.__super__.render.apply(this, arguments);
                document.getElementById('conversejs-bg').innerHTML = ''
                return this;
            }
        },
        XMPPStatusView:{
            events:{
              "click a.profile-menu": "toggleDropDown",
            },
  
            toggleDropDown:function(ev){
              
              if(this.el.querySelector('.media-body').children[0].getAttribute("aria-expanded")==="true"){
                this.el.querySelector('.media-body').children[0].setAttribute("aria-expanded", "false");
                this.el.querySelector('.dropdown-menu').classList.remove('show');
              }else{
                this.el.querySelector('.media-body').children[0].setAttribute("aria-expanded", "true");
                this.el.querySelector('.dropdown-menu').classList.add('show');
              }
              
            }
          },
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


