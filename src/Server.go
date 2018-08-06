package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
)

var musicQueue []string
var socketWatcher *SocketWatcher

func main() {
	musicQueue = make([]string, 0)
	socketWatcher = newSocketWatcher()
	go socketWatcher.run()
	//go watchFiles(socketWatcher)
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
	params, ok := request.URL.Query()["user"]
	if !ok || len(params[0]) < 1 {
		http.Error(response, "Bad Parameters", http.StatusBadRequest)
		return
	}
	user := params[0]
	if _, ok := socketWatcher.labeledSockets[user]; ok {
		log.Println(user + " already exists!")
		http.Error(response, "User Already Exists", http.StatusBadRequest)
		return
	}

	log.Println(user + " connected!")

	connection, upgradeError := upgrader.Upgrade(response, request, nil)
	if upgradeError != nil {
		log.Println(upgradeError)
		return
	}
	socket := &Socket{connection: connection, send: make(chan string), user: user}

	socketWatcher.register <- socket
	go socket.sendOutgoingMessages()
	go socket.readIncomingMessages()
}

func api(response http.ResponseWriter, request *http.Request) {
	urlRune := []rune(request.URL.String()) //runes properly handle unicode lengths (not that we need to here, but anyway)
	action := string(urlRune[5:])
	output := make(map[string]interface{}) //interface is any data type
	switch action {
	case "getMusicGrid":
		output["music"] = getMusicGrid()
	case "getMusicQueueGrid":
		output["musicQueue"] = getMusicQueueGrid()
	case "getMusicQueue":
		output["musicQueue"] = musicQueue
	case "setMusicQueue":
		setMusicQueue(request)
	default:
		outputError(response, "Bad Action", nil)
		return
	}
	outputSuccess(response, output)
}

func outputSuccess(response http.ResponseWriter, output map[string]interface{}) {
	response.Header().Set("Content-Type", "application/json; charset=UTF-8")
	response.WriteHeader(http.StatusOK)
	json.NewEncoder(response).Encode(output)
}

func outputError(response http.ResponseWriter, message string, output map[string]interface{}) {

	if output == nil {
		output = make(map[string]interface{})
	}
	response.Header().Set("Content-Type", "application/json; charset=UTF-8")
	response.WriteHeader(http.StatusBadRequest)
	output["error"] = message
	json.NewEncoder(response).Encode(output)
}

func getMusicGrid() [][]string {
	files, err := ioutil.ReadDir("./html/music")
	if err != nil {
		log.Fatal(err)
	}
	music := make([][]string, 0)
	for _, file := range files {
		nameRune := []rune(file.Name())
		if "mp3" == strings.ToLower(string(nameRune[len(nameRune)-3:])) {
			music = append(music, []string{file.Name()})
		}
	}
	return music
}

func getMusicQueueGrid() [][]string {
	queueGrid := make([][]string, 0)
	for _, item := range musicQueue {
		queueGrid = append(queueGrid, []string{item})
	}
	return queueGrid
}

func setMusicQueue(request *http.Request) {
	body, err := ioutil.ReadAll(request.Body)
	if err != nil {
		panic(err)
	}
	decodedMessage := make(map[string][]string)
	json.Unmarshal(body, &decodedMessage)
	musicQueue = decodedMessage["music"]
	text, _ := json.Marshal(map[string]interface{}{"action": "setMusicQueue", "queue": musicQueue})
	socketWatcher.message <- &SocketMessage{to: "stream", text: string(text)}
}

/*
func watchFiles(watcher *SocketWatcher){
	for{
		time.Sleep(time.Second)
		filename := "C:\\Users\\jsiegers\\Videos\\2018\\2018-08-06_13-12-44.mkv"
		width := 300
		height := 169
		cmd := exec.Command("C:\\Users\\jsiegers\\Desktop\\ffmpeg-4.0.2-win64-static\\bin\\ffmpeg.exe", "-i", filename, "-vframes", "1", "-s", fmt.Sprintf("%dx%d", width, height), "-f", "singlejpeg","-ss","10","-")
		var buffer bytes.Buffer
		cmd.Stdout = &buffer
		if cmd.Run() != nil {
			log.Println("Failed to get video frame "+filename)
			continue
		}
		base64Str := base64.StdEncoding.EncodeToString(buffer.Bytes())

		text, _ := json.Marshal(map[string]interface{}{"action": "frame","image": base64Str})
		watcher.message <- &SocketMessage{to:"remote",text:string(text),noLog:true}

	}
}
*/
