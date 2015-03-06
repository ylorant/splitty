function Actions()
{
	Actions.instance = this;
	this.updates = [];
	this.interval_id = 0;
}

// Singleton implementation
Actions.instance = null;
Actions.get_manager = function()
{
	return Actions.instance;
}

//Sets events and triggers on buttons
Actions.prototype.init = function()
{
	$("[data-action]").each(function(el)
	{
		var callback = el.dataset.action;
		if(this[callback])
			el.addEventListener('click', this[callback].bind(this, el));
	}, this);

	$("[data-page]").each(function(el)
	{
		var destination = el.dataset.page;
		el.addEventListener('click', this.load_page.bind(this, destination));
	},this);
}

// Allows a child object to register for periodic timer updates
Actions.prototype.register_updates = function(object)
{
	if(this.updates.indexOf(object) == -1)
		return false;
	
	this.updates.push(object);

	if(this.updates.length == 1)
		this.interval_id = setInterval(this.update.bind(this), 80);

	return true;
}

Actions.prototype.unregister_updates = function(object)
{
	var index = this.updates.indexOf(object);

	if(index == -1)
		return false;

	this.updates.splice(index, 1);

	if(this.updates.length == 0)
		clearInterval(this.interval_id);

	return true;
}

Actions.prototype.update = function()
{
	for(var update in this.updates)
		update.update();
}

Actions.prototype.load_page = function(page)
{
	var selector = "#page-" + page;
	if($(selector))
	{
		$(".page").removeClass("active");
		$(selector).addClass("active");
	}
}

// Registered actions, linked to buttons and everything, so-called "controllers"

Actions.prototype.open_timer = function()
{

}

Actions.prototype.create_timer = function()
{
	var new_timer = new Timer();
}

Actions.prototype.new_timer_add_split = function()
{
	var split_template = $("#new-timer-split-template");
}