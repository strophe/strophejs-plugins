/*
This library is free software; you can redistribute it and/or modify it
 under the terms of the GNU Lesser General Public License as published
 by the Free Software Foundation; either version 2.1 of the License, or
 (at your option) any later version.
 .
 This library is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser
 General Public License for more details.

  Copyright (c) dodo <dodo@blacksec.org>, 2011

*/

/**
* File: strophe.register.js
* A Strophe plugin for XMPP In-Band Registration.
*/
Strophe.addConnectionPlugin('register', {
    _connection: null,

    //The plugin must have the init function.
    init: function(conn) {
        this._connection = conn;

        // compute free emun index number
        var i = 0;
        Object.keys(Strophe.Status).forEach(function (key) {
            i = Math.max(i, Strophe.Status[key]);
        });

        /* extend name space
         *  NS.REGISTER - In-Band Registration
         *              from XEP 77.
         */
        Strophe.addNamespace('REGISTER', 'jabber:iq:register');
        Strophe.Status.REGIFAIL        = i + 1;
        Strophe.Status.REGISTER        = i + 2;
        Strophe.Status.REGISTERED      = i + 3;
        Strophe.Status.CONFLICT        = i + 4;
        Strophe.Status.NOTACCEPTABLE   = i + 5;
        Strophe.Status.REGISTERTIMEOUT = i + 6;

        if (conn.disco)
            conn.disco.addFeature(Strophe.NS.REGISTER);

        // hooking strophe's connection.reset
        var self = this, reset = conn.reset.bind(conn);
        conn.reset = function () {
            reset();
            self.instructions = "";
            self.fields = {};
            self.registered = false;
        };

        // hooking strophe's _connect_cb
        var connect_cb = conn._connect_cb.bind(conn);
        conn._connect_cb = function (req, callback, raw) {
            if (!self._registering) {
                if (self.processed_features) {
                    // exchange Input hooks to not print the stream:features twice
                    var xmlInput = conn.xmlInput;
                    conn.xmlInput = Strophe.Connection.prototype.xmlInput;
                    var rawInput = conn.rawInput;
                    conn.rawInput = Strophe.Connection.prototype.rawInput;
                    connect_cb(req, callback, raw);
                    conn.xmlInput = xmlInput;
                    conn.rawInput = rawInput;
                    delete self.processed_features;
                } else {
                    connect_cb(req, callback, raw);
                }
            } else {
                // Save this request in case we want to authenticate later
                self._connect_cb_data = {req: req,
                                         raw: raw};
                // remember that we already processed stream:features
                self.processed_features = true;
                self._register_cb(req, callback, raw);
                delete self._registering;
            }
        };

        // hooking strophe`s authenticate
        var auth_old = conn.authenticate.bind(conn);
        conn.authenticate = function(matched) {
            if (typeof matched === "undefined") {
                var conn = this._connection;

                if (!this.fields.username || !this.domain || !this.fields.password) {
                    Strophe.info("Register a JID first!");
                    return;
                }

                var jid = this.fields.username + "@" + this.domain;

                conn.jid = jid;
                conn.authzid = Strophe.getBareJidFromJid(conn.jid);
                conn.authcid = Strophe.getNodeFromJid(conn.jid);
                conn.pass = this.fields.password;

                var req = this._connect_cb_data.req;
                var callback = conn.connect_callback;
                var raw = this._connect_cb_data.raw;
                conn._connect_cb(req, callback, raw);
            } else {
                auth_old(matched);
            }
        }.bind(this);

    },

    /** Function: connect
     *  Starts the registration process.
     *
     *  As the registration process proceeds, the user supplied callback will
     *  be triggered multiple times with status updates.  The callback
     *  should take two arguments - the status code and the error condition.
     *
     *  The status code will be one of the values in the Strophe.Status
     *  constants.  The error condition will be one of the conditions
     *  defined in RFC 3920 or the condition 'strophe-parsererror'.
     *
     *  Please see XEP 77 for a more detailed explanation of the optional
     *  parameters below.
     *
     *  Parameters:
     *    (String) domain - The xmpp server's Domain.  This will be the server,
     *      which will be contacted to register a new JID.
     *      The server has to provide and allow In-Band Registration (XEP-0077).
     *    (Function) callback The connect callback function.
     *    (Integer) wait - The optional HTTPBIND wait value.  This is the
     *      time the server will wait before returning an empty result for
     *      a request.  The default setting of 60 seconds is recommended.
     *      Other settings will require tweaks to the Strophe.TIMEOUT value.
     *    (Integer) hold - The optional HTTPBIND hold value.  This is the
     *      number of connections the server will hold at one time.  This
     *      should almost always be set to 1 (the default).
     */
    connect: function(domain, callback, wait, hold, route) {
        var conn = this._connection;
        this.domain = Strophe.getDomainFromJid(domain);
        this.instructions = "";
        this._form = null;
        this.fields = {};
        this.registered = false;

        this._registering = true;
        conn.connect(this.domain, "", callback, wait, hold, route);
    },

    /** PrivateFunction: _register_cb
     *  _Private_ handler for initial registration request.
     *
     *  This handler is used to process the initial registration request
     *  response from the BOSH server. It is used to set up a bosh session
     *  and requesting registration fields from host.
     *
     *  Parameters:
     *    (Strophe.Request) req - The current request.
     */
    _register_cb: function (req, _callback, raw) {
        var conn = this._connection;

        Strophe.info("_register_cb was called");
        conn.connected = true;

        var bodyWrap = conn._proto._reqToData(req);
        if (!bodyWrap) { return; }

        if (conn.xmlInput !== Strophe.Connection.prototype.xmlInput) {
            if (bodyWrap.nodeName === conn._proto.strip && bodyWrap.childNodes.length) {
                conn.xmlInput(bodyWrap.childNodes[0]);
            } else {
                conn.xmlInput(bodyWrap);
            }
        }
        if (conn.rawInput !== Strophe.Connection.prototype.rawInput) {
            if (raw) {
                conn.rawInput(raw);
            } else {
                conn.rawInput(Strophe.serialize(bodyWrap));
            }
        }

        var conncheck = conn._proto._connect_cb(bodyWrap);
        if (conncheck === Strophe.Status.CONNFAIL) {
            return;
        }

        // Check for the stream:features tag
        var register = bodyWrap.getElementsByTagName("register");
        var mechanisms = bodyWrap.getElementsByTagName("mechanism");
        if (register.length === 0 && mechanisms.length === 0) {
            conn._proto._no_auth_received(_callback);
            return;
        }

//        if (register.length === 0) {
//            conn._changeConnectStatus(Strophe.Status.REGIFAIL, null);
//            return;
//        }

        // send a get request for registration, to get all required data fields
        conn._addSysHandler(this._get_register_cb.bind(this),
                            null, "iq", null, null);
        conn.send($iq({type: "get"}).c("query",
            {xmlns: Strophe.NS.REGISTER}).tree());
    },

    /** PrivateFunction: _get_register_cb
     *  _Private_ handler for Registration Fields Request.
     *
     *  Parameters:
     *    (XMLElement) elem - The query stanza.
     *
     *  Returns:
     *    false (unregister handler)
     */
    _get_register_cb: function (stanza) {
        
        this._parseForm(stanza);
        return false;
    },
    
    _parseForm: function(stanza) {
        var i, query, xElements;

        query = stanza.getElementsByTagName("query");

        if (query.length !== 1) {
            conn._changeConnectStatus(Strophe.Status.REGIFAIL, "unknown");
            return false;
        }
        query = query[0];

        xElements = query.getElementsByTagName('x');

        // There might be multiple "x" elements, one with namespace
        // jabber:x:data (the form) and one with namespace x:oop (url with
        // instructions)
        for (i = 0; i < xElements.length; i++) {
            
            if ('jabber:x:data' === xElements[i].getAttribute('xmlns')) {
                // Save the form in order to build the answer with it later
                this._form = xElements[i];
                this._parseXForm(xElements[i]);
                return;
            }
        }

        // If no jabber:x:data field was found, parse lagacy fields
        this._parseLegacyForm(query);
        return;
    },
    
    _parseXForm: function(xElement) {
        var i, field, tagName, type, variable, label, value, conn = this._connection;

        
        for (i = 0; i < xElement.childNodes.length; i++) {
            // Parse all the info from the current field
            field = xElement.childNodes[i];
            tagName = field.tagName.toLowerCase();
            type = field.hasAttribute('type') ? field.getAttribute('type') : '';
            label = field.hasAttribute('label') ? field.getAttribute('label') : '';
            variable = field.hasAttribute('var') ? field.getAttribute('var') : '';

            value = '';
            if (   0 < field.childNodes.length
                && 'value' === field.childNodes[0].tagName) {
                value = Strophe.getText(field.childNodes[0]);
            }

            // Now do the actual logic
            if (   'instructions' === tagName
                || 'title' === tagName) {
                // This is a special element
                // It provides info about given data fields in a textual way.
                conn.register[tagName] = Strophe.getText(field);
            }
            else if (   'hidden' === type
                     || 'FORM_TYPE' === variable) {

                // Check that the form type is correct. If not, abort.
                if ('jabber:iq:register' !== value) {
                    conn._changeConnectStatus(Strophe.Status.REGIFAIL, null);
                    return false;
                }
            }
            else if ('field' === tagName
                     && (   'text-private' === type
                         || 'text-single' === type
                         || 'hidden' === type
                        )) {
                conn.register.fields[variable] = value;
            }

            // ignore other elements (especially x-elements) here
        }

        conn._changeConnectStatus(Strophe.Status.REGISTER, null);
        return false;
    },

    _parseLegacyForm: function(query) {
        var i, field, conn = this._connection;
        
        // get required fields
        for (i = 0; i < query.childNodes.length; i++) {
            field = query.childNodes[i];

            if (field.tagName.toLowerCase() === 'instructions') {
                // this is a special element
                // it provides info about given data fields in a textual way.
                conn.register.instructions = Strophe.getText(field);
                continue;
            } else if (field.tagName.toLowerCase() === 'x') {
                // ignore x elements here
                continue;
            }
            conn.register.fields[field.tagName.toLowerCase()] = Strophe.getText(field);
        }
        conn._changeConnectStatus(Strophe.Status.REGISTER, null);
        return false;
    },

    /** Function: submit
     *  Submits Registration data.
     *
     *  As the registration process proceeds, the user supplied callback will
     *  be triggered with status code Strophe.Status.REGISTER. At this point
     *  the user should fill all required fields in connection.register.fields
     *  and invoke this function to procceed in the registration process.
     */
    submit: function () {

        var submission = null;

        if (null !== this._form) {
            submission = this._fillXForm();
        }
        else {
            submission = this._fillLegacyForm();
        }

        var submissionId = submission.tree().getAttribute('id');

        
        var timeout = null;

        // Send submission form to server with 60 seconds timeout
        var handler = this._connection._addSysHandler(
                function(stanza) {
                    clearTimeout(timeout);
                    return this._submit_cb(stanza);
                }.bind(this),
                null,
                "iq",
                null,
                submissionId
        );

        // Set the timeout to 60 seconds
        timeout = setTimeout(function() {
            return this._submit_cb(null);
        }.bind(this), 15000);

        this._connection.send(submission);
    },

    _fillXForm: function() {

        // Build the basic structure:
        var submission = $iq(
            {
                type: 'set',
                id: this._connection.getUniqueId('register')
            }
        ).c(
            'query',
            {
                xmlns: 'jabber:iq:register'
            }
        ).c(
            'x',
            {
                type:   'submit',
                xmlns:  'jabber:x:data'
            }
        );

        // Walk through all fields of the original form and add them to the
        // submission, filled in.
        var fields = this._form.getElementsByTagName('field');
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];

            var type = field.hasAttribute('type') ? field.getAttribute('type') : '';
            var label = field.hasAttribute('label') ? field.getAttribute('label') : '';
            var variable = field.hasAttribute('var') ? field.getAttribute('var') : '';
            
            // Calculate the value for the field. If the field was to be filled
            // by the user, use that value (may be the default value), otherwise
            // (e.g. if the field is the form type) use the value from the
            // original form.
            var value = '';
            if (variable in this.fields) {
                value = this.fields[variable];
            }
            else {
                var valueChildren = field.getElementsByTagName('value');
                
                if (0 !== valueChildren.length) {
                    value = Strophe.getText(valueChildren[0]);
                }
            }

            // Add field data:
            submission.c(
                'field',
                {
                    'type':     type,
                    'var':      variable,
                    'label':    label
                }
            ).c(
                'value',
                {}
            ).t(value);

            // Make <x> element current again:
            submission.up().up();
        }

        return submission;
    },
    
    _fillLegacyForm: function() {
        var i, name, query, fields;
        query = $iq(
        {
            type: "set",
            id: this._connection.getUniqueId('register')
        }).c(
            "query",
            {
                xmlns:Strophe.NS.REGISTER
            }
        );

        // set required fields
        fields = Object.keys(this.fields);
        for (i = 0; i < fields.length; i++) {
            name = fields[i];
            query.c(name).t(this.fields[name]).up();
        }

        return query;
    },

    /** PrivateFunction: _submit_cb
     *  _Private_ handler for submitted registration information.
     *
     *  Parameters:
     *    (XMLElement) elem - The query stanza.
     *
     *  Returns:
     *    false to remove the handler.
     */
    _submit_cb: function (stanza) {
        var error = null, conn = this._connection;

        if (null === stanza) {
            Strophe.info("Registration attempt timed out.");
            
            conn._changeConnectStatus(Strophe.Status.REGISTERTIMEOUT, "timeout");
        }
        else if (stanza.getAttribute("type") === "error") {
            error = stanza.getElementsByTagName("error");
            if (error.length !== 1) {
                conn._changeConnectStatus(Strophe.Status.REGIFAIL, "unknown");
                return false;
            }

            Strophe.info("Registration failed.");

            // this is either 'conflict' or 'not-acceptable'
            error = error[0].firstChild.tagName.toLowerCase();
            if (error === 'conflict') {
                conn._changeConnectStatus(Strophe.Status.CONFLICT, error);
            } else if (error === 'not-acceptable') {
                conn._changeConnectStatus(Strophe.Status.NOTACCEPTABLE, error);
            } else {
                conn._changeConnectStatus(Strophe.Status.REGIFAIL, error);
            }
        }
        else {

            Strophe.info("Registered successful.");

            conn._changeConnectStatus(Strophe.Status.REGISTERED, null);
        }

        return false;
    }
});
