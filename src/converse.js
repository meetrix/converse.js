/* START: Removable components
 * --------------------
 * Any of the following components may be removed if they're not needed.
 */

import "@converse/headless/headless";
import "converse-autocomplete";
import "converse-bookmark-views";  // Views for XEP-0048 Bookmarks
import "converse-chatview";        // Renders standalone chat boxes for single user chat
import "converse-controlbox";      // The control box
import "converse-dragresize";      // Allows chat boxes to be resized by dragging them
import "converse-fullscreen";
import "converse-headline";        // Support for headline messages
import "converse-mam-views";
import "converse-minimize";        // Allows chat boxes to be minimized
import "converse-muc-views";       // Views related to MUC
import "converse-notification";    // HTML5 Notifications
import "converse-omemo";
import "converse-push";            // XEP-0357 Push Notifications
import "converse-register";        // XEP-0077 In-band registration
import "converse-roomslist";       // Show currently open chat rooms
import "converse-rosterview";
import "converse-singleton";
import "converse-uniview";
import "meetrix-search-box-view";
import "meetrix-avatar-generate";
import "meetrix-chat-tool";
import "meetrix-attachment-filter";
import "meetrix-message-filter";
import "meetrix-drag-file-handler";
import "meetrix-fileupload-handler";
import "meetrix-user-own-room-list";
import  "meetrix-file-previewer";
import "meetrix-ringing-handler";
import "meetrix-welcome-view";
/* END: Removable components */

import converse from "@converse/headless/converse-core";

const WHITELISTED_PLUGINS = [
    'converse-autocomplete',
    'converse-bookmark-views',
    'converse-chatboxviews',
    'converse-chatview',
    'converse-controlbox',
    'converse-dragresize',
    'converse-fullscreen',
    'converse-headline',
    'converse-mam-views',
    'converse-message-view',
    'converse-minimize',
    'converse-modal',
    'converse-muc-views',
    'converse-notification',
    'converse-omemo',
    'converse-profile',
    'converse-push',
    'converse-register',
    'converse-roomslist',
    'converse-rosterview',
    'converse-singleton',
    'converse-uniview',
    'meetrix-search-box-view',
    "meetrix-avatar-generate",
    "meetrix-chat-tool",
    "meetrix-attachment-filter",
    "meetrix-message-filter",
    "meetrix-drag-file-handler",
    "meetrix-fileupload-handler",
    "meetrix-user-own-room-list",
    "meetrix-file-previewer",
    "meetrix-ringing-handler",
    "meetrix-welcome-view"
];

const initialize = converse.initialize;

converse.initialize = function (settings, callback) {
    if (Array.isArray(settings.whitelisted_plugins)) {
        settings.whitelisted_plugins = settings.whitelisted_plugins.concat(WHITELISTED_PLUGINS);
    } else {
        settings.whitelisted_plugins = WHITELISTED_PLUGINS;
    }
    return initialize(settings, callback);
}

export default converse;
