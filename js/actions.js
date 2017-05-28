function Actions()
{
	Actions.instance = this;
	this.updates = [];
	this.key_down = false;
	this.table_pos = null;
	this.split_scroll_status = 0;
	
	// Temporary settings when editing them
	this.current_settings = null;
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
	{
		var event = 'click';
		
		// Special events on actions for some element types
		switch(el.tagName.toLowerCase())
		{
			case 'select':
				event = 'change';
				break;
		}
		
		// Binding the event
		el.addEventListener(event, this[callback].bind(this, el));
	}
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
	
	this.table_pos = q("#timer-splits-container").getBoundingClientRect();
    var drag_handle_evt = (function(event)
    {
    	var y = typeof(event.y) == "undefined" ? event.clientY : event.y;
    	
        var height = Math.max(this.table_pos.height, y - (this.table_pos.top + document.body.scrollTop));
        $("#timer-splits-container").css("height", height + "px" );
        
        this.save_handle_position(height);
    }).bind(this);
    
    // Split size handle
    $("#timer-split-handle").on("mousedown",(function(e)
    {
        $(document).on("mousemove", drag_handle_evt);
        e.preventDefault();
    }).bind(this));
    
    $(document).on("mouseup", (function()
    {
        $(document).off("mousemove", drag_handle_evt);
    }).bind(this));
	
	$("#timer-split-handle").on("dblclick",(function(ev)
	{
		var auto_height = q("#timer-splits").clientHeight;
		$("#timer-splits-container").css("height", auto_height + "px");
		this.save_handle_position(auto_height);
	}).bind(this));
	
	//Initializing split zone height
	this.load_handle_position();
	
	//Initializing scroll
	var wheel_event = "onwheel" in document.createElement("div") ? "wheel" :  // Modern browsers support "wheel"
 						document.onmousewheel !== undefined ? "mousewheel" :  // Webkit and IE support at least "mousewheel"
    														"DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
	
	$("#timer-splits-container").on(wheel_event, this.on_scroll_splits.bind(this));
	
	//Load the gamepad manager
    this.gamepad = new Gamepad();
    this.gamepad.events.on('gamepadconnected', this.update_gamepads.bind(this));
    this.gamepad.events.on('gamepaddisconnected', this.update_gamepads.bind(this));
    this.gamepad.events.on('buttonpressed', this.handle_gamepad_press.bind(this));
    this.gamepad.events.on('buttonpressed', this.settings_gamepad_handle_press.bind(this));
    
	// Listen for gamepad button presses for splitting and things only when the page is on timer control	
	$(document).on('pagechanged', function()
	{
		if(this.get_page() == "timer-control" && this.current_settings["use_gamepad"] === true)
			this.gamepad.start_polling();
		else
			this.gamepad.stop_polling();
	}.bind(this));
	
	this.refresh_timer_list();
	this.refresh_settings();
}

Actions.prototype.on_scroll_splits = function(ev)
{
	var top = parseInt($("#timer-splits").css('top')) || 0;
	
	var current_split_height = $("#timer-splits tr")[this.split_scroll_status].clientHeight;
	
	if(ev.deltaY < 0 && this.split_scroll_status > 0)
		this.split_scroll_status--;
	else if(ev.deltaY > 0 && this.split_scroll_status < $("#timer-splits tr").length - 1)
		this.split_scroll_status++;
	
	$("#timer-splits").css('top', "-" + $("#timer-splits tr")[this.split_scroll_status].offsetTop + 'px');
	
	if(this.split_scroll_status == 0)
		$("#timer-splits").css('top', "0px");
	
	ev.preventDefault();
}

Actions.prototype.save_handle_position = function(new_height)
{
	if(Storage.enabled())
	{
		this.current_settings['handle_position'] = new_height;
		Storage.get().set_settings_property('handle_position', new_height);
	}
}

Actions.prototype.load_handle_position = function()
{
	if(Storage.enabled())
	{
		var handle_position = Storage.get().get_settings_property('handle_position');
		
		if(handle_position)
			$("#timer-splits-container").css("height", handle_position + "px" );
	}
}

