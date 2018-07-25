package main

import (
	"net/http"
	"log"
	"time"
	"github.com/gorilla/websocket"
	"encoding/json"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second
	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second
	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10
)

type Socket struct {
	connection *websocket.Conn
	send chan string
}

type SocketWatcher struct {
	sockets map[*Socket]bool
	broadcast chan string
	register chan *Socket
	unregister chan *Socket
}

var (
	newline = []byte{'\n'}
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	socketWatcher *SocketWatcher
)

func main(){
	socketWatcher = newSocketWatcher()
	go socketWatcher.run()
	http.HandleFunc("/", httpHandler)
	http.HandleFunc("/webSocket", func(response http.ResponseWriter, request *http.Request) {
		openWebSocket(response, request)
	})
	port := ":8080"
	log.Println("Listening on "+port)
	httpError := http.ListenAndServe(port, nil)
	if httpError != nil {
		log.Fatal("Failed to start server: ", httpError)
	}
}

func httpHandler(response http.ResponseWriter, request *http.Request){
	socketWatcher.broadcast <- "Someone Subscribed"
	output := make(map[string]interface{})
	output["success"] = true
	response.Header().Set("Content-Type", "application/json; charset=UTF-8")
	response.WriteHeader(http.StatusOK)
	json.NewEncoder(response).Encode(output)
}

func (socketWatcher *SocketWatcher) run() {
	for {
		select {
		case client := <-socketWatcher.register:
			socketWatcher.sockets[client] = true
			break
		case client := <-socketWatcher.unregister:
			if _, ok := socketWatcher.sockets[client]; ok {
				delete(socketWatcher.sockets, client)
				close(client.send)
			}
			break
		case message := <-socketWatcher.broadcast:
			log.Println(message)
			for socket := range socketWatcher.sockets {
				select {
				case socket.send <- message:
				default:
					close(socket.send)
					delete(socketWatcher.sockets, socket)
				}
			}
			break
		}
	}
}

func newSocketWatcher() *SocketWatcher {
	return &SocketWatcher{
		broadcast: make(chan string),
		register: make(chan *Socket),
		unregister: make(chan *Socket),
		sockets: make(map[*Socket]bool),
	}
}

func openWebSocket(response http.ResponseWriter, request *http.Request) {
	log.Println("Remote connected!")
	connection, upgradeError := upgrader.Upgrade(response, request, nil)
	if upgradeError != nil {
		log.Println(upgradeError)
		return
	}
	socket := &Socket{connection: connection, send: make(chan string)}
	socketWatcher.register <- socket

	go socket.sendOutgoingMessages()
}

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

			writer, err := socket.connection.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			writer.Write([]byte(message))

			total := len(socket.send)
			for i := 0; i < total; i++ {
				writer.Write(newline)
				writer.Write([]byte(<-socket.send))
			}
			if err := writer.Close(); err != nil {
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