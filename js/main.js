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

//// end ki.js extensions ////

/// Not ki.js but still useful functions ///

var q = document.querySelector.bind(document);
Element.prototype.q = Element.prototype.querySelector;

/// end not ki.js but still useful functions ///

var action_handler = null;

window.current_timer = null;

function msec_to_time(time, res)
{
    var res_pow = Math.pow(10, res);
    time = Math.abs(time);

    var minutes = 0;
    var hours = 0;
    var seconds = parseInt(time / 1000, 10);
    var dseconds = parseInt(time / (1000 - res_pow), 10);

    if(seconds >= 60)
        minutes = parseInt(seconds / 60, 10);
    if(minutes >= 60)
        hours = parseInt(minutes / 60, 10);

    seconds %= 60;
    minutes %= 60;
    dseconds %= res_pow;

    return { hr: hours, mn: minutes, sec: seconds, ms: dseconds };
}

function msec_to_string(time, use_markup, res)
{
    human_time = msec_to_time(time, res);
    var str = "";
    if(human_time.hr > 0)
        str += human_time.hr + ":" + (human_time.mn < 10 ? "0" : "");
    if(human_time.mn > 0)
        str += human_time.mn + ":" + (human_time.sec < 10 ? "0" : "");

    if(res > 0)
    {
        if(use_markup)
            str += human_time.sec + ".<small>" + human_time.ms + "</small>";
        else
            str += human_time.sec + "." + human_time.ms;
    }
    else
        str += human_time.sec;

    return str;
}

//Onload event - init everything
$(function()
{
	action_handler = new Actions();
	action_handler.init();
    
    var table_pos = $("#timer-splits-container")[0].getBoundingClientRect();
    var drag_handle_evt = function(event)
    {
        var height = Math.max(table_pos.height, event.y - (table_pos.top + document.body.scrollTop));
        
        $("#timer-splits-container").css("height", height + "px" );  
    };
    
    // Split size handle
    $("#timer-split-handle").on("mousedown",function(e)
    {
        $(document).on("mousemove", drag_handle_evt);
        e.preventDefault();
    })
    $(document).on("mouseup", function()
    {
        $(document).off("mousemove", drag_handle_evt);
    });
    
	action_handler.load_page("main-menu");
});