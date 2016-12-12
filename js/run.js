function Run(timer)
{
	this.timer = timer;
	this.elapsed = 0; // Number of milliseconds elapsed
	this.start_time = null; // Instance of Date
	this.split_times = [];
	this.best_splits = [];
	this.current_split = 0;
	this.started = false;
	this.best_time_updated = false;
	
	// Fill best splits with timer's best splits
	for(var i in timer.splits)
		this.best_splits[i] = timer.splits[i].split_best;
}

Run.prototype.start = function()
{
	this.start_time = new Date((new Date()).getTime() + this.timer.start_delay);
	this.started = true;
	
	this.timer.run_count++;
	this.timer.save();

	// Register to update on global manager
	if(this.timer.timer_type == Timer.Type.RTA)
		Actions.get_manager().register_updates(this);
}

Run.prototype.split = function()
{
	if(!this.started)
		return;
		
	this.split_times[this.current_split] = this.elapsed;
	Actions.get_manager().update(null, true);
	
	var duration = this.split_times[this.current_split];
	if(this.current_split > 0)
		duration -= this.split_times[this.current_split - 1];
	
	//Check for PB
	if(this.best_splits[this.current_split] == null || duration < this.best_splits[this.current_split])
	{
		this.best_splits[this.current_split] = duration;
		this.best_time_updated = true;
		Actions.get_manager().update_sob();
	}
	
	//Increase split counter
	this.current_split++;
	
	if(this.current_split == this.timer.splits.length)
	{
		this.stop(false);
		this.current_split--;
	}
}

Run.prototype.split_manual = function(split_time)
{
	if(!this.started)
		return;
	
	this.split_times[this.current_split] = this.elapsed + split_time;
	this.elapsed += split_time;
	Actions.get_manager().update(null, true);
	
	//Check for PB
	if(this.timer.splits[this.current_split].split_best == null || split_time < this.timer.splits[this.current_split].split_best)
	{
		this.best_splits[this.current_split] = split_time;
		this.best_time_updated = true;
		Actions.get_manager().update_sob();
	}
	
	this.current_split++;
	
	if(this.current_split == this.timer.splits.length)
	{
		this.stop(false);
		this.current_split--; // Put conveniently the split at the last split to avoid out of range errors.
	}
}

Run.prototype.prev_split = function()
{
	if(this.current_split > 0)
	{
		// Forget the best split that may have been overriden
		this.best_splits[this.current_split] = this.timer.splits[this.current_split].split_best;
		
		this.current_split--;
		
		if(this.timer.timer_type == Timer.Type.MANUAL)
		{
			if(this.current_split == 0)
				this.elapsed = 0;
			else
				this.elapsed = this.split_times[this.current_split - 1];
		}
		
		this.split_times[this.current_split] = null;
	}
}

Run.prototype.next_split = function()
{
	this.split_times[this.current_split] = null;
	this.current_split++;
	
	if(this.current_split == this.timer.splits.length)
		this.stop(false);
}

Run.prototype.stop = function(do_update)
{
	do_update = typeof do_update != "undefined" ? do_update : true;
	
	if(do_update)
		Actions.get_manager().update();
	
	this.started = false;
	Actions.get_manager().unregister_updates(this);
}

Run.prototype.update = function()
{
	var now = new Date();
	this.elapsed = now.getTime() - this.start_time.getTime();
}

Run.prototype.get_time = function(use_markup, final_time)
{
	use_markup = use_markup || false;
	res = final_time ? Math.max(0, 3 - Math.floor(this.elapsed / 3600000).toString().length + 1) : 1; // For each more digit we have over 1 hour, we reduce the number of shown decimal places

	return msec_to_string(this.elapsed, use_markup, res);
}