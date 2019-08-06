package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/tidwall/gjson"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"
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
	send       chan string
}

type SocketWatcher struct {
	sockets    map[*Socket]bool
	broadcast  chan string
	register   chan *Socket
	unregister chan *Socket
}

var (
	newline  = []byte{'\n'}
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			//Allow any origin! (Cross origin)
			return true
		},
	}
	socketWatcher *SocketWatcher
	secret string
)

func main() {
	b, err := ioutil.ReadFile("password.txt")
	if err != nil {
		fmt.Print(err)
	}
	secret = string(b)

	socketWatcher = newSocketWatcher()
	go socketWatcher.run()
	//No html endpoint needed
	//http.Handle("/", http.FileServer(http.Dir("../html")))
	http.HandleFunc("/api/", httpHandler)
	http.HandleFunc("/webSocket", func(response http.ResponseWriter, request *http.Request) {
		openWebSocket(response, request)
	})
	port := ":18080"
	log.Println("Listening on " + port)
	httpError := http.ListenAndServe(port, nil)
	if httpError != nil {
		log.Fatal("Failed to start server: ", httpError)
	}
}

func httpHandler(response http.ResponseWriter, request *http.Request) {

	log.Println("--------------")
	query := request.URL.Query()
	//log.Printf("%v\n",request.URL.Query())
	//for k, v := range request.Header {
	//	log.Printf("Header field %q, Value %q\n", k, v)
	//}

	switch request.Method {
	case "GET":
		log.Println("GET REQUEST")
		if val, ok := query["hub.challenge"]; ok {
			response.WriteHeader(http.StatusOK)
			log.Printf("Sending %v\n", val[0])
			fmt.Fprint(response, val[0])
		}
		break
	case "POST":
		log.Println("POST REQUEST")
		body, _ := ioutil.ReadAll(request.Body)
		log.Println(string(body))
		/*
		if !isValidSignature(request,secret) {
			log.Println("DENIED")
			response.WriteHeader(http.StatusNotFound)
		}else{
			log.Println("Success!")
			from := gjson.Get(string(body), "data.#.from_id")
			for _, id := range from.Array() {
				socketWatcher.broadcast <- id.String()
			}
		}
		*/

		signature := request.Header.Get("X-Hub-Signature")

		key := []byte(secret)
		shaObj := hmac.New(sha256.New, key)
		shaObj.Write(body)
		hash := shaObj.Sum(nil)
		stringHash := fmt.Sprintf("%x", hash)
		log.Printf("Looking For Hash: %s\n" + stringHash)

		if len(signature) > 7 {
			foundHash := strings.SplitN(request.Header.Get("X-Hub-Signature"), "=", 2)[0]
			log.Printf("Found Hash: %s\n", foundHash)
			if foundHash == stringHash {
				log.Println("Success!")
				from := gjson.Get(string(body), "data.#.from_id")
				for _, id := range from.Array() {
					socketWatcher.broadcast <- id.String()
				}
				return
			}
		}
		log.Println("DENIED")
		response.WriteHeader(http.StatusNotFound)

		break
	default:
		log.Println("OTHER REQUEST")
		response.WriteHeader(http.StatusNotFound)
	}
}

func isValidSignature(r *http.Request, key string) bool {
	// Assuming a non-empty header

	gotHash := strings.SplitN(r.Header.Get("X-Hub-Signature"), "=", 2)
	if gotHash[0] != "sha256" {
		return false
	}
	defer r.Body.Close()

	b, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Printf("Cannot read the request body: %s\n", err)
		return false
	}

	hash := hmac.New(sha256.New, []byte(key))
	if _, err := hash.Write(b); err != nil {
		log.Printf("Cannot compute the HMAC for request: %s\n", err)
		return false
	}

	expectedHash := hex.EncodeToString(hash.Sum(nil))
	log.Println("GOT HASH:", gotHash[1])
	log.Println("EXPECTED HASH:", expectedHash)
	return gotHash[1] == expectedHash
}

func (socketWatcher *SocketWatcher) run() {
	/*
		ticker := time.NewTicker(5 * time.Second)
		quit := make(chan struct{})
		go func() {
			for {
				select {
				case <- ticker.C:
					socketWatcher.broadcast <- "44322889"
				case <- quit:
					ticker.Stop()
					return
				}
			}
		}()
	*/

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
			messageObj := map[string]string{"action": "userFollow", "userId": message}
			jsonStr, _ := json.Marshal(messageObj)
			message = string(jsonStr)
			log.Println("Brodcast: " + message)
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
		broadcast:  make(chan string),
		register:   make(chan *Socket),
		unregister: make(chan *Socket),
		sockets:    make(map[*Socket]bool),
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
