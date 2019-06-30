import converse from "@converse/headless/converse-core";

const { Backbone, u, _, moment } = converse.env;
var _converse = null;
var media = null;
var fromUserInContent = [];

converse.plugins.add("meetrix-attachment-filter", {
    'dependencies': [],

    'initialize': function () {
        _converse = this._converse;

        _converse.PreviewDialog = _converse.BootstrapModal.extend({
            initialize() {
                _converse.BootstrapModal.prototype.initialize.apply(this, arguments);
                this.model.on('change', this.render, this);
            },
            toHTML() {
                return '<div class="modal" id="myModal"> <div class="modal-dialog modal-lg"> <div class="modal-content">' +
                    '<div class="modal-header"><h1 class="modal-title">Media Content Preview</h1><button type="button" class="close" data-dismiss="modal">&times;</button></div>' +
                    '<div class="modal-body"></div>' +
                    '<div class="modal-footer"><button type="button" class="btn btn-danger" data-dismiss="modal">Close</button></div>' +
                    '</div> </div> </div>';
            },
            afterRender() {

                if (this.model.get("type") == "image") {
                    this.el.querySelector('.modal-body').innerHTML = '<img id="pade-preview-image" src="' + this.model.get("url") + '"/>';
                }
                else

                    if (this.model.get("type") == "video") {
                        this.el.querySelector('.modal-body').innerHTML = '<video controls id="pade-preview-image" src="' + this.model.get("url") + '"/>';
                    }
                    else

                        if (this.model.get("type") == "audio") {
                            this.el.querySelector('.modal-body').innerHTML = '<audio controls id="pade-preview-image" src="' + this.model.get("url") + '"/>';
                        }

                this.el.querySelector('.modal-title').innerHTML = "Media Content Preview<br/>" + this.model.get("url");
            }
        });

        console.log("content plugin is ready");
    },

    'overrides': {
        ChatRoomView: {
            events: {
                'click .top-toolbar-file-attach': 'listContent',
                'click .hide-show-messages': 'hideContentInfo'
            },
            listContent(ev) {
                var occupants = this.el.querySelector('.occupants');
                var contentElement = this.el.querySelector('.plugin-contentbox');
                if (!contentElement) {
                    contentElement = occupants.insertAdjacentElement('afterEnd', newElement('div', null, null, 'plugin-contentbox'));
                    hideElement(contentElement)
                    // contentElement.style.display = "none";
                }
                toggleContentInfo(this, contentElement)
            },
            hideContentInfo(ev) {
                var contentElement = this.el.querySelector('.plugin-contentbox');
                hideElement(contentElement)
            }

        },
        ChatBoxView: {
            events: {
                'click .top-toolbar-file-attach': 'listContent',
                'click .hide-show-messages': 'hideContentInfo'
            },
            listContent(ev) {
                var contentElement = this.el.querySelector('.plugin-contentbox');
                if (!contentElement) {
                    contentElement = this.el.querySelector('.chat-area').insertAdjacentElement('afterEnd', newElement('div', null, null, 'plugin-contentbox'));
                    hideElement(contentElement)
                }
                toggleContentInfo(this, contentElement);
            },
            hideContentInfo(ev) {
                var contentElement = this.el.querySelector('.plugin-contentbox');
                hideElement(contentElement)
            }

        }
    }
});
var toggleContentInfo = function (view, contentElement) {
    var id = view.model.get("box_id");
    var jid = view.model.get("jid");
    var type = view.model.get("type");
    var chat_area = view.el.querySelector('.chat-area');
    if (_.includes(contentElement.classList, "hidden")) {
        // contentElement.style.display = "";
        // removeClass('full', chat_area);
        // removeClass('col-md-12', chat_area);
        // removeClass('col-12', chat_area);
        // addClass('col-md-9', chat_area);
        // addClass('col-8', chat_area);
        hideOtherAllFeature(view)
        addClass('col-auto', view.el.querySelector('.plugin-contentbox'))
        // addClass('col-4', view.el.querySelector('.plugin-contentbox'))
        // addClass('hidden', view.el.querySelector('.occupants'));
        removeClass('hidden', contentElement)
        contentElement.innerHTML = getHTML(id);
        scrollContentInfo();
        createInfoContent(contentElement, jid, id, type);
        addListnersToFilter(contentElement, id);
    } else {
        // contentElement.style.display = "none"
        // removeClass('col-md-9', chat_area);
        // removeClass('col-8', chat_area);
        // addClass('full', chat_area);
        // addClass('col-12', chat_area);
        hideElement(contentElement)
        hideOtherAllFeature(view)
        // hideElement(view.el.querySelector('.occupants'));
    }
}
var addUserOptions = function (contentElement) {

    const selectUserOption = contentElement.querySelector('#fromuser')
    _.each(fromUserInContent, user => {
        const option = document.createElement('option')
        option.setAttribute('value', user);
        option.innerHTML = user
        selectUserOption.insertAdjacentElement('beforeend', option)
    })

}
var user;
var type
var addListnersToFilter = function (contentElement, id) {
    contentElement.querySelector('#fromuser').addEventListener('change', function (ev) {
        user = ev.target.value
        renderFilerMedia(user, type, id)
    })
    contentElement.querySelector('#filetype').addEventListener('change', function (ev) {
        type = ev.target.value
        renderFilerMedia(user, type, id)
    })
}
var createInfoContent = function (contentElement, jid, id, type) {
    console.log('-----');
    media = { photo: { urls: [] }, video: { urls: [] }, link: { urls: [] }, vmsg: { urls: [] }, ppt: { urls: [] }, txt: { urls: [] }, pdf: { urls: [] }, doc: { urls: [] }, other: { urls: [] } };
    try {
        const xhr = new window.XMLHttpRequest();
        if (type === "chatroom") {
            xhr.open("GET", `${_converse.xhr_restapi}messages/attachment/${jid.split("@")[0]}`, true);
        } else {
            console.log(_converse.connection.jid.split('/')[0]);
            console.log(jid);
            xhr.open("GET", `${_converse.xhr_restapi}messages/attachment/single/user/${_converse.connection.jid.split('/')[0]}/${jid}`, true);
        }
        xhr.setRequestHeader('Authorization', "Basic " + btoa(_converse.connection.jid.split('/')[0] + ":" + _converse.connection.pass));
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send();
        xhr.onload = function () {
            if (xhr.status != 200) { // analyze HTTP status of the response
            } else {
                console.log(xhr.response);
                JSON.parse(xhr.response).forEach(message => {
                    var body = message.body;
                    // var delay = message.querySelector('forwarded').querySelector('delay');
                    var from = type === "chatroom" ? message.sender : message.fromJID;
                    // var time = delay ? delay.getAttribute('stamp') : moment().format();
                    var pretty_time = new Date(type === "chatroom" ? parseFloat(message.logTime) : parseFloat(message.sentDate));
                    var pretty_from = type === "chatroom" ? from.split("/")[1] : from.split("@")[0];
                    var messageDate = type === "chatroom" ? parseFloat(message.logTime) : parseFloat(message.sentDate);


                    // var body = message.querySelector('body');
                    // var delay = message.querySelector('forwarded').querySelector('delay');
                    // var from = message.querySelector('forwarded').querySelector('message').getAttribute('from');
                    // var time = delay ? delay.getAttribute('stamp') : moment().format();
                    // var pretty_time = timeFormat(time);
                    // var pretty_from = type === "chatroom" ? from.split("/")[1] : from.split("@")[0];
                    if (!_.includes(fromUserInContent, pretty_from)) {
                        fromUserInContent.push(pretty_from)
                    }
                    if (body) {
                        var urls = body.match(/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/g);
                        if (urls && urls.length > 0) {
                            for (var j = 0; j < urls.length; j++) {
                                var pos = urls[j].lastIndexOf("/");
                                var file = urls[j].substring(pos + 1);
                                console.log(' **** File', urls[j]);
                                if (isAudioURL(urls[j])) {
                                    media.vmsg.urls.push({ url: urls[j], file: file, from: from, type: "audio", pretty_from: pretty_from, pretty_time: pretty_time, time: messageDate });
                                }
                                else if (isImageURL(urls[j])) {
                                    media.photo.urls.push({ url: urls[j], file: file, from: from, type: "image", pretty_from: pretty_from, pretty_time: pretty_time, time: messageDate });
                                }
                                else if (isVideoURL(urls[j])) {
                                    media.video.urls.push({ url: urls[j], file: file, from: from, type: "video", pretty_from: pretty_from, pretty_time: pretty_time, time: messageDate });
                                }
                                else if (isPDFURL(urls[j])) {
                                    media.pdf.urls.push({ url: urls[j], file: file, from: from, type: "pdf", pretty_from: pretty_from, pretty_time: pretty_time, time: messageDate });
                                }
                                else if (isPowerPointURL(urls[j])) {
                                    media.ppt.urls.push({ url: urls[j], file: file, from: from, type: "ppt", pretty_from: pretty_from, pretty_time: pretty_time, time: messageDate });
                                }
                                else if (isTextURL(urls[j])) {
                                    media.txt.urls.push({ url: urls[j], file: file, from: from, type: "txt", pretty_from: pretty_from, pretty_time: pretty_time, time: messageDate });
                                }
                                else if (isDocURL(urls[j])) {
                                    media.doc.urls.push({ url: urls[j], file: file, from: from, type: "doc", pretty_from: pretty_from, pretty_time: pretty_time, time: messageDate });
                                }
                                else if (isLink(urls[j])) {
                                    media.link.urls.push({ url: urls[j], file: urls[j], from: from, type: "link", pretty_from: pretty_from, pretty_time: pretty_time, time: messageDate });
                                }
                                else {
                                    media.other.urls.push({ url: urls[j], file: urls[j], from: from, type: "other", pretty_from: pretty_from, pretty_time: pretty_time, time: messageDate });
                                }
                            }
                        }
                    }
                });
                console.log('*** Attachments: ', media);
                renderMedia(id, "content", media.vmsg.urls);
                renderMedia(id, "content", media.photo.urls);
                renderMedia(id, "content", media.video.urls);
                renderMedia(id, "content", media.ppt.urls);
                renderMedia(id, "content", media.txt.urls);
                renderMedia(id, "content", media.pdf.urls);
                renderMedia(id, "content", media.link.urls);
                renderMedia(id, "content", media.doc.urls);
                renderMedia(id, "content", media.other.urls);

                // filterMedia(null,'txt',  media.txt.urls,id) 
                addUserOptions(contentElement);
            }
        }
    } catch (e) {
        // The query was not successful
    }
}
/*
var timeFormat =function(date){
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateConvert = new Date(date)
    const dateDay = dateConvert.getDay()
    const dateMonth = months[dateConvert.getMonth()]
    const dateHourse = dateConvert.getHours()
    const dateMinite = dateConvert.getMinutes()
    const dateSecond = dateConvert.getSeconds()
    return `${dateMonth} ${dateDay} <br/> ${dateHourse}:${dateMinite}:${dateSecond}`

}
 
var timeFormatMMDo =function(date){
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateConvert = new Date(date)
    const dateDate = dateConvert.getDate()
    const dateMonth = months[dateConvert.getMonth()]
    return `${dateMonth} ${dateDate}${nth(dateDate)}`
}
var timeFormatTime =function(date){
    const dateConvert = new Date(date)
    const dateHourse = dateConvert.getHours()
    const dateMinite = dateConvert.getMinutes()
    const dateSecond = dateConvert.getSeconds()
    return `${dateHourse}:${dateMinite}:${dateSecond}`
}
*/
var nth = function (d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}
var renderFilerMedia = function (user, type, id) {
    var detail = document.getElementById(id + "-" + "content" + "-details");
    detail.innerHTML = '';
    if (type === 'audio') filterMedia(user, type, media.vmsg.urls, id);
    else if (type === 'video') filterMedia(user, type, media.video.urls, id);
    else if (type === 'image') filterMedia(user, type, media.photo.urls, id);
    else if (type === 'ppt') filterMedia(user, type, media.ppt.urls, id);
    else if (type === 'pdf') filterMedia(user, type, media.pdf.urls, id);
    else if (type === 'txt') filterMedia(user, type, media.txt.urls, id);
    else if (type === 'link') filterMedia(user, type, media.link.urls, id);
    else if (type === 'doc') filterMedia(user, type, media.doc.urls, id);
    else if (type === 'other') filterMedia(user, type, media.other.urls, id);
    else {
        filterMedia(user, type, media.video.urls, id);
        filterMedia(user, type, media.vmsg.urls, id);
        filterMedia(user, type, media.photo.urls, id);
        filterMedia(user, type, media.ppt.urls, id);
        filterMedia(user, type, media.pdf.urls, id);
        filterMedia(user, type, media.txt.urls, id);
        filterMedia(user, type, media.link.urls, id);
        filterMedia(user, type, media.doc.urls, id);
        filterMedia(user, type, media.other.urls, id);
    }
}
var filterMedia = function (user, type, urls, id) {
    var detail = document.getElementById(id + "-" + "content" + "-details");
    if (urls.length > 0) {
        for (var i = 0; i < urls.length; i++) {
            if (user && user !== 'all') {
                if (urls[i].pretty_from === user) {
                    // eslint-disable-next-line max-depth
                    if (type && urls[i].type === type) {
                        detail.insertAdjacentElement('beforeend', newItemElement('li', urls[i], "mediaItem"));
                    }
                    else {
                        detail.insertAdjacentElement('beforeend', newItemElement('li', urls[i], "mediaItem"));
                    }
                }

            }
            else {
                if (type && urls[i].type === type) {
                    detail.insertAdjacentElement('beforeend', newItemElement('li', urls[i], "mediaItem"));
                }
                else {
                    detail.insertAdjacentElement('beforeend', newItemElement('li', urls[i], "mediaItem"));
                }
            }
        }
    }
}
var getHTML = function (id) {
    return '<div class="content-bar-title add-this-up"><div class="left"><i class="fas fa-paperclip"></i><span>Discussion Files</span></div><div class="right"><i class="hide-show-messages fa fa-times"></i></div></div>' +
        '<div class="filetype-select add-this-up">' +
        '<div class="line">' +
        '</div>' +
        '<select id="filetype">' +
        '<option value="none">none</option>' +
        '<option value="txt">TXT</option>' +
        '<option value="pdf">PDF</option>' +
        '<option value="video">Video</option>' +
        '<option value="audio">Audio</option>' +
        '<option value="image">Image</option>' +
        '<option value="ppt">PPT</option>' +
        '<option value="link">Link</option>' +
        '<option value="other">Other</option>' +
        '</select>' +
        '</div>' +
        '<div class="sender-select add-this-up">' +
        '<div class="line">' +
        '</div>' +
        '<select id="fromuser">' +
        '<option value="all">all</option>' +
        '</select>' +
        '</div>' +
        '<div >' +
        '<ul class="content-library-ul" id="' + id + '-content-details"></ul>' +
        '<div>'

}

