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

//Onload event - init everything
$(function()
{
	action_handler = new Actions();
	action_handler.init();

	action_handler.load_page("main-menu");
});