// Allows a child object to register for periodic timer updates
Actions.prototype.register_updates = function(object)
{
	if(this.updates.indexOf(object) != -1)
		return false;
	
	this.updates.push(object);
	
	// Start the animationFrame loop if this is the first object we register updates for
	if(this.updates.length == 1)
		window.requestAnimationFrame(this.update.bind(this));

	return true;
}

Actions.prototype.unregister_updates = function(object)
{
	var index = this.updates.indexOf(object);

	if(index == -1)
		return false;

	this.updates.splice(index, 1);
	
	return true;
}

Actions.prototype.update = function(elapsed, set_split_time)
{
	set_split_time = typeof set_split_time != "undefined" ? set_split_time : false;
	
	if(this.updates.length > 0)
		window.requestAnimationFrame(this.update.bind(this));
	else if(elapsed) // Allow manual calls, having elapsed at null, to continue
		return;
	
	for(var update in this.updates)
		this.updates[update].update();
	
	//Update the gui here
	if(window.current_run)
	{
		var rel_split = null;
		if(window.current_timer.splits[window.current_run.current_split].pb_split)
			rel_split = window.current_run.elapsed - window.current_timer.splits[window.current_run.current_split].pb_split;
		
		final_time = !window.current_run.started; // Are we showing the final time or not
		$("#global-time").html(window.current_run.get_time(true, final_time));
	
		if(rel_split && (rel_split > 0 || set_split_time))
		{
			var el = $($("#timer-splits tr")[window.current_run.current_split].querySelector(".time"));
			el.html(msec_to_string(rel_split, true, 1, true));
		}
		
		if(set_split_time)
		{
			var el = $($("#timer-splits tr")[window.current_run.current_split].querySelector(".time"));
			$($("#timer-splits tr")[window.current_run.current_split].querySelector(".ref")).html(msec_to_string(window.current_run.elapsed, true, 0));
			
			var difference = window.current_run.split_times[window.current_run.current_split] - window.current_timer.splits[window.current_run.current_split].pb_duration;
			
			if(window.current_run.current_split > 0)
				difference -= window.current_run.split_times[window.current_run.current_split - 1];
			
			
			var split_time = window.current_run.split_times[window.current_run.current_split];
			if(window.current_run.current_split > 0)
				split_time -= window.current_run.split_times[window.current_run.current_split - 1];
			
			var classes = "";
			
			var classes = "time";
			if(rel_split > 0)
				classes += " late";
			else if(rel_split < 0)
				classes += " ahead";
			
			if(window.current_timer.splits[window.current_run.current_split].split_best == null || split_time < window.current_timer.splits[window.current_run.current_split].split_best)
				classes = "time split-gold";
			else if(split_time < window.current_timer.splits[window.current_run.current_split].pb_duration)
				classes += " split-ahead";
			else
				classes += " split-late";
			
			var rel_human = msec_to_time(difference, 1);
			var rel_str = "";
			
			if(window.current_timer.splits[window.current_run.current_split].pb_duration != null)
				rel_str = difference > 0 ? "+" : "-";
			
			if(rel_human.hr > 0)
				rel_str += rel_human.hr + ":" + (rel_human.mn < 10 ? "0" : "");
			if(rel_human.mn > 0)
				rel_str += rel_human.mn + ":" + (rel_human.sec < 10 ? "0" : "") + rel_human.sec;
			else
				rel_str += rel_human.sec + "." + "<small>" + rel_human.ms + "</small>";
			
			el[0].className = classes;
			q("#previous-segment").className = classes;
			$("#previous-segment").html(rel_str);
		}
	}
}

Actions.prototype.update_sob = function()
{
	var sum_of_bests = 0;
	
	console.log("Refreshing Sum of Bests");
	for(var i in window.current_timer.splits)
	{
		var best_split = window.current_timer.splits[i].split_best;
		if(window.current_run)
			best_split = window.current_run.best_splits[i];
		
		console.log("Split '" + window.current_timer.splits[i].name + "': " + best_split);
		if(sum_of_bests != null && best_split)
			sum_of_bests += best_split;
		else
			sum_of_bests = null;
	}
	
	if(sum_of_bests != null)
		$("#sum-of-bests").html(msec_to_string(sum_of_bests));
	else
		$("#sum-of-bests").html("-");
}

