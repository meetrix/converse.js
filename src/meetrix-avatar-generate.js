/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
// version 0.4.11.1
    // Commonly used utilities and variables can be found under the "env"
    // namespace of the "converse" global.
    import converse from "@converse/headless/converse-core";
    const { Strophe, _,$iq,$msg, $pres,  $build, b64_sha1, sizzle, Backbone } = converse.env;
     var _converse = null,  baseUrl = null, messageCount = 0, h5pViews = {}, pasteInputs = {}, videoRecorder = null, userProfiles = {};
     var PreviewDialog = null, previewDialog = null, GeoLocationDialog = null, geoLocationDialog = null;
  
     // The following line registers your plugin.
    converse.plugins.add("meetrix-avatar-generate", {
  
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
        'dependencies': ["converse-vcard"],
  
        /* Converse.js's plugin mechanism will call the initialize
         * method on any plugin (if it exists) as soon as the plugin has
         * been loaded.
         */
        'initialize': function () {
            /* Inside this method, you have access to the private
             * `_converse` object.
             */
            _converse = this._converse;
  
            console.log("webmeet plugin is ready");
  
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
            'onConnected': function () {
                // Overrides the onConnected method in converse.js
  
                // Top-level functions in "overrides" are bound to the
                // inner "_converse" object.
                var _converse = this;
                var uPort = _converse.api.settings.get("uport_data");
                  var username = Strophe.getNodeFromJid(_converse.connection.jid);
  
                  // only save avatar if user has success with uport
                      var stanza = $iq({type: 'get', to: Strophe.getBareJidFromJid(_converse.connection.jid)}).c('vCard', {xmlns: 'vcard-temp'});
  
                      _converse.connection.sendIQ(stanza, function(iq) {
                          var vCard = getVCard(iq);
                         // TODO ipfs address url
                          if (!vCard.avatar)
                          {
                             
                              vCard.avatar = createAvatar(username)
                              _converse.connection.sendIQ( setVCard(vCard), function(resp)
                              {
                                  
                                  _converse.__super__.onConnected.apply(this, arguments);
  
                              }, function() {
                                 
                                  _converse.__super__.onConnected.apply(this, arguments);
                              });
                          }
                          else {
                              _converse.__super__.onConnected.apply(this, arguments);
                          }
                          if(_converse.registerData){
                              vCard.name =  _converse.registerData.name
                              vCard.nickname =  _converse.registerData.username
                              vCard.email =  _converse.registerData.email
                             
                              _converse.connection.sendIQ( setVCard(vCard), function(resp)
                              {
                                  _converse.registerData = null;
                                  _converse.__super__.onConnected.apply(this, arguments);
  
                              }, function() {
                                 
                                  _converse.__super__.onConnected.apply(this, arguments);
                              });
                          }
                         
                      });
                  
                
            },
            MessageView: {
              renderChatMessage: async function renderChatMessage()
                  {
                      //console.debug('webmeet - renderChatMessage', this.model.get("fullname"), this.model.getDisplayName(), this.model.vcard.attributes.fullname, this.model);
                      // intercepting email IM
  
                      if (this.model.vcard)
                      {
                          if (!this.model.get("fullname") && this.model.get("from").indexOf("\\40") > -1)
                          {
                              this.model.vcard.attributes.fullname = Strophe.unescapeNode(this.model.get("from").split("@")[0]);
                          }
  
                          var nick = this.model.getDisplayName();
  
                          if (nick && _converse.DEFAULT_IMAGE == this.model.vcard.attributes.image)
                          {
                              var dataUri = createAvatar(nick);
                              var avatar = dataUri.split(";base64,");
  
                              this.model.vcard.attributes.image = avatar[1];
                              this.model.vcard.attributes.image_type = "image/png";
                              // this.mode.vcard.set({image: avatar[1],image_type:'image/png'});
                              await this.__super__.renderChatMessage.apply(this, arguments);
                          }
                      }
                      await this.__super__.renderChatMessage.apply(this, arguments);
                    }
            },
          //   RosterContactView:{
          //     renderRosterItem: async function renderRosterItem(){
          //         await this.__super__.renderRosterItem.apply(this, arguments);
          //         if(!this.el.querySelector('direct-message-avatart')){
          //             var img = document.createElement('img')
          //             img.classList.add('roster-avatar');
          //             img.classList.add('avatar');
          //             img.classList.add('direct-message-avatart');
          //             img.src="data:image/png;base64,"+this.model.vcard.attributes.image
                 
          //             this.el.insertBefore(img,this.el.querySelector('.list-item-link'))
          //         }
                  
          //         return true;
          //     }
          //   },
  
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
    var getVCard = function(iq)
    {
        const vcard = iq.querySelector('vCard');
            let result = {};
            result = {
                'stanza': iq,
                'fullname': _.get(vcard.querySelector('FN'), 'textContent'),
                'nickname': _.get(vcard.querySelector('NICKNAME'), 'textContent'),
                'image': _.get(vcard.querySelector('PHOTO BINVAL'), 'textContent'),
                'image_type': _.get(vcard.querySelector('PHOTO TYPE'), 'textContent'),
                'url': _.get(vcard.querySelector('URL'), 'textContent'),
                'role': _.get(vcard.querySelector('ROLE'), 'textContent'),
                'email': _.get(vcard.querySelector('EMAIL USERID'), 'textContent'),
                'vcard_updated': (new Date()).toISOString(),
                'vcard_error': undefined
            };
        return result;
    }
  
    var setVCard = function(user)
    {
        var avatar = user.avatar.split(";base64,");
  
        var iq = $iq({to:  _converse.connection.domain, type: 'set'}).c('vCard', {xmlns: 'vcard-temp'})
  
        .c("FN").t(user.name).up()
        .c("NICKNAME").t(user.nickname).up()
        .c("URL").t(user.url).up()
        .c("ROLE").t(user.role).up()
        .c("EMAIL").c("INTERNET").up().c("PREF").up().c("USERID").t(user.email).up().up()
        .c("PHOTO").c("TYPE").t(avatar[0].substring(5)).up().c("BINVAL").t(avatar[1]).up().up()
        .c("TEL").c("VOICE").up().c("WORK").up().c("NUMBER").t(user.workPhone).up().up()
        .c("ADR").c("WORK").up().c("STREET").t(user.street).up().c("LOCALITY").t(user.locality).up().c("REGION").t(user.region).up().c("PCODE").t(user.pcode).up().c("CTRY").t(user.country).up().up()
  /*
        .c("TEL").c("PAGER").up().c("WORK").up().c("NUMBER").up().up()
        .c("TEL").c("CELL").up().c("WORK").up().c("NUMBER").t(user.workMobile).up().up()
  
        .c("TEL").c("FAX").up().c("WORK").up().c("NUMBER").up().up()
        .c("TEL").c("PAGER").up().c("HOME").up().c("NUMBER").up().up()
        .c("TEL").c("CELL").up().c("HOME").up().c("NUMBER").t(user.homeMobile).up().up()
        .c("TEL").c("VOICE").up().c("HOME").up().c("NUMBER").t(user.homePhone).up().up()
        .c("TEL").c("FAX").up().c("HOME").up().c("NUMBER").up().up()
        .c("URL").t(user.url).up()
        .c("ADR").c("HOME").up().c("STREET").up().c("LOCALITY").up().c("REGION").up().c("PCODE").up().c("CTRY").up().up()
        .c("TITLE").t(user.title).up()
  */
        return iq;
    }
  
