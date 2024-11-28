//RowColContext.jsx
import React, {createContext, useState,useContext, useRef} from 'react'; 
const rowColContext = createContext(); 

const Provider = ({children})=>{
    const [row,setRow] = useState(null); 
    const [column,setColumn] = useState(null); 
    const [chosenColor,setChosenColor] = useState('#ff0000');
    const [pointerType,setPointerType] = useState('precise');
    const [play,setPlay] = useState(false);
    const [group,setGroup] = useState([]);
    const curves = useRef([]);
    const allGroups = useRef([]);
    const [eraserWidth,setEraserWidth] = useState(10);
    const [roomId,setRoomId] = useState('');
    const [connected,setConnected] = useState(false);
    const precedence = useRef(null);
    const [isDisabled,setIsDisabled] = useState(false);
    return (
        // we'll need to save all of these in cookies or local storage
        <rowColContext.Provider value = {
            {
                row,column,
                setRow,setColumn,
                chosenColor,
                setChosenColor,
                pointerType,setPointerType,
                play,setPlay,
                group,setGroup,
                curves,allGroups,
                eraserWidth,setEraserWidth,
                roomId, setRoomId,
                connected,setConnected,
                precedence,
                isDisabled,setIsDisabled
            }
        }>
            {children}
        </rowColContext.Provider>
    );
}
export const useRowCol = () => {
    return useContext(rowColContext); // Custom hook to use context easily
}

export {Provider,rowColContext};