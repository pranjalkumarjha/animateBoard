import { socket } from "../socket"; 

const erase = (curves,e,offsetTop,eraserWidth,precedence,roomId)=>{
    for (let index = 0; index < curves.current.length; index++) {
        const curve = curves.current[index];
        for (let i = 0; i < curve.length; i++) {
          const point = curve[i];
        
          if (
            Math.abs(point.x - e.clientX) <= eraserWidth / 2 &&
            Math.abs(point.y - (e.clientY - offsetTop)) <= eraserWidth / 2
          ) {
            curves.current.splice(index, 1); // Remove the curve
            const currentDate = new Date();
            const sendObject = {
              precedence: precedence.current,
              command: 'd',
              array: [],
              index: index,
              time: currentDate.toLocaleString()
            }
            socket.emit('updateCurves', roomId, sendObject);
            index--; // Adjust index due to removal
            break; // Break out of the inner loop
          }
        }
    }
}

export {erase};