Actions.prototype.load_page = function(page)
{
	var selector = "#page-" + page;
	if($(selector))
	{
		$(".page").removeClass("active");
		$(selector).addClass("active");
		$(document).trigger('pagechanged', page);
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
	$("#global-time").html(msec_to_string(-1 * timer.start_delay, true, 1));
	
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
		
		//Export button
		$("#control-button-export").attr('href', 'data:text/plain;charset=utf8,' + encodeURIComponent(timer.to_string()));
		$("#control-button-export").attr('download', timer.run_name.replace('/', '-') + ".json");
	}
	
	this.update_sob();
}

Actions.prototype.load_empty_timer = function()
{
	$("#run-title").text("-");
	$("#run-count").text("0");
	
	//Setting global time
	$("#global-time").html("0:00.<small>0</small>");
	
	$("#timer-splits tr").remove();
	
	var new_line = document.createElement("tr");
	var new_cell_name = document.createElement("td");
	var new_cell_time = document.createElement("td");
	var new_cell_ref = document.createElement("td");

	new_cell_name.innerHTML = "-";
	new_cell_time.innerHTML = "";
	new_cell_ref.innerHTML = "-";
	new_cell_time.classList.add("time");
	new_cell_ref.classList.add("ref");
	
	new_line.appendChild(new_cell_name);
	new_line.appendChild(new_cell_time);
	new_line.appendChild(new_cell_ref);
	
	$("#timer-splits").append($(new_line));
}

Actions.prototype.refresh_timer_list = function()
{
	if(Storage.enabled())
	{
		$("#form-load-timer-timer-name option").remove();
		
		var new_line = document.createElement("option");
		new_line.value = "";
		new_line.innerHTML = "---";
		
		q("#form-load-timer-timer-name").appendChild(new_line);
		
		var names = Storage.get().get_names();
		for(var k in names)
		{
			var option = $(new_line).clone();
			option[0].value = k;
			option.text(names[k]);
			
			$("#form-load-timer-timer-name").append(option);	
		}
	}
}

Actions.prototype.reset_timer_edit_form = function()
{
	//Emptying all global info
	if(window.current_timer != null)
	{
		$("#form-edit-timer-name").val(window.current_timer.timer_name);
		$("#form-edit-game-name").val(window.current_timer.run_name);
	}
	else
	{
		$("#form-edit-timer-name").val("");
		$("#form-edit-game-name").val("");
		$("#form-edit-start-delay").val("");
	}
	
	q("#form-edit-timer-type-manual").checked = false;
	q("#form-edit-timer-type-rta").checked = true;
	
	//Emptying splits
	var split_template = $("#edit-timer-split-template");
	$(".timer-split").remove();
	$("#form-edit-timer-split-list").prepend(split_template);
}

Actions.prototype.refresh_settings = function()
{
	// Default settings array
	var default_settings = {
		'handle_position':      0,
		'use_gamepad':          false,
		'gamepad_id':           null,
		'gamepad_button_split': null,
		'gamepad_button_reset':null
	};
	
	// Merging default settings and saved ones, the saved ones being primary
	var saved_settings = Storage.get().get_settings();
	this.current_settings = Object.assign(default_settings, saved_settings);
	
	if(this.current_settings['use_gamepad'])
		$("#settings-gamepad-use").attr('checked', true);
	
    this.gamepad.set_gamepad(this.current_settings.gamepad_id);
	
	this.update_gamepads();
}

