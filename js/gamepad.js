function Gamepad()
{
	this.gamepad = null;
	this.config = null;
	
	window.addEventListener("gamepadconnected", this.on_gamepad_connected.bind(this));
	window.addEventListener("gamepaddisconnected", this.on_gamepad_disconnected.bind(this));
	
	// Doing initial gamepad scan to see if there is one already connected
	this.scan_gamepads();
}

Gamepad.prototype.load_config = function()
{
	
}

Gamepad.prototype.scan_gamepads = function()
{
	var gamepads = navigator.getGamepads();
	
	for(var i in gamepads)
	{
		if(gamepads[i] && gamepads[i].connected)
		{
			this.gamepad = gamepads[i];
			Crouton.notify("Gamepad detected: " + this.gamepad.id);	
		}
	}
}

Gamepad.prototype.on_gamepad_connected = function(e)
{
	this.gamepad = e.gamepad;
	Crouton.notify("Gamepad connected: " + e.gamepad.id);
}

Gamepad.prototype.on_gamepad_disconnected = function(e)
{
	// If the gamepad being disconnected is ours, we free the resources to it
	if(this.gamepad != null && this.gamepad.index == e.gamepad.index)
	{
		this.gamepad = null;
		Crouton.notify("Gamepad disconnected: " + e.gamepad.id);
	}
}