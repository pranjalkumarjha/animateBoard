const createGroup = (group,allGroups,setGroup)=>{
    allGroups.current = [...allGroups.current,[...group]]; 
    console.log(allGroups.current);
    setGroup([]); 
}

export {createGroup}