Actions.prototype.update_gamepads = function(event, id)
{
	if(event) // Show message only if triggered from event
	{
		switch(event)
		{
			case 'gamepadconnected':
				Crouton.notify("Gamepad connected: " + Gamepad.get_name_from_id(id));
				break;
			case 'gamepaddisconnected':
				Crouton.notify(CroutonType.ERROR, "Gamepad disconnected: " + Gamepad.get_name_from_id(id));
				break;
		}
	}
	
	var gamepads = this.gamepad.connected_gamepads;
	var selected_gamepad_id = null;
	
	// Get currently selected gamepad and delete the list
	if(this.current_settings.gamepad_id)
		selected_gamepad_id = this.current_settings.gamepad_id;
	
	$("#settings-gamepad-id option").each(function(el)
	{
		q("#settings-gamepad-id").removeChild(el);
	});
	
	var default_option = document.createElement("option");
	default_option.setAttribute('value', "");
	default_option.innerHTML = "";
	q("#settings-gamepad-id").appendChild(default_option);
	
	for(var i in gamepads)
	{
		var pad = gamepads[i];
		var pad_name = Gamepad.get_name_from_id(pad);
		
		var option = document.createElement("option");
		option.setAttribute('value', pad);
		option.innerHTML = pad_name;
		option.selected = selected_gamepad_id === pad;
		q("#settings-gamepad-id").appendChild(option);
	}
	
	// If there's a gamepad selected, restore the buttons from the current settings
	var button_setting = null;
	$(".settings-gamepad-button").each(function(el)
	{
		if(q("#settings-gamepad-id option:checked").value)
			button_setting = "Button " + this.current_settings["gamepad_button_" + el.dataset.buttontype];
		else
			button_setting = "";
		el.value = button_setting;
	}.bind(this));
}

// Registered actions, linked to buttons and everything, so-called "controllers"

//// Timer edition ////

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
	
	// Check if editing timer or not
	if(window.current_timer)
	{
		new_timer = window.current_timer;
		new_timer.splits = []; // Empty splits to avoid duplication
	}
	else
		new_timer = new Timer();
	
	// If nothing has been entered as start delay, just set 0
	if(q("#form-edit-start-delay").value.length == 0)
		q("#form-edit-start-delay").value = "0";
	
	new_timer.timer_name = q("#form-edit-timer-name").value;
	new_timer.run_name = q("#form-edit-game-name").value;
	new_timer.start_delay = string_to_msec(q("#form-edit-start-delay").value);
	
	if(q("#form-edit-timer-type-rta").checked == true)
		new_timer.timer_type = Timer.Type.RTA;
	else if(q("#form-edit-timer-type-manual").checked == true)
		new_timer.timer_type = Timer.Type.MANUAL;
	
	var pb_elapsed = null;
	$("#form-edit-timer-split-list .timer-split").each(function(el)
	{
		if(!$(el).is(".hidden"))
		{
			var split_name = el.q(".split-name").value;
			var split_reference = el.q(".split-reference").value;
			var pb = null;
			var pb_duration = null;
			
			//Parsing PB time
			if (split_reference.length > 0)
			{
				pb = string_to_msec(split_reference);
				pb_duration = pb - pb_elapsed;
				pb_elapsed = pb;
			}
				
			//Creating the split
			if(split_name.length > 0)
				new_timer.splits.push({ name: split_name, pb_split: pb, pb_duration: pb_duration, split_best: pb_duration });
		}
	});
	
	if(new_timer.splits.length == 0)
	{
		alert("You have to create at least one split in the timer to be able to save it.");
		return false;
	}
	
	new_timer.save();
	this.refresh_timer_list();
	this.reset_timer_edit_form();
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
		
		if(!window.current_timer)
			this.load_page("main-menu");
		else
			this.load_page("timer-control");
	}
}

Actions.prototype.load_timer_submit = function()
{
	var select = q("#form-load-timer-timer-name");
	var selected_timer = select.options[select.selectedIndex].value;
	
	var timer = Timer.load(selected_timer);
	this.load_timer(timer);
	this.load_page('timer-control');
}

Actions.prototype.delete_timer = function()
{
	var select = q("#form-load-timer-timer-name");
	var selected_timer = select.options[select.selectedIndex].value;
	
	var confirm = window.confirm("Are you sure you want to delete this timer ?");
	
	if(confirm)
	{
		var timer = Timer.load(selected_timer);
		timer.delete();
		this.refresh_timer_list();
	}
	
	return false;
}

