/*

	Timer.splits[] is the split list. Each split is an object composed like this:
	
	- name: The name of the split
	- pb_duration: The duration of the PB time
	- pb_split: The elapsed time since the beginning of the run
	- split_best: The Golden time.
	
 */

function Timer()
{
	this.timer_name = "";
	this.run_name = "";
	this.hash = "";
	this.start_delay = 0;
	this.run_count = 0;
	this.splits = [];
	this.timer_type = Timer.Type.RTA;
}

Timer.Type = { RTA: 0, MANUAL: 1 };

Timer.exists = function(timer_name)
{
	if(!store.enabled)
		return false;
	
	var timers_names = Storage.get().get_names();
	
	for(var i in timers_names)
	{
		if(timers_names[i] == timer_name)
			return true;
	}
	
	return false;
}

Timer.prototype.save = function()
{
	if(Storage.enabled())
		Storage.get().set_timer(this);
}

Timer.prototype.delete = function()
{
	
	if(Storage.enabled())
		Storage.get().delete_timer(this);
}

Timer.prototype.to_string = function()
{
	return JSON.stringify(this);
}

Timer.prototype.save_splits = function(run)
{
    if(run === null || run === undefined)
        return;
    
	for(var k in this.splits)
	{
		this.splits[k].pb_split = run.split_times[k];
		
		this.splits[k].pb_duration = run.split_times[k];
		if(k > 0)
			this.splits[k].pb_duration -= run.split_times[k - 1];
	}
	
	this.save();
}

Timer.prototype.save_bests = function(run)
{
    if(run === null || run === undefined)
        return;
    
	for(var k in this.splits)
	{
		if(run.best_splits[k] !== null && (this.splits[k].split_best > run.best_splits[k] || this.splits[k].split_best === null))
			this.splits[k].split_best = run.best_splits[k];
	}
	
	run.best_time_updated = false;
	
	this.save();
}

Timer.prototype.compute_split_lengths = function()
{
	var previous_elapsed = 0;
	for(var i in this.splits)
	{
		// Fixing PB splits
		if(this.splits[i].pb_split != null)
		{
			this.splits[i].pb_duration = this.splits[i].pb_split - previous_elapsed;
			previous_elapsed = this.splits[i].pb_split;
		}
		else if(this.splits[i].pb_split == null)
			this.splits[i].pb_duration = null;
	}
}

Timer.load = function(timer_name)
{
	var new_timer = new Timer();

	if(Storage.enabled())
	{
		// Load the raw data objects (not Timer objects)
		var timer_obj = Storage.get().get_timer(timer_name);
		
		// Hydrate the timer properties
		for(var k in timer_obj)
			new_timer[k] = timer_obj[k];
		
		new_timer.compute_split_lengths();
		
		// If we haven't got any gold for the split, compute it
		for(var i in new_timer.splits)
		{	
			if(typeof new_timer.splits[i].pb != "undefined")
				delete new_timer.splits[i].pb;
			
			if(!new_timer.splits[i].split_best
			 || new_timer.splits[i].split_best < 0
			 || (new_timer.splits[i].pb_duration && new_timer.splits[i].split_best > new_timer.splits[i].pb_duration))
			{
				new_timer.splits[i].split_best = new_timer.splits[i].pb_duration;
			}
		}
		
		new_timer.save();
	}
	
	return new_timer;
}

Timer.import_json = function(json)
{
	var new_timer = new Timer();
	var obj = JSON.parse(json);
	
	for(var k in obj)
			new_timer[k] = obj[k];
 
	new_timer.compute_split_lengths();
	
	// If we haven't got any gold for the split, compute it
	for(var i in new_timer.splits)
	{	
		if(typeof new_timer.splits[i].pb != "undefined")
			delete new_timer.splits[i].pb;
		
		if(!new_timer.splits[i].split_best
		 || new_timer.splits[i].split_best < 0
		 || (new_timer.splits[i].pb_duration && new_timer.splits[i].split_best > new_timer.splits[i].pb_duration))
		{
			new_timer.splits[i].split_best = new_timer.splits[i].pb_duration;
		}
	}
	
	return new_timer;
}