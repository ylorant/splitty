/*

	Timer.splits[] is the split list. Each split is an object composed like this:
	
	
	
 */

function Timer()
{
	this.timer_name = "";
	this.run_name = "";
	this.run_count = 0;
	this.splits = [];
	this.timer_type = Timer.Type.RTA;
}

Timer.Type = { RTA: 0, MANUAL: 1 };

Timer.prototype.save = function()
{
	if(typeof localStorage != 'undefined')
	{
		localStorage[this.timer_name] = JSON.stringify(this);
		
		var names = JSON.parse(localStorage.timer_names);
		if(typeof names.pop == "undefined")
			names = [];
		
		if(names.indexOf(this.timer_name) == -1)
		{
			names.push(this.timer_name);
			localStorage.timer_names = JSON.stringify(names);
		}
	}
}

Timer.prototype.to_string = function()
{
	return JSON.stringify(this);
}

Timer.prototype.save_splits = function(run)
{
	for(var k in this.splits)
		this.splits[k].pb_split = run.split_times[k];
	
	this.save();
}

Timer.prototype.compute_split_lengths = function()
{
	var previous_elapsed = 0;
	for(var i in this.splits)
	{
		if(this.splits[i] != null)
		{
			this.splits[i].pb_duration = this.splits[i].pb_split - previous_elapsed;
			previous_elapsed = this.splits[i].pb_split;
		}
	}
	
	this.save();
}

Timer.load = function(timer_name)
{
	var new_timer = new Timer();

	if(typeof localStorage != 'undefined' && typeof localStorage[timer_name] != 'undefined')
	{
		
		var timer_obj = JSON.parse(localStorage[timer_name]);
		
		for(var k in timer_obj)
			new_timer[k] = timer_obj[k];
		
		var has_duration = false;
		for(var i in new_timer.splits)
		{
			if(new_timer.splits[i].pb_duration != null)
				has_duration = true;
		}
		
		if(!has_duration)
			new_timer.compute_split_lengths();
	}
	
	return new_timer;
}

Timer.import_json = function(json)
{
	var new_timer = new Timer();
	var obj = JSON.parse(json);
	
	for(var k in obj)
			new_timer[k] = obj[k];
	
	return new_timer;
}