Actions.prototype.import_timer_submit = function()
{
	var file = q("#form-import-timer-file").files[0];
	if (window.File && window.FileReader && window.FileList && window.Blob)
	{
  		var r = new FileReader();
  		var that = this;
  		
  		r.onload = (function(e)
		{
			var contents = e.target.result;
			var timer = Timer.import_json(contents);
			this.load_timer(timer);
			this.timer_edit_timer();
		}).bind(this);
  		
  		r.readAsText(file);
  	}
}

//// Keybindings ////

Actions.prototype.handle_keydown = function(ev)
{
	if(!this.key_down)
	{
		if(this.get_page() == "timer-control")
		{
			switch(ev.keyCode)
			{
				case 32: //Space : start/split
					ev.preventDefault();
					this.timer_start_split();
					break;
				case 40: // Down : skip
				    this.timer_split_skip();
					ev.preventDefault();
				    break;
				case 38: // Up : go back
				    this.timer_split_prev();
					ev.preventDefault();
				    break;
				case 8: // Backspace, stop/reset
				    this.timer_stop_reset();
					ev.preventDefault();
				    break;
			}
		}
	}
}

Actions.prototype.handle_keyup = function(ev)
{
	this.key_down = false;
}

Actions.prototype.handle_gamepad_press = function(ev, button_index, button)
{
	// Actions only work in the timer control view
	if(this.get_page() == "timer-control")
	{
		switch(button_index)
		{
			case this.current_settings["gamepad_button_split"]:
				this.timer_start_split();
				break;
			
			case this.current_settings["gamepad_button_reset"]:
				this.timer_stop_reset();
				break;
		}
	}
}

//// Timer actions ////

Actions.prototype.timer_start_split = function()
{
	if(window.current_run && window.current_run.started) // A timer run is already started, we split
	{
		if(window.current_timer.timer_type == Timer.Type.RTA)
		{
			// Do not do anything if the timer is still below 0
			if(window.current_run.elapsed < 0)
				return;
			
			$("#timer-splits tr")[window.current_run.current_split].classList.remove("current");
			window.current_run.split();
		}
		else if(window.current_timer.timer_type == Timer.Type.MANUAL)
		{
			var split_time = prompt('Time for split "' + window.current_timer.splits[window.current_run.current_split].name + '"');
			
			if(split_time)
			{			
				$("#timer-splits tr")[window.current_run.current_split].classList.remove("current");
				window.current_run.split_manual(string_to_msec(split_time));
			}
		}
	}
	else // No timer run has been started, we create and start one
	{
		if(window.current_timer)
		{
			// If there is still a run going (previous run ended), do a reset
			if(window.current_run)
				this.timer_stop_reset();
			else
				this.load_timer(window.current_timer);
			
			window.current_run = new Run(window.current_timer);
			window.current_run.start();
			
			$("#run-count").text(window.current_timer.run_count);
			
			$("#control-button-play span").text("Split");
			$("#control-button-play i").removeClass("glyphicon-play").addClass("glyphicon-ok");
			
			$("#control-button-reset span").text("Stop");
			$("#control-button-reset i").removeClass("glyphicon-refresh").addClass("glyphicon-stop");
			
			
			$("#timer-splits").css('top', "0px");
		}
		
		$("#control-button-skip").removeClass("disabled");
		$("#control-button-back").removeClass("disabled");
	}
	
	if(window.current_run.started)
	{
		$("#timer-splits tr")[window.current_run.current_split].classList.add("current");
	
		//Move splits
		var container_height = q("#timer-splits-container").clientHeight;
		var split_tr = $("#timer-splits tr")[window.current_run.current_split].offsetTop;
		
		var total_height = q("#timer-splits").clientHeight;
		
		if(split_tr > container_height / 2 && total_height > container_height)
		{
			this.split_scroll_status = window.current_run.current_split;
			
			while((split_tr - (container_height / 2)) < $("#timer-splits tr")[this.split_scroll_status].offsetTop)
				this.split_scroll_status--;
			
			$("#timer-splits").css('top', "-" + $("#timer-splits tr")[this.split_scroll_status].offsetTop + "px");
		}
	}
	else
	{
		this.update();
		$("#control-button-play span").text("Start");
		$("#control-button-play i").removeClass("glyphicon-ok").removeClass("glyphicon-stop").addClass("glyphicon-play");
		$("#control-button-reset span").text("Reset");
		$("#control-button-reset i").removeClass("glyphicon-stop").addClass("glyphicon-refresh");
	}
	
	if(window.current_run.current_split + 1 == window.current_timer.splits.length && window.current_timer.timer_type == Timer.Type.RTA)
	{
		$("#control-button-play span").text("Stop");
		$("#control-button-play i").removeClass("glyphicon-play").addClass("glyphicon-stop");
	}
}

