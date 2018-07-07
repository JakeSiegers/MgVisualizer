package main

import (
	"net/http"
	"log"
)

func main() {
	socketWatcher := newSocketWatcher()
	go socketWatcher.run()
	http.Handle("/", http.FileServer(http.Dir("html")))
	http.HandleFunc("/webSocket", func(response http.ResponseWriter, request *http.Request) {
		openWebSocket(socketWatcher, response, request)
	})
	httpError := http.ListenAndServe(":8080", nil)
	if httpError != nil {
		log.Fatal("Failed to start server: ", httpError)
	}
}

func openWebSocket(socketWatcher *SocketWatcher, response http.ResponseWriter, request *http.Request) {
	params,ok := request.URL.Query()["user"]
	if !ok || len(params[0]) < 1{
		http.Error(response, "Bad Parameters", http.StatusBadRequest)
		return
	}
	user := params[0]
	log.Println(user+" connected!")

	connection, upgradeError := upgrader.Upgrade(response, request, nil)
	if upgradeError != nil {
		log.Println(upgradeError)
		return
	}
	socket := &Socket{socketWatcher: socketWatcher, connection: connection, send: make(chan string),user:user}
	socket.socketWatcher.register <- socket

	go socket.sendOutgoingMessages()
	go socket.readIncomingMessages()
}