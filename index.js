
const EventEmiiter = require("events")
const WebSocketClient = require("simple-web-socket-client")

class WebSocketClientReconnect extends EventEmiiter {
	constructor(url, options) {
		super();
		
		this.url = url;
		this.options = {
			reconnect: true,
			reconnect_timeinterval: 1e3,
			...options
		};
		
		this._reconnect = null;
		this._tid = null;
		
		this._socketNew();
	}

	_socketNew() {
		this._reconnect = this.options.reconnect;
		
		this.socket = new WebSocketClient(this.url, {...this.options});
		this.socket.once("open", (...args) => this.emit("open", ...args));
		this.socket.once("close", (...args) => this.emit("close", ...args));
		this.socket.once("error", (...args) => this.emit("error", ...args));
		this.socket.on("message", (...args) => this.emit("message", ...args));
		
		this.socket.once("close", () => {
			this.tid = setTimeout(() => {
				if ( !this._reconnect ) {return;}
				
				this.emit("reconnect");
				this._socketNew();
			}, this.options.reconnect_timeinterval);
		});
	}
	
	isOpened(...args) {return this.socket.isOpened(...args);}
	isClosed(...args) {return this.socket.isClosed(...args);}
	send(...args) {return this.socket.send(...args);}
	close() {
		this._reconnect = false;
		
		if ( !this.isClosed() ) {
			this.socket.close();
		}
	}
	open() {
		if ( !this.isClosed() ) {
			throw new Error("Socket already opened");
		}
		
		(this.tid !== null) && clearTimeout(this.tid);
		this.tid = null;
			
		this._socketNew();
	}

	reconnect() {
		if ( this.isClosed() ) {
			throw new Error("Socket already closed");
		}
		
		this.socket.once("close", () => {
			this.open();
		});
		
		this.socket.close();
	}
}

module.exports = WebSocketClientReconnect;
