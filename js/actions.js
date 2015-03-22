function Actions()
{
	Actions.instance = this;
	this.updates = [];
	this.interval_id = 0;
	this.key_down = false;
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
	
	$(document).on("keydown", this.handle_keydown.bind(this));
	$(document).on("keyup", this.handle_keyup.bind(this));
	
	var table_pos = $("#timer-splits-container")[0].getBoundingClientRect();
    var drag_handle_evt = function(event)
    {
        var height = Math.max(table_pos.height, event.y - (table_pos.top + document.body.scrollTop));
        $("#timer-splits-container").css("height", height + "px" );
        
        this.save_handle_position();
    };
    
    // Split size handle
    $("#timer-split-handle").on("mousedown",(function(e)
    {
        $(document).on("mousemove", drag_handle_evt.bind(this));
        e.preventDefault();
    }).bind(this));
    
    $(document).on("mouseup", (function()
    {
        $(document).off("mousemove", drag_handle_evt.bind(this));
    }).bind(this));
	
	//Initializing timer list if it isn't already done
	if(typeof localStorage.timer_names == "undefined" || typeof JSON.parse(localStorage.timer_names).pop == "undefined")
		localStorage.timer_names = "[]";
	
	this.refresh_timer_list();
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
	
		if(rel_split && rel_split > 0)
		{
			var rel_human = msec_to_time(rel_split, 1);
			var rel_str = rel_split > 0 ? "+" : "-";

			if(rel_human.hr > 0)
				rel_str += rel_human.hr + ":" + (rel_human.mn < 10 ? "0" : "");
			if(rel_human.mn > 0)
				rel_str += rel_human.mn + ":" + (rel_human.sec < 10 ? "0" : "") + rel_human.sec;
			else
				rel_str += rel_human.sec + "." + "<small>" + rel_human.ms + "</small>";

			$($("#timer-splits tr")[window.current_run.current_split].querySelector(".time")).html(rel_str);
		}
		
		if(set_split_time)
			$($("#timer-splits tr")[window.current_run.current_split].querySelector(".ref")).html(msec_to_string(window.current_run.elapsed, true, 0));
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

Actions.prototype.get_page = function()
{
	return $(".page.active").attr("id").substr(5);
}

Actions.prototype.load_timer = function(timer)
{
	window.current_timer = timer;
	
	//Setting timer title
	$("#run-title").text(timer.run_name);
	$("#run-count").text(timer.run_count);
	
	//Setting global time
	$("#global-timer").html("0.<small>0</small>");
	
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

Actions.prototype.refresh_timer_list = function()
{
	if(typeof localStorage != "undefined")
	{
		$("#form-load-timer-timer-name option").remove();
		
		var new_line = document.createElement("option");
		new_line.value = "";
		new_line.innerHTML = "---";
		
		q("#form-load-timer-timer-name").appendChild(new_line);
		
		var names = JSON.parse(localStorage.timer_names);
		for(var k in names)
		{
			var option = $(new_line).clone();
			option[0].value = names[k];
			option.text(names[k]);
			
			$("#form-load-timer-timer-name").append(option);	
		}
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
	
	if(q("#form-edit-timer-type-rta").checked == true)
		new_timer.timer_type = Timer.Type.RTA;
	else if(q("#form-edit-timer-type-manual").checked == true)
		new_timer.timer_type = Timer.Type.MANUAL;
	
	$("#form-edit-timer-split-list .timer-split").each(function(el)
	{
		if(!$(el).is(".hidden"))
		{
			var split_name = el.q(".split-name").value;
			var split_reference = el.q(".split-reference").value;
			var pb = null;
			
			//Parsing PB time
			if (split_reference.length > 0)
				pb = string_to_msec(split_reference);
				
			//Creating the split
			if(split_name.length > 0)
				new_timer.splits.push({ name: split_name, pb_split: pb, split_best: -1 });
		}
	});
	
	if(new_timer.splits.length == 0)
	{
		alert("You have to create at least one split in the timer to be able to save it.");
		return false;
	}
	
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

Actions.prototype.handle_keydown = function(ev)
{
	if(!this.key_down)
	{
		if(this.get_page() == "timer-control")
		{
			switch(ev.keyCode)
			{
				case 32: //Space : start/split
					this.timer_start_split();
					break;
				case 40: // Down : skip
				    this.timer_split_skip();
				    break;
				case 38: // Up : go back
				    break;
				case 8: // Backspace, stop/reset
				    this.timer_stop_reset();
				    break;
			}
		}
	}
	
	//If we're on timer control, we prevent browser action for backspace
	if(ev.keyCode == 8 && this.get_page() == "timer-control")
		ev.preventDefault();
}

Actions.prototype.handle_keyup = function(ev)
{
	this.key_down = false;
}

Actions.prototype.timer_start_split = function()
{
	if(window.current_run && window.current_run.started) // A timer run is already started, we split
	{
		if(window.current_timer.timer_type == Timer.Type.RTA)
		{
			$("#timer-splits tr")[window.current_run.current_split].classList.remove("current");
			window.current_run.split();
		}
		else if(window.current_timer.timer_type == Timer.Type.MANUAL)
		{
			var split_time = prompt('Time for split "' + window.current_timer.splits[window.current_run.current_split].name + '"');
			
			if(split_time)
				window.current_run.split_manual(string_to_msec(split_time));
		}
	}
	else // No timer run has been started, we create and start one
	{
		if(window.current_timer)
		{
			this.load_timer(window.current_timer);
			window.current_run = new Run(window.current_timer);
			window.current_run.start();
			
			$("#run-count").text(window.current_timer.run_count);
			
			$("#control-button-play span").text("Split");
			$("#control-button-play i").removeClass("glyphicon-play").addClass("glyphicon-ok");
			
			$("#control-button-reset span").text("Stop");
			$("#control-button-reset i").removeClass("glyphicon-refresh").addClass("glyphicon-stop");
		}
		
		$("#control-button-skip").removeClass("disabled");
		$("#control-button-back").removeClass("disabled");
	}
	
	if(window.current_run.started)
		$("#timer-splits tr")[window.current_run.current_split].classList.add("current");
	else
	{
		$("#control-button-play span").text("Start");
		$("#control-button-play i").removeClass("glyphicon-ok").removeClass("glyphicon-stop").addClass("glyphicon-play");
		$("#control-button-reset span").text("Reset");
		$("#control-button-reset i").removeClass("glyphicon-stop").addClass("glyphicon-refresh");
	}
	
	if(window.current_run.current_split + 1 == window.current_timer.splits.length)
	{
		$("#control-button-play span").text("Stop");
		$("#control-button-play i").removeClass("glyphicon-play").addClass("glyphicon-stop");
	}
}

Actions.prototype.timer_split_skip = function()
{
	if(window.current_run && window.current_run.started)
	{
		$("#timer-splits tr")[window.current_run.current_split].classList.remove("current");
		$($("#timer-splits tr")[window.current_run.current_split].querySelector(".time")).html("-");
		$($("#timer-splits tr")[window.current_run.current_split].querySelector(".ref")).html("-");
		window.current_run.next_split();
	
		if(window.current_run.started)
			$("#timer-splits tr")[window.current_run.current_split].classList.add("current");
		
		if(window.current_run.current_split + 1 == window.current_timer.splits.length)
		{
			$("#control-button-play span").text("Stop");
			$("#control-button-play i").removeClass("glyphicon-play").addClass("glyphicon-stop");
		}
	}
}

Actions.prototype.timer_stop_reset = function()
{
	if(window.current_run.started)
	{
		this.update();
		window.current_run.stop();
		$("#control-button-reset span").text("Reset");
		$("#control-button-reset i").removeClass("glyphicon-stop").addClass("glyphicon-refresh");
		$("#control-button-play span").text("Restart");
		$("#control-button-play i").removeClass("glyphicon-ok").removeClass("glyphicon-stop").addClass("glyphicon-play");
	}
	else
	{
		window.current_run = null;
		this.load_timer(window.current_timer);
		$("#control-button-play span").text("Start");
	}
}

Actions.prototype.timer_save_splits = function()
{
	window.current_timer.save_splits(window.current_run);
}

Actions.prototype.load_timer_submit = function()
{
	var select = q("#form-load-timer-timer-name");
	var selected_timer = select.options[select.selectedIndex].value;
	
	if(typeof localStorage != "undefined")
	{
		var timer_names = JSON.parse(localStorage.timer_names);
		
		if(timer_names.indexOf(selected_timer) != -1)
		{
			var timer = Timer.load(selected_timer);
			this.load_timer(timer);
			this.load_page('timer-control');
		}
	}
}

Actions.prototype.timer_edit_timer = function()
{
	
}