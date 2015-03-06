//// ki.js extensions ////

//Check if an element matches a selector
$.prototype.matches = function(s)
{
  var el = this[0];
  return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
};

// Search for a selector in parents of the current node
$.prototype.parents = function(q)
{
	var parents = [];
    var p = this[0].parentNode;
    while (p !== null)
    {
        if(typeof q == "undefined" || p.matches(q))
        	parents.push(p);

        p = p.parentNode;
    }

    return parent; // returns an Array []
}

$.prototype.clone = function()
{
	return $(this.cloneNode(true));
}

//// end ki.js extensions ////

var action_handler = null;

//Onload event - init everything
$(function()
{
	action_handler = new Actions();
	action_handler.init();

	action_handler.load_page("main-menu");
});