Actions.prototype.timer_split_prev = function()
{
	$("#timer-splits tr")[window.current_run.current_split].classList.remove("current");
	window.current_run.prev_split();
	$("#timer-splits tr")[window.current_run.current_split].classList.add("current");
	
	this.update();
	
	//Removing current split
	$($("#timer-splits tr")[window.current_run.current_split].querySelector(".ref")).html(msec_to_string(window.current_timer.splits[window.current_run.current_split].pb_split));
	$($("#timer-splits tr")[window.current_run.current_split].querySelector(".time")).html("");
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
		else
		{
			$("#control-button-play span").text("Start");
			$("#control-button-play i").removeClass("glyphicon-ok").removeClass("glyphicon-stop").addClass("glyphicon-play");
			$("#control-button-reset span").text("Reset");
			$("#control-button-reset i").removeClass("glyphicon-stop").addClass("glyphicon-refresh");
		}
		
		if(window.current_run.current_split + 1 == window.current_timer.splits.length && window.current_timer.timer_type == Timer.Type.RTA)
		{
			$("#control-button-play span").text("Stop");
			$("#control-button-play i").removeClass("glyphicon-play").addClass("glyphicon-stop");
		}
	}
}

Actions.prototype.timer_stop_reset = function()
{
	if(window.current_run && window.current_run.started)
	{
		window.current_run.stop();
		this.update();
		$("#control-button-reset span").text("Reset");
		$("#control-button-reset i").removeClass("glyphicon-stop").addClass("glyphicon-refresh");
		$("#control-button-play span").text("Restart");
		$("#control-button-play i").removeClass("glyphicon-ok").removeClass("glyphicon-stop").addClass("glyphicon-play");
	}
	else
	{
		if(window.current_run && window.current_run.best_time_updated)
		{
			var save_bests = confirm("There have been new best splits. Save them ?");
			if(save_bests)
				window.current_timer.save_bests(window.current_run);
		}
		
		window.current_run = null;
		this.load_timer(window.current_timer);
		$("#control-button-play span").text("Start");
		$("#timer-splits").css('top', "0px");
	}
}

Actions.prototype.timer_save_splits = function()
{
	window.current_timer.save_bests(window.current_run); // Save best splits
	window.current_timer.save_splits(window.current_run);
	Crouton.notify(CroutonType.CONFIRM, "Splits saved.");
}

Actions.prototype.timer_edit_timer = function()
{
	//Additional security ensuring we don't do stupid things
	if(window.current_timer != null)
	{
		//Replacing timer data into edition fields
		$("#form-edit-timer-name").val(window.current_timer.timer_name);
		$("#form-edit-game-name").val(window.current_timer.run_name);
		$("#form-edit-start-delay").val(msec_to_string(window.current_timer.start_delay, false, 3));
		
		q("#form-edit-timer-type-rta").checked = false;
		q("#form-edit-timer-type-manual").checked = false;
		
		switch(window.current_timer.timer_type)
		{
			case Timer.Type.RTA:
				q("#form-edit-timer-type-rta").checked = true;		
				break;
				
			case Timer.Type.MANUAL:
				q("#form-edit-timer-type-manual").checked = true;
				break;
		}
		
		//putting back splits
		var split_template = $("#edit-timer-split-template");
		$(".timer-split").remove();
		$("#form-edit-timer-split-list").prepend(split_template);
		
		for(var i in window.current_timer.splits)
		{
			var new_split = split_template.clone();
			new_split.removeClass("hidden");
			new_split.removeAttr("id");
			
			new_split.child('.split-name').val(window.current_timer.splits[i].name);
			new_split.child('.split-gold').val(msec_to_string(window.current_timer.splits[i].split_best, false, 3));
			new_split.child('.split-reference').val(msec_to_string(window.current_timer.splits[i].pb_split, false, 3));
			
			$('#form-edit-timer-split-list .timer-split:last-of-type').after(new_split);	
			$(".timer-split:last-of-type [data-action]").each(Actions.bind_element_action, window);
		}
		
		
		this.load_page('edit-timer');
	}
}

