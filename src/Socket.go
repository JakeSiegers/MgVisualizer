package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"io/ioutil"
	"log"
	"os/exec"
	"time"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second
	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second
	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10
	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var (
	newline  = []byte{'\n'}
	space    = []byte{' '}
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

type Socket struct {
	connection *websocket.Conn
	send       chan string
	user       string
}

func (socket *Socket) errorMessage(msg string) {
	encodedJson, err := json.Marshal(&WebSocketErrorOut{Error: true, Text: msg})
	if err != nil {
		fmt.Println("error:", err)
	}
	socket.send <- string(encodedJson)
}

//Listens to the browser client web socket connection for any incoming messages.
//Parses the command and sends it to the appropriate client
func (socket *Socket) readIncomingMessages() {
	defer func() {
		log.Println("Closing Read")
		socketWatcher.unregister <- socket
		socket.connection.Close()
	}()
	socket.connection.SetReadLimit(maxMessageSize)
	socket.connection.SetReadDeadline(time.Now().Add(pongWait))
	socket.connection.SetPongHandler(func(string) error { socket.connection.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := socket.connection.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))

		decodedMessage := make(map[string]string)
		json.Unmarshal(message, &decodedMessage)
		//fmt.Printf("%v",decodedMessage["action"])
		if val, ok := decodedMessage["action"]; ok && val == "getFrame" {
			go getVideoFrame(decodedMessage["timestamp"])
		} else if val, ok := decodedMessage["to"]; ok {
			log.Println(val)
			socketWatcher.message <- &SocketMessage{to: decodedMessage["to"], text: string(message), from: socket}
		} else {
			socket.errorMessage("To: required")
		}

		/*
			if bytes.Compare(message,[]byte("message")) == 0 {
				socket.socketWatcher.message <- &text{to: []byte("someone"), message: message}
			}else{
				socket.socketWatcher.broadcast <- message
			}
		*/
	}
}

//Listens to the send channel on the socket. If Anything shows up, it sends it out to it's websocket browser client.
func (socket *Socket) sendOutgoingMessages() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		log.Println("Closing write")
		ticker.Stop()
		socket.connection.Close()
	}()
	for {
		select {
		case message, ok := <-socket.send:
			socket.connection.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				socket.connection.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := socket.connection.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write([]byte(message))

			n := len(socket.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write([]byte(<-socket.send))
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			socket.connection.SetWriteDeadline(time.Now().Add(writeWait))
			if err := socket.connection.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func getVideoFrame(timestamp string) {
	log.Println(timestamp)
	files, _ := ioutil.ReadDir("C:\\Users\\jsiegers\\Videos\\2018\\")
	if len(files) == 0 {
		return
	}
	lastFile := files[len(files)-1].Name()
	log.Println(lastFile)
	filename := "C:\\Users\\jsiegers\\Videos\\2018\\" + lastFile
	//log.Println(filename)
	width := 355
	height := 200
	//log.Println("cmd")
	cmd := exec.Command("C:\\Users\\jsiegers\\Desktop\\ffmpeg-4.0.2-win64-static\\bin\\ffmpeg.exe", "-ss", timestamp, "-i", filename, "-vframes", "1", "-s", fmt.Sprintf("%dx%d", width, height), "-f", "singlejpeg", "-")
	var buffer bytes.Buffer
	cmd.Stdout = &buffer
	//log.Println("run")
	if cmd.Run() != nil {
		log.Println("Failed to get video frame " + filename)
		return
	}
	//log.Println("b64");
	base64Str := base64.StdEncoding.EncodeToString(buffer.Bytes())
	text, _ := json.Marshal(map[string]interface{}{"action": "frame", "image": base64Str})
	socketWatcher.message <- &SocketMessage{to: "remote", text: string(text)}
}
