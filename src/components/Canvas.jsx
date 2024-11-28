import React, { useRef, useEffect, useState } from 'react';
import { useRowCol } from '../context/RowColContext.jsx'; // Import the custom hook
import pointerToClassMap from '../constants/pointerTypeToClassNameMap.js';
import { redrawCanvas } from '../utils/redrawCanvas.js';
import { createAnimation } from '../utils/createAnimation.js';
import { createOutline } from '../utils/createOutline.js';
import { playAnimation } from '../utils/playAnimation.js';
import { erase } from '../utils/eraser.js';
import { socket } from '../socket.js';
const Canvas = () => {
  const canvasRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const { pointerType, play, setPlay, group, setGroup, curves, allGroups, eraserWidth, roomId,precedence,isDisabled,setIsDisabled } = useRowCol();
  const currentCurve = useRef([]);
  const startingX = useRef(-1);
  const startingY = useRef(-1);
  const [canvasColor, setCanvasColor] = useState('white');
  const mouseDown = useRef(false);
  const ctx = useRef(null);
  const previouslySelected = useRef(-1);
  const selectedCurve = useRef(-1);
  let canvas = null;
  const selectionResolution = 10; // number of pixels +- we select something
  const animationList = useRef([]);
  const [offsetTop, setOffsetTop] = useState(0); // adjusting for the canvas not being on the topmost part of the page
  const currentPath = useRef([]);
  const longestAnimationLength = useRef(0);
  const handleMouseUp = (e) => {
    console.log('mouseUp');
    if (currentCurve.current.length !== 0 && pointerType !== 'eraser') {
      curves.current.push(currentCurve.current);
      const currentDate = new Date();
      const sendObject = {
        precedence: precedence.current,
        command: 'i',
        array: currentCurve.current,
        index: curves.current.length - 1,
        time: currentDate.toLocaleString()
      }
      socket.emit('updateCurves', roomId, sendObject);
      console.log(curves.current);
      currentCurve.current = [];
    }

    selectedCurve.current = -1;
    if (pointerType === 'animatePath' && previouslySelected.current !== -1 && currentPath.current.length !== 0) {
      createAnimation(longestAnimationLength, currentPath, allGroups, animationList, previouslySelected, curves);
    }
    startingX.current = -1;
    startingY.current = -1;
    mouseDown.current = false;
  }
  const handleMouseDown = (e) => {
    console.log('mouseDown');
    if (pointerType === 'selector') {

      for (let index = 0; index < curves.current.length; index++) {
        const curve = curves.current[index];
        console.log(curve.length);
        for (let i = 0; i < curve.length; i++) {
          const mouseObject = curve[i];
          console.log(mouseObject.x, mouseObject.y, e.clientX, e.clientY - offsetTop);
          if ((mouseObject.x - selectionResolution <= e.clientX && mouseObject.x + selectionResolution >= e.clientX) && ((mouseObject.y - selectionResolution <= e.clientY - offsetTop) && (mouseObject.y + selectionResolution >= e.clientY - offsetTop))) {
            selectedCurve.current = index;
            previouslySelected.current = index;
            break;
          }
        }

        if (selectedCurve.current !== -1) {
          break;
        }

      }
      if (selectedCurve.current !== -1) {
        // store selected curve in group 

        let isInGroup = group.find((curve) => curve === selectedCurve.current);
        if (!isInGroup) {
          setGroup([...group, selectedCurve.current]);
        }
        //create outline rectangle
        createOutline(curves, selectedCurve, ctx);

      }
      console.log('curve index selected: ', selectedCurve.current);
    }
    else if (pointerType === 'eraser') {
      erase(curves, e, offsetTop, eraserWidth,precedence,roomId);

      redrawCanvas(ctx, canvasRef, curves, offsetTop); // Redraw after erasing
      
    }
    if (startingX.current === -1 && startingY.current === -1) { // starting(x,y) of an arc drawing

      startingX.current = e.clientX;
      startingY.current = e.clientY;
      if (pointerType === 'precise') {
        currentCurve.current.push({ x: e.clientX, y: e.clientY - offsetTop }); // storing the current position of the cursor

      }
      else if (pointerType === 'animatePath') {
        currentPath.current.push({ x: e.clientX, y: e.clientY - offsetTop });
      }

      mouseDown.current = true;
    }
  }
  const handleMouseMove = (e) => {
    setCursorPosition({
      x: e.clientX,
      y: e.clientY
    }
    )
    if (mouseDown.current && pointerType !== 'selector') {

      if (pointerType === 'precise') {
        currentCurve.current.push({ x: e.clientX, y: e.clientY - offsetTop });

      }
      else if (pointerType === 'animatePath') {
        currentPath.current.push({ x: e.clientX, y: e.clientY - offsetTop });
      }
      else if (pointerType === 'eraser' && mouseDown.current) {
        erase(curves, e, offsetTop, eraserWidth,precedence,roomId);

        redrawCanvas(ctx, canvasRef, curves, offsetTop); // Redraw after erasing
      }


      if (pointerType !== 'eraser') {
        console.log('mouseup: starting(x,y) and ending(x,y):', startingX.current, startingY.current, cursorPosition.x, cursorPosition.y);
        ctx.current.beginPath();
        ctx.current.moveTo(startingX.current, startingY.current - offsetTop);
        ctx.current.lineTo(cursorPosition.x, cursorPosition.y - offsetTop);
        ctx.current.stroke();
        startingX.current = cursorPosition.x;
        startingY.current = cursorPosition.y;
      }

    }
    if (mouseDown.current && pointerType === 'selector' && selectedCurve.current !== -1) {
      let dx = Number(e.clientX) - Number(startingX.current);
      let dy = Number(e.clientY) - Number(startingY.current);
      let curve = curves.current[selectedCurve.current];
      console.log(dx);
      // deleting old path
      for (let i = 0; i < curve.length; i++) {
        curve[i].x = curve[i].x + dx;
        curve[i].y = curve[i].y + dy;
      }
      // redrawing the whole canvas
      redrawCanvas(ctx, canvasRef, curves, offsetTop);
      startingX.current = e.clientX;
      startingY.current = e.clientY;
    }

  }

  useEffect(() => {
    playAnimation(canvas, canvasRef, ctx, curves, animationList, offsetTop, setOffsetTop, longestAnimationLength, play, setPlay);
  }, [play]);
  useEffect(() => {

    socket.on('updateCurves', (reply) => {

      // merge conflicts 
      // recived object is an instruction of the form sendObject
      reply = reply.recievedObject;
      if(roomId && precedence?.current !== 0 && ('last' in reply)){
        console.log('here');

        // intially we test only with the insert command
          if(reply.command === 'i'){
            curves.current[reply.index]= reply.array;
          }
          redrawCanvas(ctx,canvasRef,curves,offsetTop);
          if(reply.last === 0 ){
            setIsDisabled(true);

          }
          else{
            setIsDisabled(false);
          }
      }
      if(!('last' in reply)){
        if(reply.command==='i'){
          if(curves.current.length-1 > reply.index){ 
            // probably we never reach here
              const beforeIndex = curves.current.slice(0, reply.index);
              const atIndex = [curves.current[reply.index]];
              const afterIndex = curves.current.slice(reply.index + 1);
              const newCurves = [...beforeIndex, ...atIndex, ...afterIndex];
              curves.current = newCurves;
            }
            else if(curves.current.length-1 < reply.index){
              curves.current.push(reply.array);
            }
            else if(curves.current.length-1 === reply.index){
              // conflict condition 
              // order of resolution -> precedence
              const temp = curves.current[reply.index]; 
              if(reply.precedence>precedence.current){
                  curves.current[reply.index] = reply.array; 
                  curves.current.push(temp);
              }
          } 
        } 
        else if(reply.command === 'd'){
            curves.current.splice(reply.index,1);
        }

        redrawCanvas(ctx,canvasRef,curves,offsetTop);
      }
      
    });
    return (() => {
      socket.off('updateCurves');
    })
  }, [roomId]);



  return (
    <div className={`canvas-container w-screen h-screen overflow-auto border border-black  ${((pointerToClassMap[pointerType] !== 'custom-dot') && (pointerToClassMap[pointerType] !== 'eraser')) ? 'cursor-default' : 'cursor-none'}` }

      onMouseDown={(e) => {
        handleMouseDown(e);
      }}
      onMouseUp={(e) => {
        handleMouseUp(e);
      }}
      onMouseMove={(e) => {
        handleMouseMove(e);
      }}
    >
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} style = {{pointerEvents: `${isDisabled}?'none':'auto'`}}/>

      <div
        className={`${pointerToClassMap[pointerType]}`}

        style={{
          top: `${cursorPosition.y - offsetTop}px`,
          left: `${cursorPosition.x}px`,
        }}
      ></div>

    </div>
  );
};
export default Canvas;