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

Timer.import_json = function(json)
{
	var new_timer = new Timer();
	var obj = JSON.parse(json);
	
	for(var k in obj)
			new_timer[k] = obj[k];
	
	return new_timer;
}