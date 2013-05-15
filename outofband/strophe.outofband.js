// Kay Tsar
// 15 May 2013

Strophe.addConnectionPlugin('outofband', {
    _conn: null,

    init: function(conn) {
        this._conn = conn;
        Strophe.addNamespace('OUTOFBAND', 'jabber:iq:oob');
    },
	
    /* sendIqResult
    ** sends an iq stanza back to the sender
    */
    sendIq: function(iq, httpErrorCode) {
        var iqResponse = null;
        var that = this;

        $(iq).filter('iq')
            .each(function () {
                var url         = $(this).find('url:first').text();;
                var description = $(this).find('desc:first').text();;


                switch(httpErrorCode)
                {
                    case null:
                        iqResponse = $iq({
                            to  : $(this).attr('from'),
                            from: $(this).attr('to'),
                            type: "result",
                            id  : $(this).attr('id')
                        });

                         break;

                    case '404':
                        //    <error code='404' type='cancel'>
                        //      <item-not-found xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
                        //    </error>
                        iqResponse = $iq({
                            to  : $(this).attr('from'),
                            from: $(this).attr('to'),
                            type: "error",
                            id  : $(this).attr('id')
                            })
                            .c('query', { xmlns: Strophe.NS.OUTOFBAND })
                                .c('url', {}, url)
                                .c('desc', {}, description)
                                .up()
                                .c('error', {
                                    code: '404',
                                    type: 'cancel'
                                })
                            .c('item-not-found', {
                                xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'
                            })
                        ;
                        break;

                    case '406':
                        //  <error code='406' type='modify'>
                        //      <not-acceptable xmlns='urn:ietf:params:xml:ns:xmpp-stanzas'/>
                        //  </error>
                        iqResponse = $iq({
                            to  : $(this).attr('from'),
                            from: $(this).attr('to'),
                            type: "error",
                            id  : $(this).attr('id')
                        })
                            .c('query', { xmlns: Strophe.NS.OUTOFBAND })
                            .c('url', {}, url)
                            .c('desc', {}, description)
                            .up()
                            .c('error', {
                                code: '406',
                                type: 'modify'
                            })
                            .c('not-acceptable', {
                                xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'
                            })
                        ;
                        break;

                    default:
                        console.log('Unhandled errorcode: a response has not been sent');
                }
            });

        if (iqResponse) {
            console.log(iqResponse.toString());
            this._conn.send(iqResponse);
        }

        return iqResponse;
    },

	/* addOutOfBandHandler
    ** add an iq Out Of Band handler that handles XEP-0066 iq stanzas
    */
    addOutOfBandHandler: function(handler, type, from, options) {
        this._conn.addHandler(handler, Strophe.NS.OUTOFBAND, 'iq',
                              type, null, from, options);
    }
});