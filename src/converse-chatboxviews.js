// Converse.js
// https://conversejs.org
//
// Copyright (c) 2012-2019, the Converse.js developers
// Licensed under the Mozilla Public License (MPLv2)

import "@converse/headless/converse-chatboxes";
import "backbone.nativeview";
import "backbone.overview";
import converse from "@converse/headless/converse-core";
import tpl_avatar from "templates/avatar.svg";
import tpl_background_logo from "templates/background_logo.html";
import tpl_chatboxes from "templates/chatboxes.html";

const { Backbone, _, utils } = converse.env;
const u = utils;

const AvatarMixin = {

    renderAvatar (el) {
        el = el || this.el;
        const canvas_el = el.querySelector('canvas');
        if (_.isNull(canvas_el)) {
            return;
        }
        const defaultAvatar = "PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiA8cmVjdCB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzU1NSIvPgogPGNpcmNsZSBjeD0iNjQiIGN5PSI0MSIgcj0iMjQiIGZpbGw9IiNmZmYiLz4KIDxwYXRoIGQ9Im0yOC41IDExMiB2LTEyIGMwLTEyIDEwLTI0IDI0LTI0IGgyMyBjMTQgMCAyNCAxMiAyNCAyNCB2MTIiIGZpbGw9IiNmZmYiLz4KPC9zdmc+Cg==";
        let image_type = "image/png";
        let image = defaultAvatar;
        let display_name = this.model.get('jid');
 
        if (this.model.vcard)
        {
            image_type = this.model.vcard.get('image_type');
            image = this.model.vcard.get('image');
            display_name = this.model.vcard.attributes.fullname || this.model.vcard.get('jid');
        }

        var dataUri = "data:" + image_type + ";base64," + image;

        if (!image || (display_name && defaultAvatar == image))
        {
            dataUri = createAvatar(display_name);
        }
  
        // else {
        //     setAvatar(display_name, dataUri);
        // }

        // const image_type = this.model.vcard.get('image_type'),
        //         image = this.model.vcard.get('image');         
        canvas_el.outerHTML = tpl_avatar({
            'classes': canvas_el.getAttribute('class'),
            'width': canvas_el.width,
            'height': canvas_el.height,
            //'image': "data:" + image_type + ";base64," + image,
            'image':dataUri
        });
    },
};


converse.plugins.add('converse-chatboxviews', {

    dependencies: ["converse-chatboxes"],

    overrides: {
        // Overrides mentioned here will be picked up by converse.js's
        // plugin architecture they will replace existing methods on the
        // relevant objects or classes.

        initStatus: function (reconnecting) {
            const { _converse } = this.__super__;
            if (!reconnecting) {
                _converse.chatboxviews.closeAllChatBoxes();
            }
            return this.__super__.initStatus.apply(this, arguments);
        }
    },

    initialize () {
        /* The initialize function gets called as soon as the plugin is
         * loaded by converse.js's plugin machinery.
         */
        const { _converse } = this,
              { __ } = _converse;

        _converse.api.promises.add([
            'chatBoxViewsInitialized'
        ]);

        // Configuration values for this plugin
        // ====================================
        // Refer to docs/source/configuration.rst for explanations of these
        // configuration settings.
        _converse.api.settings.update({
            'theme': 'default',
        });

        _converse.ViewWithAvatar = Backbone.NativeView.extend(AvatarMixin);
        _converse.VDOMViewWithAvatar = Backbone.VDOMView.extend(AvatarMixin);


        _converse.ChatBoxViews = Backbone.Overview.extend({

            _ensureElement () {
                /* Override method from backbone.js
                 * If the #conversejs element doesn't exist, create it.
                 */
                if (!this.el) {
                    let el = _converse.root.querySelector('#conversejs');
                    if (_.isNull(el)) {
                        el = document.createElement('div');
                        el.setAttribute('id', 'conversejs');
                        u.addClass(`theme-${_converse.theme}`, el);
                        const body = _converse.root.querySelector('body');
                        if (body) {
                            body.appendChild(el);
                        } else {
                            // Perhaps inside a web component?
                            _converse.root.appendChild(el);
                        }
                    }
                    el.innerHTML = '';
                    this.setElement(el, false);
                } else {
                    this.setElement(_.result(this, 'el'), false);
                }
            },

            initialize () {
                this.model.on("destroy", this.removeChat, this);
                //const bg = document.getElementById('conversejs-bg');
                // if (bg && !bg.innerHTML.trim()) {
                //     bg.innerHTML = tpl_background_logo();
                // }
                const body = document.querySelector('body');
                body.classList.add(`converse-${_converse.view_mode}`);
                this.el.classList.add(`converse-${_converse.view_mode}`);
                this.render();
            },

            render () {
                try {
                    this.el.innerHTML = tpl_chatboxes();
                } catch (e) {
                    this._ensureElement();
                    this.el.innerHTML = tpl_chatboxes();
                }
                this.row_el = this.el.querySelector('.row');
            },

            insertRowColumn (el) {
                /* Add a new DOM element (likely a chat box) into the
                 * the row managed by this overview.
                 */
                this.row_el.insertAdjacentElement('afterBegin', el);
            },

            removeChat (item) {
                this.remove(item.get('id'));
            },

            closeAllChatBoxes () {
                /* This method gets overridden in src/converse-controlbox.js if
                 * the controlbox plugin is active.
                 */
                this.each(function (view) { view.close(); });
                return this;
            },

            chatBoxMayBeShown (chatbox) {
                return this.model.chatBoxMayBeShown(chatbox);
            }
        });


        /************************ BEGIN Event Handlers ************************/
        _converse.api.waitUntil('rosterContactsFetched').then(() => {
            _converse.roster.on('add', (contact) => {
                /* When a new contact is added, check if we already have a
                 * chatbox open for it, and if so attach it to the chatbox.
                 */
                const chatbox = _converse.chatboxes.findWhere({'jid': contact.get('jid')});
                if (chatbox) {
                    chatbox.addRelatedContact(contact);
                }
            });
        });

        _converse.api.listen.on('chatBoxesInitialized', () => {
            _converse.chatboxviews = new _converse.ChatBoxViews({
                'model': _converse.chatboxes
            });
            /**
             * Triggered once the _converse.ChatBoxViews view-colleciton has been initialized
             * @event _converse#chatBoxViewsInitialized
             * @example _converse.api.listen.on('chatBoxViewsInitialized', () => { ... });
             */
            _converse.api.trigger('chatBoxViewPortCalculate');
            _converse.api.trigger('chatBoxViewPortCaclulateWhenResize');
            _converse.api.trigger('chatBoxViewsInitialized');
        });

        _converse.api.listen.on('clearSession', () => _converse.chatboxviews.closeAllChatBoxes());
        /************************ END Event Handlers ************************/
    }
});
