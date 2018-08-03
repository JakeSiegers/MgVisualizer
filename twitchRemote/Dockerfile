FROM golang:1.10-alpine
RUN apk --update add git
RUN go get -u github.com/gorilla/websocket
RUN go get -u github.com/tidwall/gjson
RUN go get -u github.com/JakeSiegers/MgVisualizer2018; exit 0
WORKDIR $GOPATH/src/github.com/JakeSiegers/MgVisualizer2018/twitchRemote
RUN echo 'PutPasswordHere' > 'password.txt'
CMD go run twitchRemote.go