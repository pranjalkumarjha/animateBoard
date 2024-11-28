import { redrawCanvas } from "./redrawCanvas";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const playAnimation = 
    async (canvas,canvasRef,ctx,curves,animationList,offsetTop,setOffsetTop,longestAnimationLength,play,setPlay) => {
        canvas = canvasRef.current;
        ctx.current = canvas.getContext("2d");
        setOffsetTop(canvas.getBoundingClientRect().top);
        let tempCurves = structuredClone(curves.current); // Preferred method
        console.log('temp Curves: ', tempCurves);
        if (play) {
          console.log("Play Clicked");
  
          // Initialize animation control for each curve
          const animateFor = {};
          animationList.current.forEach((path) => (animateFor[path.curveIndex] = 1));
          console.log("animate for object: ", animateFor);
  
          let it = 0;
  
          while (it < longestAnimationLength.current) {
            ctx.current.clearRect(
              0,
              0 - offsetTop,
              canvasRef.current.width,
              canvasRef.current.height
            );
  
            curves.current.forEach((curve, index) => {
              console.log("true or false", index, animateFor[index]);
  
              const path = animationList.current.find(
                (path) => path.curveIndex === index
              )?.path;
  
              if (animateFor[index] === 1 && path?.length >= it + 1) {
                console.log("animated path for:", path);
  
                const initialDisplacement = { x: 0, y: 0 };
  
                for (let i = 0; i < curve.length; i++) {
                  let dx = 0;
                  let dy = 0;
  
                  if (it === 0) {
                    // Compute displacement for the first iteration
                    if (i === 0) {
                      initialDisplacement.x = path[it].x - curve[i].x;
                    }
  
                    // Apply the same displacement to all points
                    dx = initialDisplacement.x;
                  } else {
                    // Incremental movement along the path for subsequent iterations
                    dx = path[it].x - path[it - 1].x;
                    dy = path[it].y - path[it - 1].y;
                  }
  
                  // Apply the computed displacement
                  curve[i].x += dx;
                  curve[i].y += dy;
                }
              }
  
              // Update the curve positions
              curves.current[index] = curve;
            });
  
            // Redraw the updated canvas
            redrawCanvas(ctx,canvasRef,curves,offsetTop);
            console.log("it: ", it);
            it++;
  
            await delay(10);
          }
          console.log('temp Curves final: ', tempCurves);
          curves.current = tempCurves;
          redrawCanvas(ctx,canvasRef,curves,offsetTop);
          setPlay(false); // Stop animation
        }
     
}

export {playAnimation};