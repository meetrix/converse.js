// Converse.js (A browser based XMPP chat client)
// https://conversejs.org
//
// Copyright (c) 2013-2019, Jan-Carel Brand <jc@opkode.com>
// Licensed under the Mozilla Public License (MPLv2)

/* This is a non-core Converse.js plugin which shows a list of currently open
 * rooms in the "Rooms Panel" of the ControlBox.
 */

import converse from "@converse/headless/converse-core";
import muc from "@converse/headless/converse-muc";
import tpl_rooms_list from "templates/rooms_list.html";
import tpl_rooms_list_item from "templates/rooms_list_item.html"

const { Backbone, Promise, Strophe, sizzle, _ } = converse.env;
const u = converse.env.utils;


converse.plugins.add('converse-roomslist', {

    /* Optional dependencies are other plugins which might be
     * overridden or relied upon, and therefore need to be loaded before
     * this plugin. They are called "optional" because they might not be
     * available, in which case any overrides applicable to them will be
     * ignored.
     *
     * It's possible however to make optional dependencies non-optional.
     * If the setting "strict_plugin_dependencies" is set to true,
     * an error will be raised if the plugin is not found.
     *
     * NB: These plugins need to have already been loaded via require.js.
     */
    dependencies: ["converse-singleton", "converse-controlbox", "converse-muc", "converse-bookmarks"],

    initialize () {
        /* The initialize function gets called as soon as the plugin is
         * loaded by converse.js's plugin machinery.
         */
        const { _converse } = this,
              { __ } = _converse;

        // Promises exposed by this plugin
        _converse.api.promises.add('roomsListInitialized');


        _converse.OpenRooms = Backbone.Collection.extend({

            comparator (room) {
                if (room.get('bookmarked')) {
                    const bookmark = _.head(_converse.bookmarksview.model.where({'jid': room.get('jid')}));
                    return bookmark.get('name');
                } else {
                    return room.get('name');
                }
            },

            initialize () {
                _converse.chatboxes.on('add', this.onChatBoxAdded, this);
                _converse.chatboxes.on('change:hidden', this.onChatBoxChanged, this);
                _converse.chatboxes.on('change:bookmarked', this.onChatBoxChanged, this);
                _converse.chatboxes.on('change:name', this.onChatBoxChanged, this);
                _converse.chatboxes.on('change:num_unread', this.onChatBoxChanged, this);
                _converse.chatboxes.on('change:num_unread_general', this.onChatBoxChanged, this);
                _converse.chatboxes.on('remove', this.onChatBoxRemoved, this);
                this.reset(_.map(_converse.chatboxes.where({'type': 'chatroom'}), 'attributes'));
            },

            onChatBoxAdded (item) {
                if (item.get('type') === 'chatroom') {
                    this.create(item.attributes);
                }
            },

            onChatBoxChanged (item) {
                if (item.get('type') === 'chatroom') {
                    const room =  this.get(item.get('jid'));
                    if (!_.isNil(room)) {
                        room.set(item.attributes);
                    }
                }
            },

            onChatBoxRemoved (item) {
                if (item.get('type') === 'chatroom') {
                    const room = this.get(item.get('jid'))
                    this.remove(room);
                }
            }
        });


        _converse.RoomsList = Backbone.Model.extend({
            defaults: {
                "toggle-state":  _converse.OPENED
            }
        });

        _converse.RoomsListElementView = Backbone.VDOMView.extend({
            events: {
                'click .room-info': 'showRoomDetailsModal'
            },

            initialize () {
                this.model.on('destroy', this.remove, this);
                this.model.on('remove', this.remove, this);
                this.model.on('change:bookmarked', this.render, this);
                this.model.on('change:hidden', this.render, this);
                this.model.on('change:name', this.render, this);
                this.model.on('change:num_unread', this.render, this);
                this.model.on('change:num_unread_general', this.render, this);
            },

            toHTML () {
                return tpl_rooms_list_item(
                    _.extend(this.model.toJSON(), {
                        // XXX: By the time this renders, the _converse.bookmarks
                        // collection should already exist if bookmarks are
                        // supported by the XMPP server. So we can use it
                        // as a check for support (other ways of checking are async).
                        'allow_bookmarks': _converse.allow_bookmarks && _converse.bookmarks,
                        'currently_open': _converse.isUniView() && !this.model.get('hidden'),
                        'info_leave_room': __('Leave this groupchat'),
                        'info_remove_bookmark': __('Unbookmark this groupchat'),
                        'info_add_bookmark': __('Bookmark this groupchat'),
                        'info_title': __('Show more information on this groupchat'),
                        'name': this.getRoomsListElementName(),
                        'open_title': __('Click to open this groupchat')
                    }));
            },

            showRoomDetailsModal (ev) {
                const room = _converse.chatboxes.get(this.model.get('jid'));
                ev.preventDefault();
                if (_.isUndefined(room.room_details_modal)) {
                    room.room_details_modal = new _converse.RoomDetailsModal({'model': room});
                }
                room.room_details_modal.show(ev);
            },

            getRoomsListElementName () {
                if (this.model.get('bookmarked') && _converse.bookmarksview) {
                    const bookmark = _.head(_converse.bookmarksview.model.where({'jid': this.model.get('jid')}));
                    return bookmark.get('name');
                } else {
                    return this.model.get('name');
                }
            },
            createAvatar(nickname, width, height, font)
            {
                console.log('create canvas');
                if(!nickname){
                    nickname= 'no-name' 
                }
                nickname = nickname.toLowerCase();


                if (!width) width = 32;
                if (!height) height = 32;
                if (!font) font = "16px Arial";

                var canvas = document.createElement('canvas');
                canvas.style.display = 'none';
                canvas.width = width;
                canvas.height = height;
                document.body.appendChild(canvas);
                var context = canvas.getContext('2d');
                context.fillStyle = this.getRandomColor(nickname);
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
                    var initials
                    if (last) {
                         initials = first + last;
                        context.fillText(initials.toUpperCase(), 3, 23);
                    } else {
                         initials = first;
                        context.fillText(initials.toUpperCase(), 10, 23);
                    }
                    var data = canvas.toDataURL();
                    document.body.removeChild(canvas);
                }
                return canvas.toDataURL();
            },
            getRandomColor(nickname){
                    var letters = '0123456789ABCDEF';
                    var color = '#';

                    for (var i = 0; i < 6; i++) {
                        color += letters[Math.floor(Math.random() * 16)];
                    }
                    return color;
                }
        });


        _converse.RoomsListView = Backbone.OrderedListView.extend({
            tagName: 'div',
            className: 'open-rooms-list list-container rooms-list-container',
            events: {
                'click .add-bookmark': 'addBookmark',
                'click .close-room': 'closeRoom',
                'click .list-toggle': 'toggleRoomsList',
                'click .remove-bookmark': 'removeBookmark',
                'click .open-room': 'openRoom',
            },
            listSelector: '.rooms-list',
            ItemView: _converse.RoomsListElementView,
            subviewIndex: 'jid',

            initialize () {
                Backbone.OrderedListView.prototype.initialize.apply(this, arguments);

                this.model.on('add', this.showOrHide, this);
                this.model.on('remove', this.showOrHide, this);

                const storage = _converse.config.get('storage'),
                      id = `converse.roomslist${_converse.bare_jid}`;

                this.list_model = new _converse.RoomsList({'id': id});
                this.list_model.browserStorage = new Backbone.BrowserStorage[storage](id);
                this.list_model.fetch();
                this.render();
                this.sortAndPositionAllItems();
            },

            render () {
                this.el.innerHTML = tpl_rooms_list({
                    'toggle_state': this.list_model.get('toggle-state'),
                    'desc_rooms': __('Click to toggle the list of open groupchats'),
                    'label_rooms': __('Open Groupchats'),
                    '_converse': _converse
                });
                if (this.list_model.get('toggle-state') !== _converse.OPENED) {
                    this.el.querySelector('.open-rooms-list').classList.add('collapsed');
                }
                this.showOrHide();
                this.insertIntoControlBox();
                return this;
            },

            insertIntoControlBox () {
                const controlboxview = _converse.chatboxviews.get('controlbox');
                if (!_.isUndefined(controlboxview) && !u.rootContains(_converse.root, this.el)) {
                    const el = controlboxview.el.querySelector('.open-rooms-list');
                    if (!_.isNull(el)) {
                        el.parentNode.replaceChild(this.el, el);
                    }
                }
            },

            hide () {
                u.hideElement(this.el);
            },

            show () {
                u.showElement(this.el);
            },

            async openRoom (ev) {
                ev.preventDefault();
                const name = ev.target.textContent;
                const jid = ev.target.getAttribute('data-room-jid');
                const data = {
                    'name': name || Strophe.unescapeNode(Strophe.getNodeFromJid(jid)) || jid
                }
                await _converse.api.rooms.open(jid, data);
                _converse.api.chatviews.get(jid).focus();
            },

            closeRoom (ev) {
                ev.preventDefault();
                const name = ev.target.getAttribute('data-room-name');
                const jid = ev.target.getAttribute('data-room-jid');
                if (confirm(__("Are you sure you want to leave the groupchat %1$s?", name))) {
                    // TODO: replace with API call
                    _converse.chatboxviews.get(jid).close();
                }
            },

            showOrHide (item) {
                if (!this.model.models.length) {
                    u.hideElement(this.el);
                } else {
                    u.showElement(this.el);
                }
            },

            removeBookmark: _converse.removeBookmarkViaEvent,
            addBookmark: _converse.addBookmarkViaEvent,

            toggleRoomsList (ev) {
                if (ev && ev.preventDefault) { ev.preventDefault(); }
                const icon_el = ev.target.matches('.fa') ? ev.target : ev.target.querySelector('.fa');
                if (icon_el.classList.contains("fa-caret-down")) {
                    u.slideIn(this.el.querySelector('.open-rooms-list')).then(() => {
                        this.list_model.save({'toggle-state': _converse.CLOSED});
                        icon_el.classList.remove("fa-caret-down");
                        icon_el.classList.add("fa-caret-right");
                    });
                } else {
                    u.slideOut(this.el.querySelector('.open-rooms-list')).then(() => {
                        this.list_model.save({'toggle-state': _converse.OPENED});
                        icon_el.classList.remove("fa-caret-right");
                        icon_el.classList.add("fa-caret-down");
                    });
                }
            }
        });

        const initRoomsListView = function () {
            const storage = _converse.config.get('storage'),
                  id = `converse.open-rooms-{_converse.bare_jid}`,
                  model = new _converse.OpenRooms();

            model.browserStorage = new Backbone.BrowserStorage[storage](id);
            _converse.rooms_list_view = new _converse.RoomsListView({'model': model});
            /**
             * Triggered once the _converse.RoomsListView has been created and initialized.
             * @event _converse#roomsListInitialized
             * @example _converse.api.listen.on('roomsListInitialized', status => { ... });
             */
            _converse.api.trigger('roomsListInitialized');
        };

        _converse.api.listen.on('connected', async () =>  {
            if (_converse.allow_bookmarks) {
                await _converse.api.waitUntil('bookmarksInitialized');
            } else {
                await Promise.all([
                    _converse.api.waitUntil('chatBoxesFetched'),
                    _converse.api.waitUntil('roomsPanelRendered')
                ]);
            }
            initRoomsListView();
        });

        _converse.api.listen.on('reconnected', initRoomsListView);
    }
});

