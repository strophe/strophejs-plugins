/**
 * Chat state notifications (XEP 0085) plugin
 * @see http://xmpp.org/extensions/xep-0085.html
 */
Strophe.addConnectionPlugin('chatstates',
{
	init: function (connection)
	{
		this._connection = connection;

		Strophe.addNamespace('CHATSTATES', 'http://jabber.org/protocol/chatstates');
	},

	statusChanged: function (status)
	{
		if (status === Strophe.Status.CONNECTED
			|| status === Strophe.Status.ATTACHED)
		{
			this._connection.addHandler(this._notificationReceived.bind(this),
				Strophe.NS.CHATSTATES, "message");
		}
	},

	addActive: function(message)
	{
		return message.c('active', {xmlns: Strophe.NS.CHATSTATES}).up();
	},

	_notificationReceived: function(message)
	{
		var composing = $(message).find('composing'),
			paused = $(message).find('paused'),
			active = $(message).find('active'),
			jid = $(message).attr('from');

		if (composing.length > 0) {
			this.onComposing(jid);
		}

		if (paused.length > 0) {
			this.onPaused(jid);
		}

		if (active.length > 0) {
			this.onActive(jid);
		}

		return true;
	},

	onActive: function (jid) {},
	onComposing: function (jid) {},
	onPaused: function (jid) {},

	sendActive: function(jid, type)
	{
		this._sendNotification(jid, type, 'active');
	},

	sendComposing: function(jid, type)
	{
		this._sendNotification(jid, type, 'composing');
	},

	sendPaused: function(jid, type)
	{
		this._sendNotification(jid, type, 'paused');
	},

	_sendNotification: function(jid, type, notification)
	{
		if (!type) type = 'chat';

		this._connection.send($msg(
		{
			to: jid,
			type: type
		})
		.c(notification, {xmlns: Strophe.NS.CHATSTATES}));
	}
});
