//// ki.js extensions ////

// Search for a selector in parents of the current node
$.prototype.parents = function(q)
{
	var parents = [];
    var p = this[0].parentNode;
    while (p !== document)
    {
        if(typeof q == "undefined" || $(p).is(q))
        	parents.push(p);

        p = p.parentNode;
    }

    return parents; // returns an Array []
}

$.prototype.clone = function()
{
	return $(this[0].cloneNode(true));
}

$.prototype.child = function(q)
{
    return $(this[0].querySelector(q));
}

$.prototype.val = function(v)
{
    return this.each(function(i)
    {
        i.value = v;
    });
}

//// end ki.js extensions ////

/// Not ki.js but still useful functions ///

var q = document.querySelector.bind(document);
Element.prototype.q = Element.prototype.querySelector;

/// end not ki.js but still useful functions ///

var action_handler = null;
var storage = null;

window.current_timer = null;

function msec_to_time(time, res)
{
    var res_pow = Math.pow(10, res);
    time = Math.abs(time);

    var minutes = 0;
    var hours = 0;
    var seconds = parseInt(time / 1000, 10);
    var dseconds = parseInt(time / (1000 / res_pow), 10);

    if(seconds >= 60)
        minutes = parseInt(seconds / 60, 10);
    if(minutes >= 60)
        hours = parseInt(minutes / 60, 10);

    seconds %= 60;
    minutes %= 60;
    dseconds %= res_pow;

    return { hr: hours, mn: minutes, sec: seconds, ms: dseconds };
}

function msec_to_string(time, use_markup, res, relative_time)
{
    human_time = msec_to_time(time, res);
    var str = "";
    
    if(time < 0)
        str += "-";
    else if(relative_time)
        str += "+";
    
    if(human_time.hr > 0)
        str += human_time.hr + ":" + (human_time.mn < 10 ? "0" : "");
    if(human_time.mn > 0 || !relative_time) // when time is shown relatively, strip the minutes if there is not
        str += human_time.mn + ":" + (human_time.sec < 10 ? "0" : "");

    if(res > 0)
    {
        // Pad the ms number to reflect the significative numbers shown
        var ms_length = human_time.ms.toString(10).length;
        var shown_ms = "0".repeat(res - ms_length) + human_time.ms.toString(10);
        
        if(use_markup)
            str += human_time.sec + ".<small>" + shown_ms + "</small>";
        else
            str += human_time.sec + "." + shown_ms;
    }
    else
        str += human_time.sec;

    return str;
}

function string_to_msec(str)
{
    var time_str = str.split(':');
    var time = 0;
    var multiplier = 1000;
    
    //Take account of milliseconds
    if(time_str[time_str.length - 1].indexOf('.') != -1)
    {
        var ms = time_str[time_str.length - 1].split('.');
        time_str[time_str.length - 1] = ms[0];
        time += parseInt(ms[1] + "000".substring(0, 3 - ms[1].length));
    }
    
    for(var i = time_str.length - 1; i >= 0; i--)
    {
        time += parseInt(time_str[i]) * multiplier;
        multiplier *= 60;
    }
    
    return time;
}

//Onload event - init everything
$(function()
{
    // Initialize storage$
    storage = new Storage();
    storage.init();
    
	action_handler = new Actions();
	action_handler.init();
	action_handler.load_page("main-menu");
    
    //Initializing Crouton notif settings
    Crouton.DEFAULT_ELEMENT = "#page-content-wrapper";
    
    $('.my-tooltip').tooltip('.my-tooltip-icon', '.my-tooltip-content');
});