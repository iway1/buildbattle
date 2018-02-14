class Grid {
	constructor()
	{
		this.canvas = document.querySelector('canvas#game-canvas');
		console.log(this.canvas.width);
		// this.drawGrid(48, 6400, 3600);

		this.draw();
	}
	drawLine(x1, x2, y1, y2)
	{
		let ctx_arr = [];
		// for(let i=0;i<10;i++) {
			let ctx = this.canvas.getContext('2d');
			ctx.beginPath();
			// ctx.moveTo(0,250);

			y1 = y1 + 10;
			y2 = y2 + 10;
			console.log('(' + x1 + "," + y1 + ")");
			console.log('(' + x2 + "," + y2 + ")");
			ctx.moveTo(x1 + 10, y1);
			ctx.lineTo(x2 + 10, y2);
			// ctx.moveTo(x1 + 20, y1);
			ctx.lineTo(x2 + 20, y2);
			// ctx.moveTo(x1 + 30, y1);
			ctx.lineTo(x2 + 30, y2);
			// ctx.moveTo(x1 + 40, y1);
			ctx.lineTo(x2 + 40, y2);
			// ctx.moveTo(x1 + 50, y1);
			ctx.lineTo(x2 + 50, y2);
			// ctx.moveTo(x1 + 60, y1);
			ctx.lineTo(x2 + 60, y2);
			// ctx.lineTo(1600, 250);
			// ctx.fill();
			// ctx_arr.push(ctx);
		// }
		// console.log(ctx);
		return ctx;
	}
	drawGrid(grid_size, x_dim, y_dim)
	{
		let y_iterations = y_dim / grid_size;
		let x_iterations = x_dim / grid_size;
		console.log(y_iterations);
		console.log(x_iterations);
	}
	draw()
	{
		let ctx = this.drawLine(0, 1600, 250, 250);
		// ctx.stroke();
		console.log(ctx);
		// ctx.forEach(function(c) {
			// c.stroke();
		// })

		ctx.stroke();
		// let ctx2 = this.drawLine(100, 1600, 100, 100);
		// console.log(ctx);
		// ctx2.stroke();
		// ctx2.forEach(function(c){
			// c.stroke();
		// });

	}


}

let grid = new Grid();