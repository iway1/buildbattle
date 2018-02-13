class Grid {
	constructor()
	{
		this.canvas = document.querySelector('canvas#game-canvas');
		console.log(this.canvas.width);
		this.drawGrid();
	}
	drawGrid()
	{
		let ctx = this.canvas.getContext('2d');
		ctx.beginPath();
		ctx.moveTo(0,50);
		ctx.lineTo(400, 50);
		ctx.fill();
	}


}

let grid = new Grid();