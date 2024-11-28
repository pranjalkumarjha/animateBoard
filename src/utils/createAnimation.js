// push the new animation into the animationList array, we animate for group and individuals 

const createAnimation = (longestAnimationLength,currentPath,allGroups,animationList,previouslySelected,curves)=>{
    longestAnimationLength.current = Math.max(longestAnimationLength.current, currentPath.current.length);
    let found = false;
    for (let i = 0; i < allGroups.current.length; i++) {
      

      // Check if `previouslySelected.current` belongs to this group
      for (let j = 0; j < allGroups.current[i].length; j++) {
        if (allGroups.current[i][j] === previouslySelected.current) {
          found = true;

          // Iterate through all curves in the group
          for (let k = 0; k < allGroups.current[i].length; k++) {
            const curveIndex = allGroups.current[i][k];
            const curvePoints = curves.current[curveIndex];

            // Find the closest point in `curvePoints` to `currentPath.current[0]`
            let offset = { x: 0, y: 0 }; // Default offset
            if (curvePoints && curvePoints.length > 0) {
              const closestPoint = curvePoints.reduce((closest, point) => {
                const currentDistance = Math.hypot(
                  point.x - currentPath.current[0].x,
                  point.y - currentPath.current[0].y
                );
                const closestDistance = Math.hypot(
                  closest.x - currentPath.current[0].x,
                  closest.y - currentPath.current[0].y
                );
                return currentDistance > closestDistance ? point : closest;
              }, curvePoints[0]);

              // Calculate the offset as the difference between the closest point and `currentPath.current[0]`
              offset = {
                x: closestPoint.x - currentPath.current[0].x,
                y: closestPoint.y - currentPath.current[0].y
              };
            }

            // Adjust `currentPath.current` by subtracting the offset
            const adjustedPath = currentPath.current.map((point) => ({
              x: point.x + offset.x,
              y: point.y + offset.y
            }));

            // Push to `animationList` (replacing existing entry if necessary)
            const existingAnimationIndex = animationList.current.findIndex(
              (entry) => entry.curveIndex === curveIndex
            );

            if (existingAnimationIndex !== -1) {
              animationList.current[existingAnimationIndex] = {
                curveIndex,
                path: adjustedPath
              };
            } else {
              animationList.current.push({ curveIndex, path: adjustedPath });
            }
          }

          // Exit the outer loops once the group is processed
          break;
        }
      }

      if (found) {
        break;
      }
    }
    if(!found){
      const curveIndex = previouslySelected.current; 
      const existingAnimationIndex = animationList.current.findIndex(
        (entry) => entry.curveIndex === curveIndex
      );

      if (existingAnimationIndex !== -1) {
        animationList.current[existingAnimationIndex] = {
          curveIndex,
          path: currentPath.current
        };
      } else {
        animationList.current.push({ curveIndex, path: currentPath.current });
      }
    }
    console.log('animation list: ', animationList.current);
    currentPath.current = [];
  
}

export {createAnimation};