var isAudioURL = function (url) {
    const filename = url.toLowerCase();
    return filename.endsWith('.ogg') || filename.endsWith('.mp3') || filename.endsWith('.m4a') || filename.endsWith('.wav');
};

var isImageURL = function (url) {
    const filename = url.toLowerCase();
    return filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.png') || filename.endsWith('.gif') || filename.endsWith('.bmp') || filename.endsWith('.tiff') || filename.endsWith('.svg');
};

var isVideoURL = function (url) {
    const filename = url.toLowerCase();
    return filename.endsWith('.mp4') || filename.endsWith('.webm');
};
var isPDFURL = function (url) {
    const filename = url.toLowerCase();
    return filename.endsWith('.pdf')
};
var isPowerPointURL = function (url) {
    const filename = url.toLowerCase();
    return filename.endsWith('.ppt');
};
var isTextURL = function (url) {
    const filename = url.toLowerCase();
    return filename.endsWith('.txt');
};
var isDocURL = function (url) {
    const filename = url.toLowerCase();
    return filename.endsWith('.doc');
};
var isLink = function (url) {
    const filename = url.toLowerCase();
    const linkExtensions = ['.asp', '.html', '.php', '.xml', '.com'];
    linkExtensions.forEach(ext => {
        return filename.endsWith(ext);
    });
    return (
        (filename.lastIndexOf('/') > filename.lastIndexOf('.')) ||
        (filename.length === (filename.lastIndexOf('/')) + 1) ||
        ((filename.match(/\//g) || []).length) <= 2);
};

var sortUrls = function (a, b) {
    if (a.file < b.file)
        return -1;
    if (a.file > b.file)
        return 1;
    return 0;
};
var getFileExtension = function (name) {
    var re = /(?:\.([^.]+))?$/;
    return re.exec(name)[1];
}
var newItemElement = function (el, item, className) {
    item.ele = document.createElement(el);

    // item.ele.name = item.type;
    // item.ele.title = item.url;
    // 
    // item.ele.setAttribute('name',item.type);
    // item.ele.setAttribute('data-url',item.url);
    console.log(item.url)
    const fileName = item.url.substring(item.url.lastIndexOf('/') + 1);
    // const shortenedFileName = fileName.substring(0,20);
    let imageIconUrl = "#"
    const fileExtension = getFileExtension(fileName);
    console.log(fileName, isPDFURL(fileName))
    if (isPDFURL(fileName)) {
        imageIconUrl = "chatapp/icons/pdf.png"
    } else if (isDocURL(fileName)) {
        imageIconUrl = "chatapp/icons/doc.png"
    } else if (isPowerPointURL(fileName)) {
        imageIconUrl = "chatapp/icons/ppt.png"
    } else if (isTextURL(fileName)) {
        imageIconUrl = "chatapp/icons/txt.png"
    } else if (isImageURL(fileName)) {
        imageIconUrl = item.url
    }
    else if (isVideoURL(fileName)) {
        imageIconUrl = "chatapp/icons/video.png"
    } else if (isAudioURL(fileName)) {
        imageIconUrl = "chatapp/icons/audio.png"
    }
    else {
        imageIconUrl = "chatapp/icons/link.png"
    }
    var html =
        `<a href="${item.url.startsWith(window.location.origin) ? item.url.replace(window.location.origin, '') : item.url}" name="${item.type}" data-url="${item.url}" class="content-filter-result" download="${fileName}" target="_blank" data-isodate="${item.pretty_time}">` +
        '<div class="chat-msg-content"> ' +
        '<div class="image-and-text">' +
        '<img class="avatar" src="' + imageIconUrl + '" style="width: auto; height: 36px; max-width: 36px; margin-right: 10px;"> ' +
        '<div class="text">' +
        '<span class="chat-msg-text" title=' + fileName + '>' +
        `${fileName}` +
        '</span>' +
        '<div class="chat-msg-heading">' +
        '<span class="chat-msg-author">' + `${item.pretty_from}` + '</span> ' +
        `<span class="chat-msg-time">
                                ${new Date(item.time).toLocaleString(navigator.language || 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>`+
        '</div> ' +
        '</div>' +
        '</div>' +
        // '<button><i class="fas fa-ellipsis-v"></i></button>'+
        '</div>' +
        '</a>'
    item.ele.innerHTML = html;
    item.ele.classList.add(className);
    document.body.appendChild(item.ele);
    /*
    item.ele.firstChild.addEventListener('click', function(evt)
    {
        // console.log('Item Clicked', event.target);
        evt.stopPropagation();
        if (evt.target.name == "image" || evt.target.name == "audio" || evt.target.name == "video")
        {
            previewDialog = new PreviewDialog({'model': new converse.env.Backbone.Model({url: evt.target.getAttribute('data-url'), type: evt.target.name}) });
            previewDialog.show();
        }
        else {  // insert into textarea
            replyInverseChat(evt.target.title);
        }


    });
    */

    return item.ele;
}

var renderMedia = function (id, eleName, urls) {
    if (urls) {
        urls.sort(sortUrls);
    }

    // var count = document.getElementById(id + "-" + eleName + "-count");
    var detail = document.getElementById(id + "-" + eleName + "-details");

    if (detail && urls && urls.length > 0) {
        // count.innerHTML = urls.length;
        for (var i = 0; i < urls.length; i++) {
            detail.insertAdjacentElement('beforeend', newItemElement('li', urls[i], "mediaItem"));
        }
    }
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

var removeClass = function (className, el) {
    if (el instanceof Element) {
        el.classList.remove(className);
    }
    return el;
}

var newElement = function (el, id, html, className) {
    var ele = document.createElement(el);
    if (id) ele.id = id;
    if (html) ele.innerHTML = html;
    if (className) ele.classList.add(className);
    document.body.appendChild(ele);
    return ele;
}

var addToolbarItem = function (view, id, label, html) {
    var placeHolder = view.el.querySelector('#place-holder');

    if (!placeHolder) {
        var smiley = view.el.querySelector('.toggle-smiley.dropup');
        smiley.insertAdjacentElement('afterEnd', newElement('li', 'place-holder'));
        view.el.querySelector('#place-holder').style.cssText = "display:none";
        placeHolder = view.el.querySelector('#place-holder');
    }
    placeHolder.insertAdjacentElement('afterEnd', newElement('li', label, html));
}

var getSelectedChatBox = function () {
    var views = _converse.chatboxviews.model.models;
    var view = null;


    for (var i = 0; i < views.length; i++) {
        if ((views[i].get('type') === "chatroom" || views[i].get('type') === "chatbox") && !views[i].get('hidden')) {
            view = _converse.chatboxviews.views[views[i].id];
            break;
        }
    }
    return view;
}

function replyInverseChat(text) {
    var box = getSelectedChatBox();

    console.debug("replyInverseChat", text, box);

    if (box) {
        var textArea = box.el.querySelector('.chat-textarea');
        if (textArea) textArea.value = ">" + text + "\n\n";
    }
}
function hideOtherAllFeature(view) {
    if (view.el.querySelector('.occupants')) {
        view.model.set({ 'hidden_occupants': true })
        hideElement(view.el.querySelector('.occupants'));
    }
    if (view.el.querySelector('.searched-message')) {
        hideElement(view.el.querySelector('.searched-message'));
    }
    // if(view.el.querySelector('.conference')){
    //     hideElement(view.el.querySelector('.conference'));
    // }
}
function scrollContentInfo() {
    var sidebarGreyTop = document.getElementsByClassName('add-this-up')[0].offsetHeight + document.getElementsByClassName('add-this-up')[1].offsetHeight + document.getElementsByClassName('add-this-up')[2].offsetHeight
    document.getElementsByClassName('content-library-ul')[0].style.height = window.innerHeight - sidebarGreyTop - 90
}