Actions.prototype.timer_close_timer = function()
{
	window.current_run = null;
	window.current_timer = null;
	this.load_empty_timer();
	this.load_page("main-menu");
}

//// Settings page actions ////

Actions.prototype.settings_discard = function()
{
	// Stop capturing
	if(this.settings_current_capture_key)
	{
		var capture_button = q('.settings-gamepad-capture[data-buttontype="' + this.settings_current_capture_key + '"]');
		this.settings_gamepad_capture_cancel(capture_button);
	}
	
	// Reload the settings from the storage
	this.refresh_settings();
	
	if(window.current_timer)
		this.load_page("timer-control");
	else
		this.load_page("main-menu");
}

Actions.prototype.settings_save = function()
{
	var use_gamepad = q("#settings-gamepad-use").checked;
	this.current_settings['use_gamepad'] = use_gamepad;
	
	Storage.get().set_settings(this.current_settings);
	
	if(window.current_timer)
		this.load_page("timer-control");
	else
		this.load_page("main-menu");
}

Actions.prototype.settings_gamepad_change = function()
{
	var selected_gamepad_id = null;
	
	if(q("#settings-gamepad-id option:checked"))
		selected_gamepad_id = q("#settings-gamepad-id option:checked").value;
	
	this.gamepad.set_gamepad(selected_gamepad_id);
	this.current_settings.gamepad_id = selected_gamepad_id;
	
	// Disable or enable capture buttons if a gamepad has been selected
	$(".settings-gamepad-capture").each(function(el)
	{
		if(selected_gamepad_id)
			$(el).removeAttr('disabled');
		else
			$(el).attr('disabled', true);
	});
}

Actions.prototype.settings_current_capture_key = null;

Actions.prototype.settings_gamepad_capture_toggle = function(el)
{
	var captured_key = el.dataset.buttontype;
	
	// Key capture isn't enabled, start capturing
	if(!this.settings_current_capture_key)
	{
		var input = q('.settings-gamepad-button[data-buttontype="' + captured_key + '"]');
		input.value = "Capturing...";
		
		this.settings_current_capture_key = captured_key;
		this.gamepad.start_polling();
		el.classList.remove('btn-primary');
		el.classList.add('btn-danger');
		el.value = "Cancel";
	}
	else // Disable key capture
	{
		var input = q('.settings-gamepad-button[data-buttontype="' + captured_key + '"]');
		input.value = "";
		this.settings_gamepad_capture_cancel(el);
	}
}

Actions.prototype.settings_gamepad_capture_cancel = function(el)
{
	this.settings_current_capture_key = null;
	this.gamepad.stop_polling();
	el.classList.remove('btn-danger');
	el.classList.add('btn-primary');
	el.value = 'Capture';
}

Actions.prototype.settings_gamepad_handle_press = function(ev, button_index, button)
{
	if(this.settings_current_capture_key)
	{
		// Updating the selected input
		var input = q('.settings-gamepad-button[data-buttontype="' + this.settings_current_capture_key + '"]');
		input.value = "Button " + button_index;
		
		// Save button in current settings
		this.current_settings["gamepad_button_" + this.settings_current_capture_key] = button_index;
		
		var el = q('.settings-gamepad-capture[data-buttontype="' + this.settings_current_capture_key + '"]');
		this.settings_gamepad_capture_cancel(el);
	}
}