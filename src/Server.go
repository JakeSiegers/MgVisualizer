package main

import (
	"net/http"
	"log"
	"encoding/json"
	"io/ioutil"
	"strings"
)

var musicQueue []string
var socketWatcher *SocketWatcher

func main() {
	musicQueue = make([]string,0)
	socketWatcher = newSocketWatcher()
	go socketWatcher.run()
	http.Handle("/", http.FileServer(http.Dir("html")))
	http.HandleFunc("/api/", api)
	http.HandleFunc("/webSocket", func(response http.ResponseWriter, request *http.Request) {
		openWebSocket(response, request)
	})
	httpError := http.ListenAndServe(":80", nil)
	if httpError != nil {
		log.Fatal("Failed to start server: ", httpError)
	}
}

func openWebSocket(response http.ResponseWriter, request *http.Request) {
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
	socket := &Socket{connection: connection, send: make(chan string),user:user}
	socketWatcher.register <- socket

	go socket.sendOutgoingMessages()
	go socket.readIncomingMessages()
}

func api(response http.ResponseWriter, request *http.Request){
	urlRune := []rune(request.URL.String()) //runes properly handle unicode lengths (not that we need to here, but anyway)
	action := string(urlRune[5:])
	output := make(map[string]interface{}) //interface is any data type
	switch action {
	case "getMusic":
		output["music"] = getMusic()
	case "getMusicQueue":
		queueGrid := make([][]string,0)
		for _,item := range musicQueue{
			queueGrid = append(queueGrid, []string{item})
		}
		output["musicQueue"] = queueGrid
	case "setMusicQueue":
		setMusicQueue(request)
	default:
		outputError(response,"Bad Action",nil)
		return
	}
	outputSuccess(response,output)
}

func outputSuccess(response http.ResponseWriter,output map[string]interface{}){
	response.Header().Set("Content-Type", "application/json; charset=UTF-8")
	response.WriteHeader(http.StatusOK)
	json.NewEncoder(response).Encode(output)
}

func outputError(response http.ResponseWriter,message string,output map[string]interface{}){

	if output == nil{
		output = make(map[string]interface{})
	}
	response.Header().Set("Content-Type", "application/json; charset=UTF-8")
	response.WriteHeader(http.StatusBadRequest)
	output["error"] = message
	json.NewEncoder(response).Encode(output)
}

func getMusic() [][]string{
	files, err := ioutil.ReadDir("./html/music")
	if err != nil {
		log.Fatal(err)
	}
	music := make([][]string,0)
	for _, file := range files {
		nameRune := []rune(file.Name())
		if "mp3" == strings.ToLower(string(nameRune[len(nameRune)-3:])){
			music = append(music, []string{file.Name()})
		}
	}
	return music
}

func setMusicQueue( request *http.Request){
	body, err := ioutil.ReadAll(request.Body);
	if err != nil{
		panic(err)
	}
	decodedMessage := make(map[string][]string)
	json.Unmarshal(body,&decodedMessage)
	musicQueue = decodedMessage["music"]
	text, _ := json.Marshal(map[string]interface{}{"action": "setMusicQueue", "queue": musicQueue})
	socketWatcher.message <- &SocketMessage{to:"stream",text:string(text)}
}
