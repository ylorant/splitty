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
	if(this.updates.indexOf(object) != -1)
		return false;
	
	this.updates.push(object);

	if(this.updates.length == 1)
		this.interval_id = setInterval(this.update.bind(this), 50);

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

Actions.prototype.update = function(set_split_time)
{
	set_split_time = typeof set_split_time != "undefined" ? set_split_time : false;
	
	for(var update in this.updates)
		this.updates[update].update();
	
	//Update the gui here
	if(window.current_run)
	{
		var rel_split = null;
		if(window.current_timer.splits[window.current_run.current_split].pb_split)
			rel_split = window.current_run.elapsed - window.current_timer.splits[window.current_run.current_split].pb_split;
		
		$("#global-time").html(window.current_run.get_time(true, 1));
	
		if(rel_split)
		{
			var rel_human = msec_to_time(rel_split, 1);
			var rel_str = rel_split > 0 ? "+" : "-";

			if(rel_human.hr > 0)
				rel_str += rel_human.hr + ":" + (rel_human.mn < 10 ? "0" : "");
			if(rel_human.mn > 0)
				rel_str += rel_human.mn + ":" + (rel_human.sec < 10 ? "0" : "") + rel_human.sec;
			else
				rel_str += rel_human.sec + ":" + rel_human.ms;

			$($("#timer-splits tr")[window.current_run.current_split].querySelector(".time")).html(rel_str);
		}
		
		if(set_split_time)
		{
			var res = 1;
			if(window.current_run.elapsed > 60000)
				res = 0;
			
			$($("#timer-splits tr")[window.current_run.current_split].querySelector(".ref")).html(msec_to_string(window.current_run.elapsed, true, res));
		}
	}
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
	
	$("#timer-splits tr").remove();
	for(var i in timer.splits)
	{
		var new_line = document.createElement("tr");
		var new_cell_name = document.createElement("td");
		var new_cell_time = document.createElement("td");
		var new_cell_ref = document.createElement("td");

		new_cell_name.innerHTML = timer.splits[i].name;
		new_cell_time.classList.add("time");
		new_cell_ref.classList.add("ref");
		
		if(timer.splits[i].pb_split)
		{
			var htime = msec_to_string(timer.splits[i].pb_split, false, 0);
			new_cell_ref.innerHTML = htime;
		}
		else
			new_cell_ref.innerHTML = "-";

		new_line.appendChild(new_cell_name);
		new_line.appendChild(new_cell_time);
		new_line.appendChild(new_cell_ref);
		
		$("#timer-splits").append($(new_line));
	}
}

// Registered actions, linked to buttons and everything, so-called "controllers"

Actions.prototype.open_timer_file = function()
{

}

Actions.prototype.edit_timer_add_split = function()
{
	var split_template = $("#edit-timer-split-template").clone();
	split_template.removeClass("hidden");
	split_template.removeAttr("id");
	
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
	
	if(!$(previous_sibling).is("#edit-timer-split-template"))
		$(previous_sibling).before(parent);
}

Actions.prototype.edit_timer_move_down = function(el)
{
	var parent = $(el).parents(".timer-split");
	var next_sibling = parent[0].nextSibling;
	
	if($(next_sibling).is('.timer-split'))
		$(next_sibling).after(parent);
}

Actions.prototype.edit_timer_submit = function()
{
	var new_timer = null;
	
	if(window.current_timer)
		new_timer = window.current_timer;
	else
		new_timer = new Timer();
	
	new_timer.timer_name = q("#form-edit-timer-name").value;
	new_timer.run_name = q("#form-edit-game-name").value;
	
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
	
	new_timer.save();
	this.load_timer(new_timer);
	this.load_page('timer-control');
}

Actions.prototype.edit_timer_cancel = function()
{

	var confirmation = confirm("Stop editing ? Unsaved changes will be lost !");
	if(confirmation)
	{
		$("#edit-timer-form input").each(function(el)
		{
			el.value = "";
		});
		
		$("#edit-timer-form .timer-split").each(function(el)
		{
			if(!$(el).is("#edit-timer-split-template"))
			{
				$(el).remove();
			}
		})
		
		this.edit_timer_add_split();
		
		this.load_page("main-menu");
	}
}

Actions.prototype.timer_start_split = function()
{
	if(window.current_run) // A timer run is already started, we split
	{
		$("#timer-splits tr")[window.current_run.current_split].classList.remove("current");
		window.current_run.split();
	}
	else // No timer run has been started, we create and start one
	{
		if(window.current_timer)
		{
			window.current_run = new Run(window.current_timer);
			window.current_run.start();
			
			$("#control-button-play span").text("Split");
			$("#control-button-play i").removeClass("glyphicon-play").addClass("glyphicon-ok");
		}
	}
	
	if(window.current_run.started)
		$("#timer-splits tr")[window.current_run.current_split].classList.add("current");
	
	if(window.current_run.current_split + 1 == window.current_timer.splits.length)
	{
		$("#control-button-play span").text("Stop");
		$("#control-button-play i").removeClass("glyphicon-play").addClass("glyphicon-stop");
	}
}

Actions.prototype.timer_split_skip = function()
{
	$("#timer-splits tr")[window.current_run.current_split].classList.remove("current");
	window.current_run.next_split();
	$("#timer-splits tr")[window.current_run.current_split].classList.add("current");
}