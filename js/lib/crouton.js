function Crouton(type, message, duration)
{
	this.type = type;
	this.message = message;
	this.timeout = null;
	this.element = null;
	this.duration = 5000;
	
	if(duration != null)
		this.duration = duration;
}

CroutonType =
{
	CONFIRM: 1,
	ERROR: 2,
	INFO: 3
};

Crouton.DEFAULT_ELEMENT = 'body';

Crouton.prototype.show = function(element)
{
	//If element has not been set (then it's a custom notification) we create it
	if(!this.element)
	{
		this.element = document.createElement('div');
		this.element = $(this.element).html(this.message);
	}
		
	this.element.addClass('crouton-notification')
				.addClass('closed')
				.on('click', Crouton.prototype.dismiss.bind(this));
	
	switch(this.type)
	{
		case CroutonType.CONFIRM:
			this.element.addClass('crouton-confirm');
			break;
		case CroutonType.ERROR:
			this.element.addClass('crouton-error');
			break;
		case CroutonType.INFO:
			this.element.addClass('crouton-info');
			break;
	}
	
	if(!element)
		element = Crouton.DEFAULT_ELEMENT;
	
	$(element).append(this.element);
	setTimeout(function()
	{
		this.element.removeClass("closed");
	}.bind(this), 50);
	
	this.timeout = setTimeout(Crouton.prototype.dismiss.bind(this), this.duration);
}

Crouton.prototype.dismiss = function()
{
	if(this.timeout != null)
		clearTimeout(this.timeout);
	
	this.element.addClass("closed");
	setTimeout(function()
	{
		this.element.remove();
	}.bind(this), 500);
}

//Shortcut method to show quickly a notification
Crouton.notify = function(type, message, duration)
{
	var notif_type = CroutonType.INFO,
		notif_message = "",
		notif_duration = 5000;
	
	//Check if we got only the message
	if(typeof type == "string")
	{
		notif_message = type;
		if(message != null) // A duration has been entered
			notif_duration = message;
	}
	else
	{
		notif_type = type;
		notif_message = message;
		notif_duration = duration;
	}
	
	var notif = new Crouton(notif_type, notif_message, notif_duration);
	notif.show();
}