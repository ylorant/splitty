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

// Binders
Actions.bind_element_action = function(el)
{
	var callback = el.dataset.action;
	if(this[callback])
		el.addEventListener('click', this[callback].bind(this, el));
}

Actions.bind_element_page = function(el)
	{
		var destination = el.dataset.page;
		el.addEventListener('click', this.load_page.bind(this, destination));
	}

// Sets events and triggers on buttons
Actions.prototype.init = function()
{	
	$("[data-action]").each(Actions.bind_element_action, this);
	$("[data-page]").each(Actions.bind_element_page, this);
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

Actions.prototype.load_timer = function(timer)
{
	window.current_timer = timer;
	
	//Setting timer title
	$("#run-title").text(timer.run_name);
	$("#run-count").text(timer.run_count);
}

// Registered actions, linked to buttons and everything, so-called "controllers"

Actions.prototype.open_timer_file = function()
{

}

Actions.prototype.create_timer = function()
{
	var new_timer = new Timer();
}

Actions.prototype.edit_timer_add_split = function()
{
	var split_template = $("#edit-timer-split-template").clone();
	split_template.removeClass("hidden");
	
	$("#form-edit-timer-split-list .timer-split:last-of-type").after(split_template);
	
	$(".timer-split:last-of-type [data-action]").each(Actions.bind_element_action, this);
}

Actions.prototype.edit_timer_remove_split = function(el)
{
	var parent = $(el).parents(".timer-split");
	$(parent[0]).remove();
}

Actions.prototype.edit_timer_move_up = function(el)
{
	var parent = $(el).parents(".timer-split");
	var previous_sibling = parent[0].previousSibling;
}

Actions.prototype.edit_timer_submit = function()
{
	var new_timer = null;
	
	if(window.current_timer)
		new_timer = window.current_timer;
	else
		new_timer = new Timer();
	
	new_timer.run_name = q("#form-edit-timer-name").value;
	
	$("#form-edit-timer-split-list .timer-split").each(function(el)
	{
		if(!$(el).is(".hidden"))
		{
			var split_name = el.q(".split-name").value;
			var split_reference = el.q(".split-reference").value;
			if (split_reference.length > 0)
			{
				//Parsing PB time
				var pb_str = split_reference.split(':');
				var pb = 0;
				var multiplier = 1000;
				
				//Take account of milliseconds
				if(pb_str[pb_str.length - 1].indexOf('.') != -1)
				{
					var ms = pb_str[pb_str.length - 1].split('.');
					pb_str[pb_str.length - 1] = ms[0];
					pb += parseInt(ms[1] + "000".substring(0, 3 - ms[1].length));
				}
				
				for(var i = pb_str.length - 1; i >= 0; i--)
				{
					pb += parseInt(pb_str[i]) * multiplier;
					multiplier *= 60;
				}
			}
				
			//Creating the split
			if(split_name.length > 0)
				new_timer.splits.push({ name: split_name, pb_split: pb, split_best: -1 });
		}
	});
	
	this.load_timer(new_timer);
}