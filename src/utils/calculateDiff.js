const calculateDiff = (oldCellColor,newCellColor)=>{// returns object representing {key:[oldcellcolor,newcellcolor]}

        let changes = {}; 
        let n = oldCellColor?.length; 
        for(let i = 0;i<n;i++){
           
                if(oldCellColor[i]!==newCellColor[i]){
                    changes[i]= [oldCellColor[i],newCellColor[i]];
                }
        
        }
        return changes;
}
const undo = (currentHead,history,newCellColor)=>{ // pass currentHead by reference or make a global context
    console.log(currentHead.current);
    const changes = history.current[currentHead.current]?.diff;  // history has an object named diff && history.current is array
    console.log('changes in the undo',changes); 

    for(let key in changes){
        newCellColor[key] = changes[key][0];
    }

    currentHead.current = Math.max(-1,currentHead.current-1);  
    return {newCellColor};
} 
const redo = (currentHead,history,newCellColor)=>{ // pass currentHead by reference or make a global context
    currentHead.current = Math.min(history.current.length-1,currentHead.current+1); 
    console.log(currentHead.current);
    const changes = history.current[currentHead.current].diff;  // history has an object named diff && history.current is array
    console.log('changes in the redo',changes); 

    for(let key in changes){
        newCellColor[key] = changes[key][1];
    }



    return {newCellColor};

}
export {calculateDiff,undo,redo}