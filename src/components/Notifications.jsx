import { useEffect, useState } from "react";
import { socket } from "../socket";
import { useRowCol } from "../context/RowColContext";

const Notifications = () => {
    const [reply, setReply] = useState('');
    const {precedence,roomId,setRoomId,curves,isDisabled,setIsDisabled} = useRowCol();
    useEffect(() => {
        const handleServerReply = (msg) => {
            console.log(msg);
            if(typeof msg === 'object'){
                if('precedence' in msg){
                    precedence.current = msg.precedence;
                    console.log(precedence.current);
                }
                if(msg.msg === 'new user joined' && precedence?.current===0){
                    console.log('parent user',roomId);
                    const currentDate = new Date();
                    curves.current.forEach((curve,index)=>{
                        console.log('entered for loop');
                        const isLast = index === curves.current.length-1;
                        const sendObject = {
                            precedence: precedence.current,
                            command: 'i',
                            array: curve,
                            index: index,
                            time: currentDate.toLocaleString(),
                            last: isLast
                          }
                        console.log('after sendObject');
                          socket.emit('updateCurves', roomId, sendObject);
                        })
                    
                }
                
            }
            setReply(JSON.stringify(msg));

            setTimeout(() => { // potential issue if while resetting we get another value
                setReply('');
            }, 3000); 
        };

        socket.on('serverReply', handleServerReply);

        return () => {
            socket.off('serverReply', handleServerReply);
        };
    }, [roomId]);

    return (
        <>
            {reply && <div className="absolute ">{reply}</div>}
        </>
    );
}

export default Notifications;
