function Run(timer)
{
	this.timer = timer;
	this.elapsed = 0; // Number of milliseconds elapsed
	this.start_time = null; // Instance of Date
	this.split_times = [];
	this.current_split = 0;
	this.started = false;
	
}

Run.prototype.start = function()
{
	this.start_time = new Date();
	this.started = true;
	
	this.timer.run_count++;
	this.timer.save();

	// Register to update on global manager
	if(this.timer.timer_type == Timer.Type.RTA)
		Actions.get_manager().register_updates(this);
}

Run.prototype.split = function()
{
	this.split_times[this.current_split] = this.elapsed;
	Actions.get_manager().update(true);
	this.current_split++;
	
	if(this.current_split == this.timer.splits.length)
		this.stop(false);
}

Run.prototype.split_manual = function(split_time)
{
	this.split_times[this.current_split] = this.elapsed + split_time;
	this.elapsed += split_time;
	Actions.get_manager().update(true);
	this.current_split++;
	
	if(this.current_split == this.timer.splits.length)
		this.stop(false);
}

Run.prototype.prev_split = function()
{
	if(this.current_split > 0)
	{
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

Run.prototype.get_time = function(use_markup, res)
{
	use_markup = use_markup || false;
	res = res || 1;

	return msec_to_string(this.elapsed, use_markup, res);
}