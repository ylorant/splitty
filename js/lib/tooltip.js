$.prototype.tooltip = function(i, c)
{
	this.each(function(b)
	{
		$(b).on('mouseover', function()
		{
			b.querySelector(c).classList.add("active");
		}).on('mouseout', function()
		{
			b.querySelector(c).classList.remove("active");
		});
	});
}