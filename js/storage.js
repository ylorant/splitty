function Storage()
{
    Storage.self_ref = this;
    
    // Convert old storage if necessary
    this.convert_old();
}

//// Static methods ////

/* Generates a random string, used to create hash keys in storage */
Storage.random_string = function(size)
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < size; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

Storage.self_ref = null;

/* Singleton get */
Storage.get = function()
{
    return Storage.self_ref;
}

/* Checks if the storage can be accessed */
Storage.enabled = function()
{
    return store.enabled;
}

//// Initialization routines ////

/* Convert old storage to new format */
Storage.prototype.convert_old = function()
{
    // Check if there is an old storage present, and we don't do anything if there isn't
    if(typeof localStorage['timer_names'] == "undefined")
        return;
    
    // We consider that we're in the old format already
    var old_timer_names = JSON.parse(localStorage['timer_names']);
    var new_timer_names = {};
    var timers = {};
    
    for(var i in old_timer_names)
    {
        var hash = Storage.random_string(32);
        new_timer_names[hash] = old_timer_names[i];
        timers[hash] = JSON.parse(localStorage[old_timer_names[i]]);
        
        timers[hash].hash = hash;
    }
    
    // Now that we have all the timers it's time to rewrite the storage
    this.init();
    store.set('timers', timers);
    store.set('timers.names', new_timer_names);
}

/* Initialize storage */
Storage.prototype.init = function()
{
    if(!store.has("timers"))
    {
        store.clear();
        store.set('timers', {});
        store.set('timers.names', {});
        store.set('settings', {});
    }
}

//// Timer Manipulation ////

/* Gets the hash from a timer name */
Storage.prototype.get_hash = function(timer_name)
{
    var timer_names = store.get('timers.names');
    for(var i in timer_names)
    {
        if(timer_names[i] == timer_name)
            return i;
    }
    
    return null;
}

/* Returns timer names */
Storage.prototype.get_names = function()
{
    var timers_names = store.get('timers.names');
    return timers_names;
}

/* Gets a timer from the storage */
Storage.prototype.get_timer = function(hash)
{
    if(hash === null)
        return null;
    
    var timers = store.get('timers');
    return timers[hash];
}

/* Sets a timer into the storage */
Storage.prototype.set_timer = function(timer)
{
    var hash = null;
    var timers = store.get('timers');
    var timer_names = store.get('timers.names');
    
    // Define timer hash if it hasn't already been defined
    if(typeof timer.hash != "string" || timer.hash.length === 0)
    {
        do
        {
            hash = Storage.random_string(32);
        }
        while(typeof timers[hash] != "undefined");
        
        timer.hash = hash;
    }
    else
        hash = timer.hash;
    
    // Save the timer
    timers[hash] = timer;
    store.set("timers", timers);
    
    // Save the timer name
    timer_names[hash] = timer.timer_name;
    store.set("timers.names", timer_names);
}

/* Deletes a timer from the storage */
Storage.prototype.delete_timer = function(timer)
{
    var hash = timer.hash;
    
    if(hash === null)
        return false;
    
    var timers = store.get("timers");
    var timer_names = store.get("timers.names");
    
    delete timers[hash];
    delete timer_names[hash];
    
    return true;
}

/* Sets a setting property */
Storage.prototype.set_settings_property = function(name, value)
{
    var settings = store.get('settings');
    settings[name] = value;
    store.set('settings', settings);
}

/* Gets a setting property */
Storage.prototype.get_settings_property = function(name, value)
{
    var settings = store.get('settings');
    
    if(typeof settings[name] != "undefined")
        return settings[name];
    
    return null;
}

/* Gets all of the settings at once */
Storage.prototype.get_settings = function()
{
    var settings = store.get('settings');
    return settings;
}

/* Updates all the settings at once */
Storage.prototype.set_settings = function(settings)
{
    store.set('settings', settings);
}