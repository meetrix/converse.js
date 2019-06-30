// version 0.4.11.1
import converse from "@converse/headless/converse-core";

const { Strophe, _, u, $iq, Backbone, sizzle } = converse.env;

// Commonly used utilities and variables can be found under the "env"
// namespace of the "converse" global.

let _converse = null;
// The following line registers your plugin.
converse.plugins.add("meetrix-user-own-room-list", {

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
        console.log("list room is ready");

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
        //   function onRoomsFound (rooms) {
        //     /* Handle the IQ stanza returned from the server, containing
        //      * all its public groupchats.
        //      */
        //     // const available_chatrooms = this.el.querySelector('.available-chatrooms');
        //     if (rooms.length) {

        //       _.map(rooms, function(room){
        //       //   console.log('jid',room.getAttribute('jid'))
        //       //   const iq2 = $iq({
        //       //     'to': room.getAttribute('jid'),
        //       //     'type': "get"
        //       // }).c("query", {xmlns: Strophe.NS.MUC_ADMIN})
        //       // .c("item", {'affiliation': 'member'});
        //       // _converse.api.sendIQ(iq2)
        //       //       .then(iq => {
        //       //         console.log('memeber',iq)
        //       //         let occupants = iq.querySelectorAll('query item');
        //       //         console.log('occupants.length',occupants.length)
        //       //         if(occupants.length){
        //       //           console.log( occupants)
        //       //         occupants.filter((occupant)=>{
        //       //           occupant.getAttribute('jid')
        //       //           console.log( occupant.getAttribute('jid'))
        //       //         })
        //       //         }


        //       //       }

        //       //     )
        //       //     .catch(iq => console.log(iq))
        //         // const name = Strophe.unescapeNode(room.getAttribute('name') || room.getAttribute('jid'));
        //         // if(name && !_.includes(room.getAttribute('jid').split('@')[0],'-')){

        //         //   _converse.api.rooms.open(room.getAttribute('jid'), {'name': Strophe.xmlunescape(name)});
        //         // }
        //         _converse.api.rooms.open(room.room);

        //       })
        //     } else {
        //         // this.informNoRoomsFound();
        //     }
        //     return true;
        // }
        function onRoomsFound(iq) {
            /* Handle the IQ stanza returned from the server, containing
             * all its public groupchats.
             */
            const rooms = sizzle('query item', iq);
            if (rooms.length) {

                rooms.map(room => {
                    const name = Strophe.unescapeNode(room.getAttribute('name') || room.getAttribute('jid'));
                    if (name && !_.includes(room.getAttribute('jid').split('@')[0], '-')) {

                        _converse.api.rooms.open(room.getAttribute('jid'), { 'name': Strophe.xmlunescape(name) });
                    }
                    return true;
                })
              }
            return true;
          }
        _converse.api.listen.on('roomsPanelRendered', () => {
            const iq = $iq({
                'to': _converse.api.settings.get("muc_domain"),
                'from': _converse.connection.jid,
                'type': "get"
            }).c("query", { xmlns: Strophe.NS.DISCO_ITEMS });
            _converse.api.sendIQ(iq)
                .then(iq =>
                    onRoomsFound(iq)
                )
                .catch(iq => console.log(iq))
            //   const xhr = new window.XMLHttpRequest();
            //   xhr.open("GET", `${_converse.xhr_restapi}chatrooms/occupants/${_converse.connection.jid.split('/')[0]}`, true);
            //   xhr.setRequestHeader('Authorization',"Basic " + btoa(_converse.connection.jid.split('/')[0] + ":" + _converse.connection.pass));
            //   xhr.setRequestHeader( 'Content-Type',   'application/json' );
            //   xhr.send()
            //   xhr.onload = function() {
            //     if (xhr.status != 200) { // analyze HTTP status of the response

            //     } else { // show the result

            //       onRoomsFound(JSON.parse(xhr.response).occupants)
            //     }
            //   };

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
})
