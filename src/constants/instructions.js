const insertInstruction = (precedence,command,currentCurve,curves)=>{
  const currentDate = new Date();
    const sendObject = {
        precedence: precedence.current,
        command: command,
        array: currentCurve.current,
        index: curves.current.length - 1,
        time: currentDate.toLocaleString()
      }
    return sendObject;
}
const deleteInstruction = (precedence,command,curves)=>{
  const currentDate = new Date();

    const sendObject = {
        precedence: precedence.current,
        command: command,
        array: [],
        index: curves.current.length - 1,
        time: currentDate.toLocaleString()
      }
    return sendObject;
}

export {insertInstruction,deleteInstruction};