const createOutline = (curves,selectedCurve,ctx)=>{
    const curve = curves.current[selectedCurve.current];
        let outlineRectanglePosition = {
          smallX: 100000,
          smallY: 100000,
          largeX: 0,
          largeY: 0
        };
        // getting the dimension of outline rectangle shown to highlight the curve selected (aka: blue rectangle)
        for (let i = 0; i < curve.length; i++) {
          outlineRectanglePosition.smallX = Math.min(outlineRectanglePosition.smallX, curve[i].x);
          outlineRectanglePosition.smallY = Math.min(outlineRectanglePosition.smallY, curve[i].y);
          outlineRectanglePosition.largeX = Math.max(outlineRectanglePosition.largeX, curve[i].x);
          outlineRectanglePosition.largeY = Math.max(outlineRectanglePosition.largeY, curve[i].y);

        }
        // draw highlighted outline rectangle of selected curve
        ctx.current.save();
        console.log(outlineRectanglePosition);
        ctx.current.strokeStyle = "blue";
        ctx.current.lineWidth = 1;
        ctx.current.strokeRect(
          outlineRectanglePosition.smallX,
          outlineRectanglePosition.smallY,
          Math.abs(outlineRectanglePosition.smallX - outlineRectanglePosition.largeX),
          Math.abs(outlineRectanglePosition.smallY - outlineRectanglePosition.largeY)
        );
        ctx.current.restore();
}

export {createOutline};