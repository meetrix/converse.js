import converse from "@converse/headless/converse-core";

const { Strophe, _, u, sizzle, Backbone } = converse.env;
let MessageView = null;
let messageView = null;
let _converse = null;

converse.plugins.add("meetrix-message-filter", {
    'dependencies': ['converse-chatview'],

    'initialize': function () {
        _converse = this._converse;


        MessageView = Backbone.NativeView.extend({
            tagName: 'div',
            className: 'searched-message col-auto',
            events: {
                'click .hide-show-messages': 'hideContentSearch',
            },
            initialize() {
                this.render();
            },
            render() {
                this.el.innerHTML =
                    '<div class="search-bar-title add-this-up-for-search"><div class="left"><i class="fas fa-search"></i><span>Search Messages</span></div><div class="right"><i class="hide-show-messages fa fa-times"></i></div></div>' +
                    '<div class="show-messages search-results-list"></div>'
                return this;
            },
            hideContentSearch() {
                var view = this.model.get("view");
                hideMessageContentView(view, view.model)
                view.el.querySelector('.chatapp-filter-all').value = ''
            }
        })

        console.log("search plugin is ready");
    },

    'overrides': {
        ChatRoomView: {
            events: {
                'keyup .chatapp-filter-all': 'channelContentSearch',
            },
            channelContentSearch(e) {
                e.stopPropagation();
                if (e.keyCode == 13) {

                    const keyword = e.target.value;
                    contentSearch(this, keyword, 'chatroom-body')

                }
            },

        },
        ChatBoxView: {
            events: {
                'keyup .chatapp-filter-all': 'channelContentSearch',
            },
            channelContentSearch(e) {
                e.stopPropagation();
                // Do something
                if (e.keyCode == 13) {

                    const keyword = e.target.value;
                    var type = this.model.get("type");
                    if (type === "chatroom") {
                        contentSearch(this, keyword, 'chatroom-body')
                    } else {
                        contentSearch(this, keyword, 'chat-body')
                    }


                }

            }

        }
    }
});
function contentSearch(view, keyword, mountClass) {
    var jid = view.model.get("jid");
    var type = view.model.get("type");

    // var searchRegExp = new RegExp( keyword , 'i');
    var tagRegExp = new RegExp("(\\b" + keyword + "\\b)", "im");
    view.model.set({ 'hidden_contentmsg': true });
    toggleMessageContentView(view, view.model)
    hideOtherAllFeature(view)
    if (!messageView) {
        messageView = new MessageView({ 'model': new converse.env.Backbone.Model({ view: view }) })
    }

    view.el.querySelector("." + mountClass).insertAdjacentElement('beforeend', messageView.el);
    scrollsearch()

    if (keyword != "") {
        messageFilter({ before: '', max: 9999999, 'groupchat': type === "chatroom", 'with': jid }, view, keyword, type, tagRegExp)

    }
}
function regexEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}
function messageFilter(options, view, keyword, type, tagRegExp) {
    console.log(options);
    view.el.querySelector('.show-messages').innerHTML = '';
    let html = '';
    try {
        const xhr = new window.XMLHttpRequest();
        if (type === "chatroom") {
            xhr.open("GET", `${_converse.xhr_restapi}messages/filter/${options.with.split("@")[0]}/${keyword}`, true);
        } else {
            xhr.open("GET", `${_converse.xhr_restapi}messages/filter/single/user/${_converse.connection.jid.split('/')[0]}/${options.with}/${keyword}`, true);
        }
        xhr.setRequestHeader('Authorization', "Basic " + btoa(_converse.connection.jid.split('/')[0] + ":" + _converse.connection.pass));
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
        xhr.onload = function () {
            if (xhr.status != 200) { // analyze HTTP status of the response
            } else { // show the result
                var previousTime = ''
                JSON.parse(xhr.response).forEach(message => {
                    if ('body' in message) {
                        console.log(message);
                        var body = message.body;
                        // var delay = message.querySelector('forwarded').querySelector('delay');
                        var from = type === "chatroom" ? message.sender : message.fromJID;
                        // var time = delay ? delay.getAttribute('stamp') : moment().format();
                        var pretty_time = new Date(type === "chatroom" ? parseFloat(message.logTime) : parseFloat(message.sentDate));
                        var pretty_from = type === "chatroom" ? from.split("/")[1] : from.split("@")[0];
                        var messageDate = type === "chatroom" ? parseFloat(message.logTime) : parseFloat(message.sentDate);
                        // if (searchRegExp.test(body))
                        // {
                        if (timeFormatMM_DD_YYYY(pretty_time) !== previousTime) {
                            previousTime = timeFormatMM_DD_YYYY(pretty_time);
                            html += '<div class="message date-separator" data-isodate="' + new Date(messageDate).toLocaleDateString() + '">' +
                                '<hr class="separator">' +
                                '<time class="separator-text" datetime="' + new Date(messageDate).toLocaleDateString() + '"><span>' + previousTime + '</span></time>' +
                                '</div>'
                        }
                        var tagged = body.replace(tagRegExp, "<span style=background-color:#FF9;color:#555;>$1</span>");
                        html += '<div class="message chat-msg groupchat" data-isodate="' + pretty_time + '">' +
                            // eslint-disable-next-line no-undef
                            '<img class="avatar" src=' + createAvatar(pretty_from) + ' style="width: 36px; height: 36px; margin-right: 10px;" /> ' +
                            '<div class="chat-msg-content"> ' +
                            '<span class="chat-msg-heading">' +
                            '<span class="chat-msg-author">' + `${type === "chatroom" ? message.nickName : message.fromJID.split("@")[0]}` + '</span> ' +
                            '<span class="chat-msg-time">' + new Date(messageDate).toLocaleTimeString() + '</span>' +
                            '</span> ' +
                            '<div class="chat-msg-text">' +
                            `${tagged}` +
                            '</div>' +
                            '<div class="chat-msg-media">' +
                            '</div>' +
                            '</div>' +
                            '</div>'

                        // }

                    }
                });
                console.log(html)
                view.el.querySelector('.show-messages').insertAdjacentHTML('beforeend', html)
            }
        };
        // result = await  _converse.api.archive.query(options);
        // var html = ''
        // var dataseparator = ''
    // eslint-disable-next-line no-empty
    } catch (error) {
        
    }
}
var timeFormat = function (date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateConvert = new Date(date)
    const dateDay = dateConvert.getDay()
    const dateMonth = months[dateConvert.getMonth()]
    const dateHourse = dateConvert.getHours()
    const dateMinite = dateConvert.getMinutes()
    const dateSecond = dateConvert.getSeconds()
    return `${dateMonth} ${dateDay} <br/> ${dateHourse}:${dateMinite}:${dateSecond}`

}
var timeAMPM = function (date) {
    const dateConvert = new Date(date)
    const dateHourse = dateConvert.getHours()
    const dateMinite = dateConvert.getMinutes()
    var isPM = dateHourse >= 12;
    var isMidday = dateHourse == 12;
    return `${dateHourse - (isPM && !isMidday ? 12 : 0)}:${dateMinite}  ${isPM ? ' pm' : 'am'}`

}
var timeFormatMM_DD_YYYY = function (date) {
    const months = ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"];
    const dateConvert = new Date(date)
    const dateYear = dateConvert.getFullYear()
    const dateDay = dateConvert.getDay()
    const dateMonth = months[dateConvert.getMonth()]
    const dateHourse = dateConvert.getHours()
    const dateMinite = dateConvert.getMinutes()
    const dateSecond = dateConvert.getSeconds()
    return `${dateMonth} ${dateDay}${nth(dateDay)}, ${dateYear}`
}
var timeFormatMMDo = function (date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateConvert = new Date(date)
    const dateDay = dateConvert.getDay()
    const dateMonth = months[dateConvert.getMonth()]
    return `${dateMonth} ${dateDay}${nth(dateDay)}`

}
var timeFormatTime = function (date) {
    const dateConvert = new Date(date)
    const dateHourse = dateConvert.getHours()
    const dateMinite = dateConvert.getMinutes()
    const dateSecond = dateConvert.getSeconds()
    return `${dateHourse}:${dateMinite}:${dateSecond}`


}
var nth = function (d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}
function toggleMessageContentView(view, model) {
    if (model.get('hidden_contentmsg')) {
        showMessageContentView(view, model)
    } else {
        hideMessageContentView(view, model)
    }
}
function hideMessageContentView(view, model) {
    model.set({ 'hidden_contentmsg': true });
    const chat_area = view.el.querySelector('.chat-area');
    // u.removeClass('col-md-9', chat_area);
    // u.removeClass('col-8', chat_area);
    // u.addClass('full', chat_area);
    // u.addClass('col-12', chat_area);
    u.hideElement(view.el.querySelector('.searched-message'));
}
function showMessageContentView(view, model) {
    model.set({ 'hidden_contentmsg': false });
    const chat_area = view.el.querySelector('.chat-area');
    u.removeClass('hidden', view.el.querySelector('.searched-message'));
    // u.removeClass('full', chat_area);
    // u.removeClass('col-12', chat_area);
    // u.addClass('col-md-9', chat_area);
    // u.addClass('col-8', chat_area);
}
var hideElement = function (el) {
    return addClass("hidden", el);
}
var addClass = function (className, el) {
    if (el instanceof Element) {
        el.classList.add(className);
    }
    return el;
}
function hideOtherAllFeature(view) {
    if (view.el.querySelector('.occupants')) {
        hideElement(view.el.querySelector('.occupants'));
        view.model.set({ 'hidden_occupants': true })
    }
    if (view.el.querySelector('.plugin-contentbox')) {
        hideElement(view.el.querySelector('.plugin-contentbox'));
    }
    if (view.el.querySelector('.conference')) {
        hideElement(view.el.querySelector('.conference'));
    }

}
function scrollsearch() {
    var SearchbarGreyTop = document.getElementsByClassName('add-this-up-for-search')[0].offsetHeight + 80 + 20;
    document.getElementsByClassName('search-results-list')[0].style.height = window.innerHeight - SearchbarGreyTop
}

