Strophe.addConnectionPlugin('customHeaders', {
    init: function(conn){
        // Overriding this function so that it looks for a customHeaders property
        // set on the connection object.
        //
        // Example...
        //
        // var conn = new Strophe.Connection(url);
        // conn.customHeaders = {
        //   'X-Special-Header': 'Something'
        // };

        Strophe.Connection.prototype._processRequest = function (i)
        {
            var req = this._requests[i];
            var reqStatus = -1;
            try {
                if (req.xhr.readyState == 4) {
                    reqStatus = req.xhr.status;
                }
            } catch (e) {
                Strophe.error("caught an error in _requests[" + i +
                              "], reqStatus: " + reqStatus);
            }

            if (typeof(reqStatus) == "undefined") {
                reqStatus = -1;
            }

            // make sure we limit the number of retries
            if (req.sends > this.maxRetries) {
                this._onDisconnectTimeout();
                return;
            }

            var time_elapsed = req.age();
            var primaryTimeout = (!isNaN(time_elapsed) &&
                                  time_elapsed > Math.floor(Strophe.TIMEOUT * this.wait));
            var secondaryTimeout = (req.dead !== null &&
                                    req.timeDead() > Math.floor(Strophe.SECONDARY_TIMEOUT * this.wait));
            var requestCompletedWithServerError = (req.xhr.readyState == 4 &&
                                                   (reqStatus < 1 ||
                                                    reqStatus >= 500));
            if (primaryTimeout || secondaryTimeout ||
                requestCompletedWithServerError) {
                if (secondaryTimeout) {
                    Strophe.error("Request " +
                                  this._requests[i].id +
                                  " timed out (secondary), restarting");
                }
                req.abort = true;
                req.xhr.abort();
                // setting to null fails on IE6, so set to empty function
                req.xhr.onreadystatechange = function () {};
                this._requests[i] = new Strophe.Request(req.xmlData,
                                                        req.origFunc,
                                                        req.rid,
                                                        req.sends);
                req = this._requests[i];
            }

            if (req.xhr.readyState === 0) {
                Strophe.debug("request id " + req.id +
                              "." + req.sends + " posting");

                try {
                    req.xhr.open("POST", this.service, true);
                } catch (e2) {
                    Strophe.error("XHR open failed.");
                    if (!this.connected) {
                        this._changeConnectStatus(Strophe.Status.CONNFAIL,
                                                  "bad-service");
                    }
                    this.disconnect();
                    return;
                }

                // Fires the XHR request -- may be invoked immediately
                // or on a gradually expanding retry window for reconnects
                //
                var self = this;
                var sendFunc = function () {
                    req.date = new Date();
                    if (self.customHeaders){
                      var headers = self.customHeaders;
                      for (var header in headers) {
                        if (headers.hasOwnProperty(header)){
                          req.xhr.setRequestHeader(header, headers[header]);
                        }
                      }
                    }
                    req.xhr.send(req.data);
                };

                // Implement progressive backoff for reconnects --
                // First retry (send == 1) should also be instantaneous
                if (req.sends > 1) {
                    // Using a cube of the retry number creates a nicely
                    // expanding retry window
                    var backoff = Math.min(Math.floor(Strophe.TIMEOUT * this.wait),
                                           Math.pow(req.sends, 3)) * 1000;
                    setTimeout(sendFunc, backoff);
                } else {
                    sendFunc();
                }

                req.sends++;

                if (this.xmlOutput !== Strophe.Connection.prototype.xmlOutput) {
                    this.xmlOutput(req.xmlData);
                }
                if (this.rawOutput !== Strophe.Connection.prototype.rawOutput) {
                    this.rawOutput(req.data);
                }
            } else {
                Strophe.debug("_processRequest: " +
                              (i === 0 ? "first" : "second") +
                              " request has readyState of " +
                              req.xhr.readyState);
            }
        };
    }
});

