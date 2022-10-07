FROM golang:1.18-bullseye as build

WORKDIR /opt/dist

COPY go.mod .
COPY *go.sum .

RUN go mod download 

COPY . .

RUN go build -o /app

FROM debian:bullseye-slim

WORKDIR /

RUN apt-get -y -qq update && \
    apt-get -y -qq --no-install-recommends install ca-certificates

COPY --from=build /app /app 