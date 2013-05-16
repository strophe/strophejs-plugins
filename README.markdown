# Strophe.js Plugins

[Strophe.js](http://code.stanziq.com/strophe) is a JavaScript library for
speaking XMPP in web applications. It supports extension via a plugin system.

This is a collection of Strophe.js plugins created and maintained by the
community. The homepage for this collection is
https://github.com/metajack/strophejs-plugins .

## Available Plugins

### XMPP Extensions

- [Data Forms](/dataforms/)
  ([XEP 0004](http://xmpp.org/extensions/xep-0004.html))

- [Jabber-RPC](/rpc/)
  ([XEP 0009](http://xmpp.org/extensions/xep-0009.html))

- [Service Discovery](/disco/)
  ([XEP 0030](http://xmpp.org/extensions/xep-0030.html))

- [Multi-User Chat](/muc/)
  ([XEP 0045](http://xmpp.org/extensions/xep-0045.html))

- [Private XML Storage](/private/)
  ([XEP 0049](http://xmpp.org/extensions/xep-0049.html))

- [Ad-Hoc Commands](/cmds/)
  ([XEP 0050](http://xmpp.org/extensions/xep-0050.html))

- [vcard-temp](/vcard/)
  ([XEP 0054](http://xmpp.org/extensions/xep-0054.html))

- [Result Set Management](/rsm/)
  ([XEP 0059](http://xmpp.org/extensions/xep-0059.html))

- [Publish-Subscribe](/pubsub/)
  ([XEP 0060](http://xmpp.org/extensions/xep-0060.html))
  
- [Out of Band Data](/outofband/)
  ([XEP 0066](http://xmpp.org/extensions/xep-0066.html))

- [Jabber Object Access Protocol](/joap/)
  ([XEP 0075](http://xmpp.org/extensions/xep-0075.html))

- [In-Band Registration](/register/)
  ([XEP 0077](http://xmpp.org/extensions/xep-0077.html))

- [Chat State Notifications](/chatstates/)
  ([XEP 0085](http://xmpp.org/extensions/xep-0085.html))

- [Entity Capabilities](/caps/)
  ([XEP 0115](http://xmpp.org/extensions/xep-0115.html))

- [Message Archiving](/archive/)
  ([XEP 0136](http://xmpp.org/extensions/xep-0136.html))

- [Personal Eventing Protocol](/pep/)
  ([XEP 0163](http://xmpp.org/extensions/xep-0163.html))

- [Message Delivery Receipts](/receipts/)
  ([XEP 0184](http://xmpp.org/extensions/xep-0184.html))

- [XMPP Ping](/ping/)
  ([XEP 0199](http://xmpp.org/extensions/xep-0199.html))

- [Roster Versioning](/roster/)
  ([XEP 0237](http://xmpp.org/extensions/xep-0237.html))

- [Message Archive Management](/mam/)
  ([XEP 0313](http://xmpp.org/extensions/xep-0313.html))

- [In-Band Bytestreams](/ibb/)
  ([XEP 0047](http://xmpp.org/extensions/xep-0047.html))

- [SI File Transfer](/si-filetransfer/)
  ([XEP 0096](http://xmpp.org/extensions/xep-0096.html))

### Other Plugins

- [Serverdate](/serverdate/) - Syncs a local clock
  to the servers

- [epic](/epic/)

- [iexdomain](/iexdomain/) - Support for IE
  XDomainRequest

## Contribute

If you would like to make your plugin available here, simply fork this
repository, commit your plugin and issue a pull request.
The same instructions also work for any changes you wish to make to existing
plugins.

## Literature

The book Professional XMPP Programming with JavaScript and
[jQuery](http://jquery.com/) is also available, which covers Strophe in detail
in the context of web applications.
You can find more information and two free chapters ( including one specifically
on writing Strophe.js plugins ) at the [homepage](http://professionalxmpp.com)
of the book.
