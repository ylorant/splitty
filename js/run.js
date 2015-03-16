function Run(timer)
{
	this.timer = timer;
	this.elapsed = 0; // Number of milliseconds elapsed
	this.start_time = null; // Instance of Date
	this.split_times = [];
	this.current_split = 0;
	
	this.timer.run_count++;
}

Run.prototype.start = function()
{
	this.start_time = new Date();

	// Register to update on global manager
	Actions.get_manager().register_updates(this);
}

Run.prototype.split = function()
{
	Actions.get_manager().update();
	this.split_times[this.current_split] = this.elapsed;
	this.current_split++;
}

Run.prototype.prev_split = function()
{
	this.current_split--;
	this.split_times[this.current_split] = null;
}

Run.prototype.next_split = function()
{
	this.split_times[this.current_split] = null;
	this.current_split++;
}

Run.prototype.stop = function()
{
	Actions.get_manager().update();
	Actions.get_manager().unregister_updates(this);
}

Run.prototype.update = function()
{
	var now = new Date();
	this.elapsed = now.getTime() - this.start_time.getTime();
}

Run.prototype.get_time = function(use_markup)
{
	use_markup = use_markup || false;

	var minutes = 0;
	var hours = 0;
	var seconds = parseInt(this.elapsed / 1000, 10);
	var dseconds = parseInt(this.elapsed / 100, 10);

	if(seconds >= 60)
		minutes = parseInt(seconds / 60, 10);
	if(minutes >= 60)
		hours = parseInt(minutes / 60, 10);

	seconds %= 60;
	minutes %= 60;
	dseconds %= 10;

	var str = "";
	if(hours > 0)
		str += hours + ":" + (minutes < 10 ? "0" : "");
	if(minutes > 0)
		str += minutes + ":" + (seconds < 10 ? "0" : "");

	if(use_markup)
		str += seconds + ".<small>" + dseconds + "</small>";
	else
		str += seconds + "." + dseconds;

	return str;
}