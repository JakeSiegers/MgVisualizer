FROM golang:1.12-alpine
RUN apk --update add git build-base
RUN git clone https://github.com/JakeSiegers/MgVisualizer /MgVisualizer
WORKDIR /MgVisualizer/twitchRemote
RUN go test
COPY 'password.txt' 'password.txt'
CMD go run twitchRemote.go