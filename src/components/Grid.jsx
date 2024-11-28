import React, { useEffect, useRef, useState } from 'react';
import { useRowCol } from '../context/RowColContext';
import undoIcon from '../assets/undoIcon.svg'
import redoIcon from '../assets/redoIcon.svg'
import { calculateDiff, undo, redo } from '../utils/calculateDiff';
const Grid = () => {
    const { row, column, chosenColor } = useRowCol();
    const [mouseDown, setMouseDown] = useState(false);
    const [click, setClick] = useState(false);
    const defaultColor = 'white';
    let history = useRef([]);
    const [cellColor, setCellColor] = useState(Array(row * column).fill(defaultColor));
    const lastCellColor = useRef(cellColor);
    const currentHead = useRef(-1);
    const x = useRef(0);
    const y = useRef(0); 
    const [gridScale,setGridScale] = useState(1);
    const gridRef = useRef(null);
    console.log('row and column changed');
    const handleClick = (key) => {
        setCellColor((prevColor) => {
            const curColor = [...prevColor]; // cannot do let curColor = cellColor as curColor & cellColor both will end up having the same reference and react doesn't rerender if the reference doesn't change 
            if (curColor[key] !== chosenColor) {
                curColor[key] = chosenColor;
            }

            return curColor;
        });
    }
    const handleMouseEnter = (e,key) => { 
        
        if (mouseDown) {
            setCellColor((prevColor) => {
                const curColor = [...prevColor];
                if (curColor[key] !== chosenColor) {
                    curColor[key] = chosenColor;
                }

                return curColor;
            });
        }
    } 
    // need to implement ctrl + mouseDown + cursor = grid moves in opposite direction
    const handleMoveGrid = (e)=>{
         if(e.ctrlKey && mouseDown){

            

         }
    }
    const handleMouseMove = (e) => {
        x.current = e.clientX;
        y.current = e.clientY;
        console.log(x.current, y.current);
    }
    const handleWheel = (e) => { 
        const gridRect = gridRef.current.getBoundingClientRect(); 
        e.preventDefault();
        console.log(gridRef.current);
        console.log('gridRect top and left',gridRect.top,gridRect.left);
         if(e.deltaY>0){
            setGridScale(Math.max(0.2,gridScale-0.2)); 
         } 
         else{
            setGridScale(gridScale+0.2);
         }
        console.log('wheel moved: ', e.deltaY);
    }
    const renderColumns = () => {
        let grid = [];
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < column; j++) {
                const key = i * column + j;
                grid.push(<div className="grid-item"
                    style={{
                        border: '1px solid black',
                        padding: '0.01rem',
                        textAlign: 'center',
                        backgroundColor: `${cellColor[key]}`,
                        
                    }}
                    key={key}
                    onMouseDown={() => setMouseDown(true)}
                    onMouseUp={() => setMouseDown(false)}
                    onClick={() => { setClick(!click); handleClick(key) }}
                    onMouseEnter={(e) => { handleMouseEnter(e,key) }}
                > </div>);
            }
        }
        return grid;
    }
    const handleUndo = () => {
        const { newCellColor } = undo(currentHead, history, [...cellColor]);
        lastCellColor.current = newCellColor;
        console.log(lastCellColor.current);
        setCellColor((prevColor) => {
            const tempCellColor = [...prevColor];
            for (let i = 0; i < tempCellColor.length; i++) {
                tempCellColor[i] = newCellColor[i];
            }
            return tempCellColor;
        });
    }
    const handleRedo = () => {
        const { newCellColor } = redo(currentHead, history, [...cellColor]);
        lastCellColor.current = newCellColor;
        console.log(lastCellColor.current);
        setCellColor((prevColor) => {
            const tempCellColor = [...prevColor];
            for (let i = 0; i < tempCellColor.length; i++) {
                tempCellColor[i] = newCellColor[i];
            }
            return tempCellColor;
        });
    }
    useEffect(() => {
        // reset all the colors on change in row and columns
        if(row && column){
        setCellColor(Array(row * column).fill(defaultColor));
        setGridScale(1);
        }
    }, [row, column]);
    useEffect(() => {
        if (!mouseDown || click) { // save changes upon mouseUp event
            const diff = calculateDiff(lastCellColor.current, cellColor);
            console.log(currentHead.current)
            if (row && column && Object.keys(diff).length > 0) {
                // Truncate history if the currentHead is not at the latest entry
                if (currentHead.current < history.current.length - 1) {
                    history.current = history.current.slice(0, currentHead.current + 1);
                }

                // Push new entry to history
                history.current.push({ row, column, diff });
                currentHead.current = history.current.length - 1;
                // update lastCellColor.current based on the latest entry in the history
            }

        }
        lastCellColor.current = cellColor;

    }, [mouseDown, click]); 
    useEffect(() => {
        const gridElement = gridRef.current;

        const wheelListener = (e) => handleWheel(e);

        // Add the event listener
        gridElement.addEventListener('wheel', wheelListener, { passive: false });

        // Cleanup the event listener on component unmount
        return () => {
            gridElement.removeEventListener('wheel', wheelListener);
        };
    }, [gridScale]);
    return (
        <div className='flex justify-center flex-col items-center gap-1'>
            GRID
            <div
                className="grid"
                style={
                    {
                        gridTemplateColumns: `repeat(${column},${'100' / column}%)`,
                        height: '500px',
                        width: '100%',
                        maxHeight: '500px',
                        maxWidth: '500px',
                        cursor: 'crosshair',
                        transform: `scale(${gridScale})`
                    }
                }
                ref = {gridRef} 
                onKeyDown={(e)=>{handleMoveGrid(e)}}
            >
                {renderColumns()}
                {console.log('row and column changed and component rerendered')}

            </div>
            <div className='flex gap-5'>
                <div className='undo w-5' onClick={handleUndo}><img src={undoIcon} alt="undo" /></div>
                <div className='redo w-5' onClick={handleRedo}><img src={redoIcon} alt="redo" /></div>

            </div>
        </div>
    );
}

export default Grid; 
