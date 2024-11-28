// Navbar.jsx
import React, { useEffect, useState } from 'react'; 
import { useRowCol } from '../context/RowColContext.jsx'; // Import the custom hook
import { createGroup } from '../utils/createGroup.js';
import { socket } from '../socket.js';
const Navbar = () => {
    const { 
            row, column, 
            setRow, setColumn,
            chosenColor,setChosenColor,
            pointerType,setPointerType,
            play,setPlay,
            group,setGroup,
            curves,
            allGroups,
            roomId,setRoomId,
            connected,setConnected
        } = useRowCol();  
    const handleConnect = ()=>{ 
        if(!connected){
            socket.connect(); 
        }
        else{
            socket.disconnect();
        }
        setConnected(!connected)
        // TODO: confirm whether connected then turn connected true;
    } 
    const handleCreateRoom = ()=>{
        socket.emit('createRoom',roomId);
    } 
    const handleJoinRoom = ()=>{
        socket.emit('joinRoom',roomId); 
    }
    useEffect(()=>{console.log('pointerType: ',pointerType);},[pointerType]);
    
    return (
        <>
        {/* keeping these two inputs  for memory sake */}
            <div className="navbar flex justify-center items-center gap-2 pt-2">
                {/* <input
                    type="number"
                    placeholder="Enter number of rows"
                    className="border-solid border-2 border-black pl-2"
                    onChange={(e) => { 
                        if(e.target.value<=100) 
                            setRow(Number(e.target.value))}} 
                    min="1"
                />
                <input
                    type="number"
                    placeholder="Enter number of columns"
                    className="border-solid border-2 border-black pl-2"
                    onChange={(e) => {
                        if(e.target.value<=100)
                            setColumn(Number(e.target.value))}} 
                    min="1"
                /> */}
                {/* eventually move this to sidebar or chat(hamburger) */}
                <button className='border-solid border-2 p-1' onClick={handleConnect}>Connect</button> 
                <input 
                    className='text-center' 
                    type="text" 
                    placeholder='Join Room' 
                    
                    onChange={
                        (e) => setRoomId(e.target.value)
                    }
                    value={roomId}/>
                <button className='border-solid border-2 p-1' onClick={handleJoinRoom}>Join Room</button>
                <button className='border-solid border-2 p-1' onClick={handleCreateRoom}>Create Room</button>
                Color Picker
                <input type="color" id="chosenColor" name="chosenColor" value={chosenColor} onChange={(e)=>{setChosenColor(e.target.value)}}/>
                select pointer type
                <button onClick={()=>{setPointerType("precise")}} className='border-solid border-2 p-1'>Precise</button>
                <button onClick={()=>{setPointerType("selector");}} className='border-solid border-2 p-1'>Selector</button>
                <button onClick={()=>{setPointerType("animatePath");}} className='border-solid border-2 p-1'>Animate Path</button>
                <button onClick={()=>{setPlay(!play)}} className='border-solid border-2 p-1'>Play Animation</button>
                <button onClick={()=>{createGroup(group,allGroups,setGroup);}} className='border-solid border-2 p-1'>Group Selection</button>
                <button onClick={()=>{setPointerType("eraser");}} className='border-solid border-2 p-1'>Eraser</button>
            {/* Rows: {row} <br />
            Columns: {column} */}
            </div>
        </>
    );
}

export default Navbar;
