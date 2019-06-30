// version 0.4.11.1
import converse from "@converse/headless/converse-core";

const { Strophe, _, u, sizzle, Backbone } = converse.env;

// Commonly used utilities and variables can be found under the "env"
// namespace of the "converse" global.

let _converse = null;

// The following line registers your plugin.
converse.plugins.add("meetrix-drag-file-handler", {

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
    'dependencies': [],

    /* Converse.js's plugin mechanism will call the initialize
     * method on any plugin (if it exists) as soon as the plugin has
     * been loaded.
     */
    'initialize': function () {
        /* Inside this method, you have access to the private
         * `_converse` object.
         */
        _converse = this._converse;

        console.log("drag file plugin is ready");

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
        _converse.api.listen.on('renderToolbar', function (view) {
            var id = view.model.get("box_id");
            var jid = view.model.get("jid");
            var type = view.model.get("type");
            testFileUploadAvailable(view, function (isFileUploadAvailable) {

                var dropZone = view.el.querySelector('.chat-body');

                dropZone.removeEventListener('dragover', handleDragOver);
                dropZone.removeEventListener('drop', handleDropFileSelect);
                dropZone.addEventListener('dragover', handleDragOver, false);
                dropZone.addEventListener('drop', handleDropFileSelect, false);

            });

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
            }
        }
    }
});
var handleDragOver = function handleDragOver(evt) {
    //console.debug("handleDragOver");

    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
};
var handleDropFileSelect = function handleDropFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    _converse.chatboxviews.each(function (view) {
        //console.debug("handleDropFileSelect", view.model.get('type'));

        if ((view.model.get('type') === "chatroom" || view.model.get('type') === "chatbox") && !view.model.get('hidden')) {
            var files = evt.dataTransfer.files;
            view.model.sendFiles(files);
        }
    });
};
var addToolbarItem = function (view, id, label, html) {
    var placeHolder = view.el.querySelector('#place-holder');

    if (!placeHolder) {
        var smiley = view.el.querySelector('.toggle-smiley.dropup');
        smiley.insertAdjacentElement('afterEnd', newElement('li', 'place-holder'))
        view.el.querySelector('#place-holder').style.cssText = "display:none";
        placeHolder = view.el.querySelector('#place-holder');
    }
    placeHolder.insertAdjacentElement('afterEnd', newElement('li', label, html));
}
var newElement = function (el, id, html, className) {
    var ele = document.createElement(el);
    if (id) ele.id = id;
    if (html) ele.innerHTML = html;
    if (className) ele.classList.add(className);
    document.body.appendChild(ele);
    return ele;
}

var testFileUploadAvailable = async function (view, callback) {
    const result = await _converse.api.disco.supports('urn:xmpp:http:upload:0', _converse.domain);
    if (!view.el.querySelector(".fa-angle-double-down")) callback(result.length > 0);
}

