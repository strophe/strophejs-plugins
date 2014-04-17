/**
 * This plugin is distributed under the terms of the MIT licence.
 * Please see the LICENCE file for details.
 * Copyright (c) Markus Kohlhase, 2011
 */

/**
* File: strophe.private.js
* A Strophe plugin for XMPP Private XML Storage ( http://xmpp.org/extensions/xep-0049.html )
*/

Strophe.addConnectionPlugin('private',
{
  _connection: null,

  // called by the Strophe.Connection constructor

  init: function( conn ){

    this._connection = conn;
    Strophe.addNamespace( 'PRIVATE', "jabber:iq:private" );
  },

  /**
   * Function: set
   *
   * Parameters:
   * (String) tag - the tag name
   * (String) ns  - the namespace
   * (XML) data   - the data you want to save
   * (Function) success - Callback function on success
   * (Function) error - Callback function on error
   */

  set: function( tag, ns, data, success, error ){

    var id = this._connection.getUniqueId('saveXML');

    var iq = $iq({ type:'set', id: id })
      .c('query', { xmlns: Strophe.NS.PRIVATE } )
      .c( tag, { xmlns: ns } );

      var d = this._transformData( data );

      if( d ){
        iq.cnode( d );
      };

    this._connection.sendIQ( iq, success, error );

  },

  /**
   * Function: get
   *
   * Parameters:
   * (String) tag - the tag name
   * (String) ns  - the namespace
   * (Function) success - Callback function on success
   * (Function) error - Callback function on error
   */

  get: function( tag, ns, success, error ){

    var id = this._connection.getUniqueId('loadXML');

    var iq = $iq({ type:'get', id: id })
      .c('query', { xmlns: Strophe.NS.PRIVATE } )
      .c(tag, { xmlns: ns } );

    this._connection.sendIQ( iq, function( iq ){

      var data = iq;

      for( var i=0; i<3; i++ ){
        data = data.childNodes[0];
        if( !data ){
          break;
        }
      }

      success( data, iq );

    }, error );

  },

  /**
   * PrivateFunction: _transformData
   */
  _transformData: function( c ){

    switch( typeof( c ) ){

      case "number":
      case "boolean": return Strophe.xmlTextNode( c + '' );

      case "string":

        var dom = this._textToXml( c );

        if( dom !== null ){
          return dom
        } else {
          return Strophe.xmlTextNode( c + '' );
        }

      case "object":

      if( this._isNode(c) || this._isElement(c) ){
        return c;
      }
    }
    return null;
  },

   /**
   * PrivateFunction: _textToXml
   *
   * Parameters:
   * (String) text  - XML String
   *
   * Returns:
   * (Object) dom - DOM Object
   */
  _textToXml: function( text ){
    var doc = null;

    if(this._isIE() && this._isPlainText()){
        return null;
    }

    if( window.DOMParser ){
      var parser = new DOMParser();
      doc = parser.parseFromString( text, 'text/xml');
    } else if( window.ActiveXObject ){
      doc = new ActiveXObject("MSXML2.DOMDocument");
      doc.async = false;
      doc.loadXML(text);
    } else{
      throw{
        type: 'Parse error',
        message: "No DOM parser object found."
      };
    }

    var error = doc.getElementsByTagName("parsererror");

    if( error.length > 0 ){
      return null;
    }

    var node = document.importNode( doc.documentElement, true );
    return node;
  },
    /**
   * PrivateFunction: _isNode
   *
   * Parameters:
   * ( Object ) obj - The object to test
   *
   * Returns:
   * True if it is a DOM node
   */

  _isNode: function( obj ){

      if( typeof( Node ) === "object" ){
        return ( obj instanceof Node );
      }else{
        return ( typeof( obj ) === "object" && typeof( obj.nodeType ) === "number" && typeof( obj.nodeName ) === "string");
      }
  },

  /**
   * PrivateFunction: _isElement
   *
   * Parameters:
   * ( Object ) obj - The object to test
   *
   * Returns:
   * True if it is a DOM element.
   */

  _isElement: function( obj ){

    if( typeof( HTMLElement ) === "object"){
      return ( obj instanceof HTMLElement ); //DOM2
    } else{
      return ( typeof( obj ) === "object" && obj.nodeType === 1 && typeof( obj.nodeName ) === "string" );
    }
  },

  _isIE : function() {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
  },

  _isPlainText : function(text){
    return !/<[^>]*>((.|[\n\r])*)<\/[^>]+>/.test(text);
  }

});
