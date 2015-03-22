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

Timer.prototype.save_splits = function(run)
{
	for(var k in this.splits)
		this.splits[k].pb = run.split_times[k];
	
	this.save();
}

Timer.load = function(timer_name)
{
	if(typeof localStorage != 'undefined' && typeof localStorage[timer_name] != 'undefined')
	{
		var new_timer = new Timer();
		
		var timer_obj = JSON.parse(localStorage[timer_name]);
		
		for(var k in timer_obj)
			new_timer[k] = timer_obj[k];
	}
	
	return new_timer;
}