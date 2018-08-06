package main

import (
	"log"
)

type SocketWatcher struct {
	sockets        map[*Socket]bool
	labeledSockets map[string]*Socket
	broadcast      chan string
	message        chan *SocketMessage
	register       chan *Socket
	unregister     chan *Socket
}

type SocketMessage struct {
	to    string
	text  string
	from  *Socket
	noLog bool
}

//Must start with a capitol to "export" (be accessible by json library)..... kinda garbage if you ask me :/
type WebSocketErrorOut struct {
	Error bool
	Text  string
}

func newSocketWatcher() *SocketWatcher {
	return &SocketWatcher{
		broadcast:      make(chan string),
		message:        make(chan *SocketMessage),
		register:       make(chan *Socket),
		unregister:     make(chan *Socket),
		sockets:        make(map[*Socket]bool),
		labeledSockets: make(map[string]*Socket),
	}
}

func (socketWatcher *SocketWatcher) run() {
	for {
		select {
		case client := <-socketWatcher.register:
			socketWatcher.sockets[client] = true
			socketWatcher.labeledSockets[client.user] = client
			break
		case client := <-socketWatcher.unregister:
			if _, ok := socketWatcher.sockets[client]; ok {
				delete(socketWatcher.sockets, client)
				delete(socketWatcher.labeledSockets, client.user)
				close(client.send)
			}
			break
		case message := <-socketWatcher.broadcast:
			for socket := range socketWatcher.sockets {
				select {
				case socket.send <- message:
				default:
					close(socket.send)
					delete(socketWatcher.sockets, socket)
				}
			}
			break
		case message := <-socketWatcher.message:
			if val, ok := socketWatcher.labeledSockets[message.to]; ok {
				if !message.noLog {
					log.Println("Sending " + string(message.text) + " To " + string(message.to))
				}
				val.send <- message.text
			} else {
				if !message.noLog {
					log.Println("Could Not Find User " + string(message.to))
				}
				if message.from != nil {
					message.from.errorMessage("Could Not Find User " + string(message.to))
				}
			}
			break
		}
	}
}
