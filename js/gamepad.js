function Gamepad()
{
	this.connected_gamepads = [];
	this.current_gamepad_id = null;
	this.current_gamepad = null;
	this.previous_gamepad_status = null;
	this.poll_interval_id = null;
	this.events = new EventListener();
	this.do_poll = false;
	
	// Start global polling for new gamepads, 4 per second
	setInterval(this.poll_new_gamepads.bind(this), 250);
}

Gamepad.prototype.scan_gamepads = function()
{
	var gamepads = navigator.getGamepads();
	var connectedGamepads = [];
	
	for(var i in gamepads)
	{
		if(gamepads[i] && gamepads[i].connected)
			connectedGamepads.push(gamepads[i]);
	}
	
	return connectedGamepads;
}

Gamepad.prototype.set_gamepad = function(gamepad_id)
{
	this.current_gamepad_status = null;
	this.current_gamepad_id = gamepad_id;
	
	if(this.connected_gamepads.indexOf(gamepad_id) != -1)
		this.poll_new_gamepads(); // Polling new gamepads will load the selected gamepad into this.current_gamepad
	else
		this.current_gamepad = null; // Gamepad is disconnected, disable it 
}

Gamepad.prototype.poll_new_gamepads = function()
{
	var gamepads = this.scan_gamepads();
	
	//// Polling for new/disconnected gamepads ////
	
	// Generating gamepad ids table and checking changes compared to the already saved one
	var connected_gamepads = [];
	var gamepads_connected = [];
	var gamepads_disconnected = [];
	for(var i in gamepads)
	{
		connected_gamepads.push(gamepads[i].id);
		
		// Gamepad has been connected
		if(this.connected_gamepads.indexOf(gamepads[i].id) == -1)
			gamepads_connected.push(gamepads[i].id);
		
		if(gamepads[i].id == this.current_gamepad_id)
			this.current_gamepad = gamepads[i];
	}
	
	// Checking previous gamepads to see if one has been disconnected
	for(var i in this.connected_gamepads)
	{
		if(connected_gamepads.indexOf(this.connected_gamepads[i]) == -1)
			gamepads_disconnected.push(this.connected_gamepads[i]);
	}
	
	this.connected_gamepads = connected_gamepads;
	
	for(var i in gamepads_connected)
		this.events.trigger('gamepadconnected', gamepads_connected[i]);
	
	for(var i in gamepads_disconnected)
		this.events.trigger('gamepaddisconnected', gamepads_disconnected[i]);
}


//// Polling selected gamepad for button changes ////
Gamepad.prototype.poll_gamepad_buttons = function()
{
	if(this.do_poll)
		window.requestAnimationFrame(this.poll_gamepad_buttons.bind(this));

	if(this.current_gamepad != null)
	{
		// Force gamepad updates, for Chrome :(
		if(window.chrome)
			navigator.getGamepads();
		
		// Perform checks only if we have a previous status
		if(this.current_gamepad_status != null && this.current_gamepad.timestamp != this.current_gamepad_status.timestamp)
		{
			// Checking axes
			for(var i in this.current_gamepad.axes)
			{
				if(this.current_gamepad_status.axes[i] != this.current_gamepad.axes[i])
				{
					this.current_gamepad_status.axes[i] = this.current_gamepad.axes[i];
					this.events.trigger('axischanged', i, this.current_gamepad.axes[i]);
				}
			}
			
			for(var i in this.current_gamepad.buttons)
			{
				if(this.current_gamepad.buttons[i].pressed != this.current_gamepad_status.buttons[i])
				{
					this.current_gamepad_status.buttons[i] = this.current_gamepad.buttons[i].pressed;
					var ev = this.current_gamepad.buttons[i].pressed ? "buttonpressed" : "buttonreleased";
					this.events.trigger(ev, i, this.current_gamepad.buttons[i]);
				}
			}
			
			this.current_gamepad_status.timestamp = this.current_gamepad.timestamp;
		}
		else if(this.current_gamepad_status == null)
		{
			this.current_gamepad_status = {axes: [], buttons: [], timestamp: null};
			for(var i in this.current_gamepad.axes)
				this.current_gamepad_status.axes.push(0);
			
			for(var i in this.current_gamepad.buttons)
				this.current_gamepad_status.buttons.push(false);
			
			if(this.current_gamepad.timestamp)
				this.current_gamepad_status.timestamp = this.current_gamepad.timestamp;
		}
	}
}

Gamepad.prototype.start_polling = function()
{
	this.current_gamepad_status = null;
	
	// Poll on animation frame, usually gives 60Hz
	this.do_poll = true;
	window.requestAnimationFrame(this.poll_gamepad_buttons.bind(this));
	console.log("Starting polling");
}

Gamepad.prototype.stop_polling = function()
{
	this.do_poll = false;
}

Gamepad.get_name_from_id = function(gamepad_id)
{
	var id_name = gamepad_id;
	
	// Firefox format match
	if(/^[0-9a-f]{4}-[0-9a-f]{4}-.+$/.test(gamepad_id))
	{
		var id_parts = gamepad_id.split('-');
	
		id_parts.shift();
		id_parts.shift();
		id_name = id_parts.join('-');
	}
	
	return id_name;
}