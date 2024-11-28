
const redrawCanvas = (ctx,canvasRef,curves,offsetTop) => {
    console.log(canvasRef.current.width, canvasRef.current.height);
    ctx.current.clearRect(0, 0 - offsetTop, canvasRef.current.width, canvasRef.current.height); // maybe we could just clear a specific part in future and redraw only relevent curves and parts
    curves.current.forEach((curve) => {
      for (let i = 1; i < curve.length; i++) {
        ctx.current.beginPath();
        ctx.current.moveTo(curve[i - 1].x, curve[i - 1].y);
        ctx.current.lineTo(curve[i].x, curve[i].y);
        ctx.current.stroke();
      }
    });
    
  }
export {redrawCanvas};